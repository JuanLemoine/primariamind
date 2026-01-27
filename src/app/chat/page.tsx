'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/layout';
import { Button, Alert } from '@/components/ui';
import { ChatMessage, ChatInput, CrisisAlert, AppointmentOffer } from '@/components/chat';
import { useChat } from '@/hooks/useChat';
import { LogOut, MessageSquarePlus, Menu, X, Loader2 } from 'lucide-react';
import { Conversation } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const {
    messages,
    loading,
    sending,
    error,
    crisisMode,
    crisisInfo,
    appointmentOffer,
    conversationId,
    sendMessage,
    bookAppointment,
    dismissAppointmentOffer,
    clearError,
    loadMessages,
  } = useChat({ conversationId: activeConversationId || undefined });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load user info and conversations
  useEffect(() => {
    // Prevent multiple initializations
    if (initialized) return;

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Get user profile and check onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, consent_accepted, role')
        .eq('id', user.id)
        .single();

      // Check if user needs to complete onboarding
      if (!profile || !profile.consent_accepted) {
        router.push('/consent');
        return;
      }

      // Check emergency contact for regular users
      if (profile.role === 'user') {
        const { data: emergencyContact, error: ecError } = await supabase
          .from('emergency_contacts')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        // Only redirect if we successfully confirmed there's no emergency contact
        // If there's an error or contact exists, let them through
        if (!ecError && (!emergencyContact || emergencyContact.length === 0)) {
          router.push('/onboarding/emergency-contact');
          return;
        }
      }

      // Redirect therapists to their dashboard
      if (profile.role === 'therapist') {
        router.push('/therapist');
        return;
      }

      // Mark as initialized - user passed all checks
      setInitialized(true);

      if (profile.full_name) {
        setUserName(profile.full_name);
      }

      // Load conversations
      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setConversations(convs || []);
      setLoadingConversations(false);

      // Auto-select the most recent conversation or create new
      if (convs && convs.length > 0) {
        setActiveConversationId(convs[0].id);
      }
    }

    loadData();
  }, [supabase, router, initialized]);

  // Update conversationId when chat creates a new one
  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversationId(conversationId);

      // Add to conversations list if new
      setConversations(prev => {
        if (!prev.find(c => c.id === conversationId)) {
          return [{
            id: conversationId,
            user_id: '',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Conversation, ...prev];
        }
        return prev;
      });
    }
  }, [conversationId, activeConversationId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const [creatingConversation, setCreatingConversation] = useState(false);

  const handleNewConversation = async () => {
    setCreatingConversation(true);
    setSidebarOpen(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create new conversation immediately
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, status: 'active' })
        .select()
        .single();

      if (error) throw error;

      // Add to list and select it
      setConversations(prev => [newConv as Conversation, ...prev]);
      setActiveConversationId(newConv.id);
    } catch (err) {
      console.error('Error creating conversation:', err);
    } finally {
      setCreatingConversation(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    loadMessages(id);
    setSidebarOpen(false);
  };

  const handleBookAppointment = async (slotId: string) => {
    setBookingAppointment(true);
    const success = await bookAppointment(slotId);
    setBookingAppointment(false);

    if (success) {
      // Show success message
      // Could add a toast notification here
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Logo size="sm" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">
            Hola, {userName || 'Usuario'}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:static inset-y-0 left-0 z-40
            w-72 bg-white border-r border-gray-200
            transition-transform duration-200 ease-in-out
            flex flex-col
            mt-[57px] lg:mt-0
          `}
        >
          <div className="p-4 border-b border-gray-100">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleNewConversation}
              disabled={creatingConversation}
            >
              {creatingConversation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquarePlus className="w-4 h-4" />
              )}
              Nueva conversación
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingConversations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No tienes conversaciones aún
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm
                      transition-colors
                      ${activeConversationId === conv.id
                        ? 'bg-blue-50 text-[var(--primary)]'
                        : 'hover:bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    <div className="font-medium truncate">
                      Conversación
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(conv.updated_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Disclaimer in sidebar */}
          <div className="p-3 border-t border-gray-100 bg-yellow-50">
            <p className="text-xs text-yellow-800">
              <strong>Recuerda:</strong> Este servicio no reemplaza atención médica profesional.
              En emergencias, llama al <strong>123</strong>.
            </p>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquarePlus className="w-10 h-10 text-[var(--primary)]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  ¡Hola! ¿Cómo te sientes hoy?
                </h2>
                <p className="text-gray-600 max-w-md">
                  Estoy aquí para escucharte y orientarte. Puedes contarme lo que quieras,
                  tu información es confidencial.
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                  />
                ))}

                {/* Crisis Alert */}
                {crisisMode && crisisInfo && (
                  <CrisisAlert
                    emergencyLines={crisisInfo.emergencyLines}
                    contactNotified={crisisInfo.contactNotified}
                  />
                )}

                {/* Appointment Offer */}
                {appointmentOffer && (
                  <AppointmentOffer
                    slots={appointmentOffer.slots}
                    specialty={appointmentOffer.specialty}
                    onBook={handleBookAppointment}
                    onDismiss={dismissAppointmentOffer}
                    loading={bookingAppointment}
                  />
                )}

                {/* Typing indicator */}
                {sending && (
                  <div className="flex gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="px-4">
              <Alert variant="error" className="mb-2">
                {error}
                <button
                  onClick={clearError}
                  className="ml-2 underline text-sm"
                >
                  Cerrar
                </button>
              </Alert>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                onSend={sendMessage}
                disabled={sending}
                placeholder="Escribe tu mensaje..."
              />
              <p className="text-xs text-gray-400 text-center mt-2">
                Tu información es confidencial. En emergencias, llama al 123.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
