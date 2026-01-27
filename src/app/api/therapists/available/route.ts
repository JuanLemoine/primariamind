import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { availabilityQuerySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const specialty = searchParams.get('specialty') || undefined;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Los parámetros from y to son requeridos' },
        { status: 400 }
      );
    }

    // Validate
    availabilityQuerySchema.parse({ specialty, from, to });

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Build query for available slots
    let query = supabase
      .from('availability_slots')
      .select(`
        id,
        therapist_id,
        start_ts,
        end_ts,
        status,
        therapists!inner (
          therapist_id,
          bio,
          languages,
          is_available,
          profiles!inner (
            full_name
          ),
          therapist_specialties (
            specialties (
              id,
              slug,
              name
            )
          )
        )
      `)
      .eq('status', 'free')
      .eq('therapists.is_available', true)
      .gte('start_ts', from)
      .lte('start_ts', to)
      .order('start_ts', { ascending: true });

    const { data: slots, error } = await query;

    if (error) {
      console.error('Error fetching availability:', error);
      return NextResponse.json(
        { error: 'Error al buscar disponibilidad' },
        { status: 500 }
      );
    }

    // Filter by specialty if provided
    let filteredSlots = slots || [];
    if (specialty) {
      filteredSlots = filteredSlots.filter((slot: any) => {
        const therapistSpecialties = slot.therapists?.therapist_specialties || [];
        return therapistSpecialties.some(
          (ts: any) => ts.specialties?.slug === specialty
        );
      });
    }

    // Transform response
    const availableSlots = filteredSlots.map((slot: any) => ({
      id: slot.id,
      therapist_id: slot.therapist_id,
      therapist_name: slot.therapists?.profiles?.full_name || 'Terapeuta',
      therapist_bio: slot.therapists?.bio,
      languages: slot.therapists?.languages || ['es'],
      specialties: (slot.therapists?.therapist_specialties || []).map(
        (ts: any) => ts.specialties
      ).filter(Boolean),
      start_ts: slot.start_ts,
      end_ts: slot.end_ts,
    }));

    return NextResponse.json({
      slots: availableSlots,
      total: availableSlots.length,
    });

  } catch (error: any) {
    console.error('Availability API error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
