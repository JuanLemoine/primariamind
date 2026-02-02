import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verify authenticated user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Get all patients (role = 'user')
    const { data: patients, error: patientsError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('role', 'user')
      .order('created_at', { ascending: false });

    if (patientsError) throw patientsError;

    // Get conversation counts and latest activity per user
    const patientIds = (patients || []).map(p => p.id);

    if (patientIds.length === 0) {
      return NextResponse.json({ patients: [], stats: { total: 0, activeConversations: 0, highRisk: 0, openReferrals: 0 } });
    }

    // Get conversations grouped by user
    const { data: conversations } = await adminClient
      .from('conversations')
      .select('id, user_id, status, updated_at')
      .in('user_id', patientIds)
      .order('updated_at', { ascending: false });

    // Get latest insights per conversation
    const conversationIds = (conversations || []).map(c => c.id);
    const { data: insights } = conversationIds.length > 0
      ? await adminClient
          .from('conversation_insights')
          .select('conversation_id, risk_level, summary, tags, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
      : { data: [] };

    // Get emergency contacts
    const { data: emergencyContacts } = await adminClient
      .from('emergency_contacts')
      .select('user_id, name, phone, relation')
      .in('user_id', patientIds);

    // Get open referrals
    const { data: referrals } = await adminClient
      .from('referrals')
      .select('user_id, status, priority')
      .in('user_id', patientIds);

    // Build enriched patient data
    const enrichedPatients = (patients || []).map(patient => {
      const userConvs = (conversations || []).filter(c => c.user_id === patient.id);
      const activeConvs = userConvs.filter(c => c.status === 'active');

      // Get latest insight across all conversations
      const userConvIds = userConvs.map(c => c.id);
      const userInsights = (insights || []).filter(i => userConvIds.includes(i.conversation_id));
      const latestInsight = userInsights[0] || null;

      const emergencyContact = (emergencyContacts || []).find(ec => ec.user_id === patient.id) || null;

      const userReferrals = (referrals || []).filter(r => r.user_id === patient.id);
      const openReferrals = userReferrals.filter(r => r.status === 'open' || r.status === 'assigned');

      return {
        ...patient,
        conversation_count: userConvs.length,
        active_conversations: activeConvs.length,
        last_activity: userConvs[0]?.updated_at || patient.created_at,
        latest_risk_level: latestInsight?.risk_level || null,
        latest_summary: latestInsight?.summary || null,
        latest_tags: latestInsight?.tags || [],
        emergency_contact: emergencyContact,
        open_referrals: openReferrals.length,
        has_high_priority: userReferrals.some(r => r.priority === 'high'),
      };
    });

    // Calculate stats
    const stats = {
      total: enrichedPatients.length,
      activeConversations: (conversations || []).filter(c => c.status === 'active').length,
      highRisk: enrichedPatients.filter(p => p.latest_risk_level === 'high' || p.latest_risk_level === 'critical').length,
      openReferrals: (referrals || []).filter(r => r.status === 'open').length,
    };

    return NextResponse.json({ patients: enrichedPatients, stats });
  } catch (error: any) {
    console.error('Admin patients API error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar pacientes' },
      { status: 500 }
    );
  }
}
