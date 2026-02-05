import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET - Fetch user profile + emergency contact
export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: emergencyContact } = await adminClient
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    return NextResponse.json({
      profile: profile || null,
      emergency_contact: emergencyContact || null,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar perfil' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile + emergency contact
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { profile: profileData, emergency_contact: ecData } = body;

    // Update profile
    if (profileData) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          full_name: profileData.full_name || null,
          country: profileData.country || null,
          city: profileData.city || null,
          age_range: profileData.age_range || null,
          gender: profileData.gender || null,
          education_level: profileData.education_level || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
    }

    // Update or create emergency contact
    if (ecData) {
      const { data: existing } = await adminClient
        .from('emergency_contacts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (existing) {
        const { error: ecError } = await adminClient
          .from('emergency_contacts')
          .update({
            name: ecData.name,
            phone: ecData.phone,
            relation: ecData.relation,
            consent_notify: ecData.consent_notify,
          })
          .eq('user_id', user.id);

        if (ecError) throw ecError;
      } else {
        const { error: ecError } = await adminClient
          .from('emergency_contacts')
          .insert({
            user_id: user.id,
            name: ecData.name,
            phone: ecData.phone,
            relation: ecData.relation,
            consent_notify: ecData.consent_notify,
          });

        if (ecError) throw ecError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
