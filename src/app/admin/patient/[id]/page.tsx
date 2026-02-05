'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/layout';
import { Button, Alert } from '@/components/ui';
import {
  ArrowLeft, Loader2, LogOut, User, MapPin, Phone, Shield,
  MessageSquare, AlertTriangle, Clock, ChevronDown, ChevronUp, Tag,
} from 'lucide-react';

interface ConversationDetail {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    created_at: string;
  }>;
  insights: Array<{
    id: string;
    risk_level: string;
    needs_human: boolean;
    emergency_flag: boolean;
    urgency: number;
    reasons: string[];
    summary: string | null;
    tags: string[];
    created_at: string;
  }>;
  message_count: number;
  latest_insight: {
    risk_level: string;
    summary: string | null;
    tags: string[];
    urgency: number;
    reasons: string[];
    emergency_flag: boolean;
  } | null;
}

interface PatientDetail {
  patient: {
    id: string;
    full_name: string | null;
    country: string | null;
    city: string | null;
    age_range: string | null;
    gender: string | null;
    education_level: string | null;
    consent_accepted: boolean;
    created_at: string;
    updated_at: string;
  };
  emergency_contact: {
    name: string;
    phone: string;
    relation: string;
    consent_notify: boolean;
  } | null;
  conversations: ConversationDetail[];
  referrals: Array<{
    id: string;
    status: string;
    priority: string;
    therapist_notes: string | null;
    created_at: string;
    specialty: { name: string } | null;
  }>;
}

const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
  active: 'Activa',
  closed: 'Cerrada',
  referred: 'Derivada',
};

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PatientDetail | null>(null);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatient() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth'); return; }

        // Verify admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          router.push('/chat');
          return;
        }

        const response = await fetch(`/api/admin/patients/${patientId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Error al cargar paciente');
        }

        setData(result);
      } catch (err: any) {
        console.error('Patient detail error:', err);
        setError(err.message || 'Error al cargar datos del paciente');
      } finally {
        setLoading(false);
      }
    }

    loadPatient();
  }, [patientId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const toggleConversation = (convId: string) => {
    setExpandedConv(prev => prev === convId ? null : convId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm font-medium text-gray-700">Panel Admin</span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Alert variant="error">{error || 'No se pudo cargar el paciente'}</Alert>
          <Button variant="secondary" className="mt-4" onClick={() => router.push('/admin')}>
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </main>
      </div>
    );
  }

  const { patient, emergency_contact, conversations, referrals } = data;
  const location = [patient.city, patient.country].filter(Boolean).join(', ');

  // Get overall risk from latest insight across all conversations
  const allInsights = conversations.flatMap(c => c.insights || []);
  const latestInsight = allInsights.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm font-medium text-gray-700">Panel Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.push('/admin')}>
          <ArrowLeft className="w-4 h-4" /> Volver a pacientes
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Info */}
          <div className="space-y-6">
            {/* Patient Profile */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {patient.full_name || 'Sin nombre'}
                  </h2>
                  {location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Registrado</span>
                  <span className="text-gray-900">
                    {new Date(patient.created_at).toLocaleDateString('es-CO', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Conversaciones</span>
                  <span className="text-gray-900">{conversations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Referrals</span>
                  <span className="text-gray-900">{referrals.length}</span>
                </div>
                {patient.age_range && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Edad</span>
                    <span className="text-gray-900">{patient.age_range} años</span>
                  </div>
                )}
                {patient.gender && patient.gender !== 'prefiero_no_decir' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Género</span>
                    <span className="text-gray-900 capitalize">{patient.gender.replace('_', ' ')}</span>
                  </div>
                )}
                {patient.education_level && patient.education_level !== 'prefiero_no_decir' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Escolaridad</span>
                    <span className="text-gray-900 capitalize">{patient.education_level}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {emergency_contact && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500" />
                  Contacto de emergencia
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nombre</span>
                    <span className="text-gray-900">{emergency_contact.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Teléfono</span>
                    <span className="text-gray-900">{emergency_contact.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Relación</span>
                    <span className="text-gray-900">{emergency_contact.relation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Notificar</span>
                    <span className={emergency_contact.consent_notify ? 'text-green-600' : 'text-gray-400'}>
                      {emergency_contact.consent_notify ? 'Autorizado' : 'No autorizado'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            {latestInsight && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  Evaluación de riesgo
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${riskColors[latestInsight.risk_level] || 'bg-gray-100 text-gray-700'}`}>
                      Riesgo: {latestInsight.risk_level}
                    </span>
                    <span className="text-xs text-gray-500">
                      Urgencia: {latestInsight.urgency}/10
                    </span>
                    {latestInsight.emergency_flag && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full border border-red-200">
                        EMERGENCIA
                      </span>
                    )}
                  </div>

                  {latestInsight.summary && (
                    <p className="text-sm text-gray-600">{latestInsight.summary}</p>
                  )}

                  {latestInsight.reasons.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Razones:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
                        {latestInsight.reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestInsight.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {latestInsight.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Referrals */}
            {referrals.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-500" />
                  Referrals ({referrals.length})
                </h3>
                <div className="space-y-3">
                  {referrals.map(ref => (
                    <div key={ref.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          ref.status === 'open' ? 'bg-purple-100 text-purple-700' :
                          ref.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                          ref.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ref.status}
                        </span>
                        {ref.priority === 'high' && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Alta prioridad
                          </span>
                        )}
                      </div>
                      {ref.specialty && (
                        <p className="text-xs text-gray-500">Especialidad: {ref.specialty.name}</p>
                      )}
                      {ref.therapist_notes && (
                        <p className="text-sm text-gray-600 mt-1">{ref.therapist_notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(ref.created_at).toLocaleDateString('es-CO', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Conversations */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Historial de conversaciones ({conversations.length})
            </h3>

            {conversations.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Este paciente no tiene conversaciones aún.</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div key={conv.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Conversation Header */}
                  <button
                    onClick={() => toggleConversation(conv.id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="text-sm font-semibold text-gray-900">
                        {conv.title || 'Sin tema identificado'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          conv.status === 'active' ? 'bg-green-100 text-green-700' :
                          conv.status === 'referred' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {statusLabels[conv.status] || conv.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {conv.message_count} mensajes
                        </span>
                        {conv.latest_insight && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${riskColors[conv.latest_insight.risk_level] || 'bg-gray-100 text-gray-700'}`}>
                            {conv.latest_insight.risk_level}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(conv.updated_at).toLocaleDateString('es-CO', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      {expandedConv === conv.id
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  </button>

                  {/* Insight Summary */}
                  {conv.latest_insight?.summary && expandedConv !== conv.id && (
                    <div className="px-5 pb-3 -mt-1">
                      <p className="text-sm text-gray-500 line-clamp-1">{conv.latest_insight.summary}</p>
                    </div>
                  )}

                  {/* Expanded: Messages */}
                  {expandedConv === conv.id && (
                    <div className="border-t border-gray-100">
                      {/* Insight detail */}
                      {conv.latest_insight && (
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                          {conv.latest_insight.summary && (
                            <p className="text-sm text-gray-700 mb-2">{conv.latest_insight.summary}</p>
                          )}
                          {conv.latest_insight.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {conv.latest_insight.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-white border border-gray-200 text-gray-600 rounded-full">
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Messages */}
                      <div className="px-5 py-4 max-h-96 overflow-y-auto space-y-3">
                        {conv.messages.map(msg => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              msg.role === 'user'
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : msg.role === 'system'
                                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-xs mt-1 ${
                                msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                              }`}>
                                {new Date(msg.created_at).toLocaleTimeString('es-CO', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
