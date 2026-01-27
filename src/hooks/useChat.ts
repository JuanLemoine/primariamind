'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Message, SendMessageResponse, EmergencyLine } from '@/types';

interface UseChatOptions {
  conversationId?: string;
}

interface ChatState {
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  conversationId: string | null;
  crisisMode: boolean;
  crisisInfo: {
    emergencyLines: EmergencyLine[];
    contactNotified: boolean;
  } | null;
  appointmentOffer: {
    slots: Array<{
      id: string;
      therapist_id: string;
      therapist_name: string;
      start_ts: string;
      end_ts: string;
    }>;
    specialty?: string;
  } | null;
}

export function useChat(options: UseChatOptions = {}) {
  const supabase = createClient();

  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: true,
    sending: false,
    error: null,
    conversationId: options.conversationId || null,
    crisisMode: false,
    crisisInfo: null,
    appointmentOffer: null,
  });

  // Load conversation messages
  const loadMessages = useCallback(async (convId: string) => {
    if (!convId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error loading messages:', error.message, error.code);
        throw error;
      }

      setState(prev => ({
        ...prev,
        messages: data || [],
        loading: false,
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error loading messages:', errorMessage);
      setState(prev => ({
        ...prev,
        error: `Error al cargar los mensajes: ${errorMessage}`,
        loading: false,
      }));
    }
  }, [supabase]);

  // Load existing conversation on mount
  useEffect(() => {
    if (options.conversationId) {
      loadMessages(options.conversationId);
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [options.conversationId, loadMessages]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    setState(prev => ({ ...prev, sending: true, error: null }));

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: state.conversationId || '',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, tempUserMessage],
    }));

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Only include conversation_id if it exists (avoid sending null)
          ...(state.conversationId && { conversation_id: state.conversationId }),
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar el mensaje');
      }

      const data: SendMessageResponse = await response.json();

      // Update state with real message and response
      setState(prev => {
        const messages = prev.messages.filter(m => !m.id.startsWith('temp-'));

        // Add the persisted user message (from server, with real ID)
        // The server response includes the assistant message
        const newMessages = [
          ...messages,
          {
            id: `user-${Date.now()}`,
            conversation_id: data.conversation_id,
            role: 'user' as const,
            content,
            created_at: new Date().toISOString(),
          },
          {
            id: data.message.id,
            conversation_id: data.conversation_id,
            role: data.message.role,
            content: data.message.content,
            created_at: data.message.created_at,
          },
        ];

        return {
          ...prev,
          messages: newMessages,
          conversationId: data.conversation_id,
          sending: false,
          crisisMode: data.action === 'crisis_mode',
          crisisInfo: data.crisis_info ? {
            emergencyLines: data.crisis_info.emergency_lines,
            contactNotified: data.crisis_info.contact_notified,
          } : null,
          appointmentOffer: data.action === 'offer_appointment' && data.appointment_slots
            ? { slots: data.appointment_slots, specialty: data.specialty }
            : null,
        };
      });

    } catch (err: any) {
      console.error('Error sending message:', err);

      // Remove optimistic message on error
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => !m.id.startsWith('temp-')),
        sending: false,
        error: err.message || 'Error al enviar el mensaje. Intenta de nuevo.',
      }));
    }
  }, [state.conversationId]);

  // Book appointment
  const bookAppointment = useCallback(async (slotId: string) => {
    try {
      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slot_id: slotId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agendar la cita');
      }

      // Clear appointment offer on success
      setState(prev => ({
        ...prev,
        appointmentOffer: null,
      }));

      return true;
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      setState(prev => ({
        ...prev,
        error: err.message || 'Error al agendar la cita',
      }));
      return false;
    }
  }, []);

  // Dismiss appointment offer
  const dismissAppointmentOffer = useCallback(() => {
    setState(prev => ({
      ...prev,
      appointmentOffer: null,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sendMessage,
    bookAppointment,
    dismissAppointmentOffer,
    clearError,
    loadMessages,
  };
}
