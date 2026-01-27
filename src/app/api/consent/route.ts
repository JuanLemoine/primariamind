import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { country, city } = body;

    // First, check if profile exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      // Profile exists, update it
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({
          consent_accepted: true,
          consent_accepted_at: new Date().toISOString(),
          country: country || null,
          city: city || null,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }
    } else {
      // Profile doesn't exist, create it
      const { error: insertError } = await adminClient
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || null,
          consent_accepted: true,
          consent_accepted_at: new Date().toISOString(),
          country: country || null,
          city: city || null,
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        throw insertError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Consent API error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar el consentimiento' },
      { status: 500 }
    );
  }
}
