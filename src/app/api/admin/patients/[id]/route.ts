import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verify authenticated user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Get patient profile
    const { data: patient, error: patientError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Get emergency contact
    const { data: emergencyContact } = await adminClient
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', patientId)
      .limit(1)
      .single();

    // Get all conversations with messages
    const { data: conversations } = await adminClient
      .from('conversations')
      .select('*')
      .eq('user_id', patientId)
      .order('updated_at', { ascending: false });

    const conversationIds = (conversations || []).map(c => c.id);

    // Get messages for all conversations
    const { data: messages } = conversationIds.length > 0
      ? await adminClient
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: true })
      : { data: [] };

    // Get insights for all conversations
    const { data: insights } = conversationIds.length > 0
      ? await adminClient
          .from('conversation_insights')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
      : { data: [] };

    // Get referrals
    const { data: referrals } = await adminClient
      .from('referrals')
      .select(`
        *,
        specialty:specialties(*)
      `)
      .eq('user_id', patientId)
      .order('created_at', { ascending: false });

    // Build conversations with their messages and insights
    const enrichedConversations = (conversations || []).map(conv => {
      const convMessages = (messages || []).filter(m => m.conversation_id === conv.id);
      const convInsights = (insights || []).filter(i => i.conversation_id === conv.id);

      return {
        ...conv,
        messages: convMessages,
        insights: convInsights,
        message_count: convMessages.length,
        latest_insight: convInsights[0] || null,
      };
    });

    return NextResponse.json({
      patient,
      emergency_contact: emergencyContact || null,
      conversations: enrichedConversations,
      referrals: referrals || [],
    });
  } catch (error: any) {
    console.error('Admin patient detail API error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar paciente' },
      { status: 500 }
    );
  }
}
