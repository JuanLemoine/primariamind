import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAppointmentSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validated = createAppointmentSchema.parse(body);

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Get slot details and verify it's available
    const { data: slot, error: slotError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('id', validated.slot_id)
      .eq('status', 'free')
      .single();

    if (slotError || !slot) {
      return NextResponse.json(
        { error: 'El horario seleccionado ya no está disponible' },
        { status: 409 }
      );
    }

    // Start transaction-like operations
    // 1. Reserve the slot (optimistic lock)
    const { error: reserveError } = await supabase
      .from('availability_slots')
      .update({ status: 'reserved' })
      .eq('id', validated.slot_id)
      .eq('status', 'free'); // Only update if still free

    if (reserveError) {
      console.error('Error reserving slot:', reserveError);
      return NextResponse.json(
        { error: 'Error al reservar el horario' },
        { status: 500 }
      );
    }

    // 2. Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        therapist_id: slot.therapist_id,
        slot_id: slot.id,
        start_ts: slot.start_ts,
        end_ts: slot.end_ts,
        status: 'scheduled',
      })
      .select()
      .single();

    if (appointmentError) {
      // Rollback: free the slot
      await supabase
        .from('availability_slots')
        .update({ status: 'free' })
        .eq('id', validated.slot_id);

      console.error('Error creating appointment:', appointmentError);
      return NextResponse.json(
        { error: 'Error al crear la cita' },
        { status: 500 }
      );
    }

    // 3. Mark slot as booked
    await supabase
      .from('availability_slots')
      .update({ status: 'booked' })
      .eq('id', validated.slot_id);

    // 4. Update referral if provided
    if (validated.referral_id) {
      await supabase
        .from('referrals')
        .update({
          status: 'assigned',
          assigned_therapist_id: slot.therapist_id,
        })
        .eq('id', validated.referral_id);
    }

    // Get therapist info for response
    const { data: therapist } = await supabase
      .from('therapists')
      .select(`
        profiles (
          full_name
        )
      `)
      .eq('therapist_id', slot.therapist_id)
      .single();

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        therapist_name: (therapist as any)?.profiles?.full_name || 'Terapeuta',
        start_ts: appointment.start_ts,
        end_ts: appointment.end_ts,
        status: appointment.status,
      },
      message: 'Cita agendada exitosamente',
    });

  } catch (error: any) {
    console.error('Appointment API error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
