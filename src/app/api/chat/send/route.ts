import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateChatResponse, performTriage, generateInsights } from '@/lib/ai';
import { sendMessageSchema } from '@/lib/validations';
import { getEmergencyLines, formatEmergencyMessage, getEmergencyNotificationMessage } from '@/lib/utils';
import { Message, SendMessageResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    // Get user profile for location info (use admin client to avoid RLS issues)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, country, city')
      .eq('id', user.id)
      .single();

    let conversationId = validated.conversation_id;
    let messages: Message[] = [];

    // Create new conversation if needed
    if (!conversationId) {
      // Use admin client to avoid RLS issues when creating conversation
      const { data: newConversation, error: convError } = await adminClient
        .from('conversations')
        .insert({ user_id: user.id, status: 'active' })
        .select()
        .single();

      if (convError || !newConversation) {
        console.error('Error creating conversation:', convError);
        return NextResponse.json(
          { error: 'Error al crear conversación' },
          { status: 500 }
        );
      }

      conversationId = newConversation.id;
    } else {
      // Verify conversation belongs to user (use admin client to avoid RLS issues)
      const { data: existingConv } = await adminClient
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (!existingConv) {
        return NextResponse.json(
          { error: 'Conversación no encontrada' },
          { status: 404 }
        );
      }

      // Load existing messages for context (use admin client)
      const { data: existingMessages } = await adminClient
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20);

      messages = existingMessages || [];
    }

    // Save user message (use admin client to avoid RLS issues)
    const { error: userMsgError } = await adminClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: validated.content,
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
    }

    // Perform triage analysis (parallel with chat response)
    const [chatResponse, triageResult] = await Promise.all([
      generateChatResponse(messages, validated.content),
      performTriage(messages, validated.content),
    ]);

    // Save assistant message (use admin client to avoid RLS issues)
    const { data: assistantMessage, error: assistantMsgError } = await adminClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: chatResponse,
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
    }

    // Save triage insights
    const allMessages: Message[] = [
      ...messages,
      { id: 'temp', conversation_id: conversationId!, role: 'user', content: validated.content, created_at: new Date().toISOString() },
      { id: 'temp2', conversation_id: conversationId!, role: 'assistant', content: chatResponse, created_at: new Date().toISOString() },
    ];

    // Generate insights for therapist (only if needs_human or moderate+ risk)
    let insights = { summary: null as string | null, tags: [] as string[] };
    if (triageResult.needs_human || triageResult.risk_level !== 'low') {
      insights = await generateInsights(allMessages);
    }

    // Save conversation insight (use admin client to avoid RLS issues)
    const { error: insightError } = await adminClient
      .from('conversation_insights')
      .insert({
        conversation_id: conversationId,
        risk_level: triageResult.risk_level,
        needs_human: triageResult.needs_human,
        emergency_flag: triageResult.emergency_flag,
        recommended_specialty: triageResult.recommended_specialty,
        urgency: triageResult.urgency,
        reasons: triageResult.reasons,
        summary: insights.summary,
        tags: insights.tags,
        suggested_next_steps: triageResult.suggested_next_steps,
      });

    if (insightError) {
      console.error('Error saving insight:', insightError);
    }

    // Build response
    const response: SendMessageResponse = {
      conversation_id: conversationId!,
      message: {
        id: assistantMessage?.id || `temp-${Date.now()}`,
        role: 'assistant',
        content: chatResponse,
        created_at: assistantMessage?.created_at || new Date().toISOString(),
      },
      action: 'normal',
    };

    // Handle emergency flag (crisis mode)
    if (triageResult.emergency_flag) {
      response.action = 'crisis_mode';

      const emergencyLines = getEmergencyLines(profile?.country, profile?.city);

      response.crisis_info = {
        message: formatEmergencyMessage(emergencyLines),
        emergency_lines: emergencyLines,
        contact_notified: false,
      };

      // Get emergency contact and send notification if consented
      const adminClient = createAdminClient();
      const { data: emergencyContact } = await adminClient
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('consent_notify', true)
        .single();

      if (emergencyContact) {
        // Create notification record
        const notificationMessage = getEmergencyNotificationMessage(profile?.full_name || 'Un usuario');

        const { error: notifError } = await adminClient
          .from('risk_notifications')
          .insert({
            user_id: user.id,
            conversation_id: conversationId,
            contact_id: emergencyContact.id,
            channel: 'sms', // Placeholder - implement with Twilio
            status: 'pending',
            payload: {
              message: notificationMessage,
              contact_phone: emergencyContact.phone,
              contact_name: emergencyContact.name,
            },
          });

        if (!notifError) {
          response.crisis_info.contact_notified = true;

          // TODO: Implement actual SMS sending with Twilio
          // For MVP, we just record the notification intent
          console.log('CRISIS NOTIFICATION:', {
            to: emergencyContact.phone,
            message: notificationMessage,
          });
        }
      }

      // Update conversation status
      await adminClient
        .from('conversations')
        .update({ status: 'referred' })
        .eq('id', conversationId);

      // Create high-priority referral
      await adminClient
        .from('referrals')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          specialty_id: null, // Will be assigned based on triage
          priority: 'high',
          status: 'open',
        });
    }
    // Handle needs_human with available therapists
    else if (triageResult.needs_human && triageResult.urgency >= 6) {
      // Check for available therapist slots
      const now = new Date();
      const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Find therapists with matching specialty (use admin client for reliability)
      let therapistQuery = adminClient
        .from('availability_slots')
        .select(`
          id,
          therapist_id,
          start_ts,
          end_ts,
          therapists!inner (
            therapist_id,
            is_available,
            profiles!inner (
              full_name
            )
          )
        `)
        .eq('status', 'free')
        .gte('start_ts', now.toISOString())
        .lte('start_ts', twoWeeksLater.toISOString())
        .order('start_ts', { ascending: true })
        .limit(6);

      const { data: availableSlots } = await therapistQuery;

      if (availableSlots && availableSlots.length > 0) {
        response.action = 'offer_appointment';
        response.appointment_slots = availableSlots.map((slot: any) => ({
          id: slot.id,
          therapist_id: slot.therapist_id,
          therapist_name: slot.therapists?.profiles?.full_name || 'Terapeuta',
          start_ts: slot.start_ts,
          end_ts: slot.end_ts,
        }));
        response.specialty = triageResult.recommended_specialty || undefined;

        // Create referral in waiting status
        await adminClient
          .from('referrals')
          .insert({
            conversation_id: conversationId,
            user_id: user.id,
            specialty_id: null, // Could map specialty slug to ID
            priority: triageResult.urgency >= 8 ? 'high' : 'normal',
            status: 'open',
          });
      }
    }

    // Update conversation timestamp
    await adminClient
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Chat API error:', error);

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
