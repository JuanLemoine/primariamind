'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/layout';
import { Button, Card, Alert } from '@/components/ui';
import { ChatMessage } from '@/components/chat';
import {
  ArrowLeft, User, AlertTriangle, FileText,
  MapPin, Loader2, Save, Check, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReferralWithDetails, Message, RiskLevel } from '@/types';

const riskColors: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const riskLabels: Record<RiskLevel, string> = {
  low: 'Bajo',
  moderate: 'Moderado',
  high: 'Alto',
  critical: 'Crítico',
};

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [referral, setReferral] = useState<ReferralWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [therapistId, setTherapistId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Load case data
  useEffect(() => {
    async function loadCase() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth');
          return;
        }

        setTherapistId(user.id);

        // Verify user is therapist
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'therapist') {
          router.push('/chat');
          return;
        }

        // Load referral with all details
        const { data: ref, error: refError } = await supabase
          .from('referrals')
          .select(`
            *,
            conversation:conversations(*),
            user_profile:profiles!referrals_user_id_fkey(id, full_name, country, city),
            specialty:specialties(*),
            insights:conversation_insights(*)
          `)
          .eq('id', caseId)
          .single();

        if (refError || !ref) {
          setError('Caso no encontrado');
          return;
        }

        // Check access (pool or assigned to this therapist)
        if (ref.status !== 'open' && ref.assigned_therapist_id !== user.id) {
          setError('No tienes acceso a este caso');
          return;
        }

        setReferral(ref as ReferralWithDetails);
        setNotes(ref.therapist_notes || '');

        // Load conversation messages
        if (ref.conversation_id) {
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', ref.conversation_id)
            .order('created_at', { ascending: true });

          setMessages(msgs || []);
        }

      } catch (err: any) {
        console.error('Error loading case:', err);
        setError('Error al cargar el caso');
      } finally {
        setLoading(false);
      }
    }

    loadCase();
  }, [caseId, supabase, router]);

  const handleTakeCase = async () => {
    if (!referral) return;

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          status: 'assigned',
          assigned_therapist_id: therapistId,
        })
        .eq('id', referral.id);

      if (updateError) throw updateError;

      setReferral(prev => prev ? {
        ...prev,
        status: 'assigned',
        assigned_therapist_id: therapistId,
      } : null);

      setSuccess('Caso asignado correctamente');
    } catch (err: any) {
      console.error('Error taking case:', err);
      setError('Error al tomar el caso');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!referral) return;

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('referrals')
        .update({ therapist_notes: notes })
        .eq('id', referral.id);

      if (updateError) throw updateError;

      setSuccess('Notas guardadas');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving notes:', err);
      setError('Error al guardar las notas');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCase = async () => {
    if (!referral) return;

    if (!confirm('¿Estás seguro de que quieres cerrar este caso?')) return;

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('referrals')
        .update({ status: 'closed' })
        .eq('id', referral.id);

      if (updateError) throw updateError;

      router.push('/therapist');
    } catch (err: any) {
      console.error('Error closing case:', err);
      setError('Error al cerrar el caso');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Caso no encontrado</h2>
          <Button onClick={() => router.push('/therapist')}>
            Volver al panel
          </Button>
        </div>
      </div>
    );
  }

  const latestInsight = referral.insights?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/therapist')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo size="sm" showText={false} />
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm font-medium text-gray-700">
              {referral.conversation?.title || `Caso #${referral.id.slice(0, 8)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {referral.status === 'open' && (
              <Button
                onClick={handleTakeCase}
                loading={saving}
              >
                <Check className="w-4 h-4" />
                Tomar caso
              </Button>
            )}
            {referral.status === 'assigned' && referral.assigned_therapist_id === therapistId && (
              <Button
                variant="danger"
                onClick={handleCloseCase}
                loading={saving}
              >
                <X className="w-4 h-4" />
                Cerrar caso
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            {success}
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Info */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del paciente
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Nombre</span>
                  <p className="font-medium">{referral.user_profile?.full_name || 'No disponible'}</p>
                </div>
                {(referral.user_profile?.country || referral.user_profile?.city) && (
                  <div>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Ubicación
                    </span>
                    <p className="font-medium">
                      {[referral.user_profile?.city, referral.user_profile?.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Risk Assessment */}
            {latestInsight && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Evaluación de riesgo
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Nivel de riesgo</span>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      riskColors[latestInsight.risk_level]
                    )}>
                      {riskLabels[latestInsight.risk_level]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Urgencia</span>
                    <span className="font-medium">{latestInsight.urgency}/10</span>
                  </div>
                  {latestInsight.emergency_flag && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800 font-medium">
                        Bandera de emergencia activa
                      </p>
                    </div>
                  )}
                </div>

                {latestInsight.reasons && latestInsight.reasons.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Razones</span>
                    <ul className="mt-2 space-y-1">
                      {latestInsight.reasons.map((reason, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {/* Summary */}
            {latestInsight?.summary && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resumen del caso
                </h3>
                <p className="text-gray-700 text-sm">{latestInsight.summary}</p>

                {latestInsight.tags && latestInsight.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {latestInsight.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Therapist Notes */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Notas del terapeuta</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escribe tus notas sobre este caso..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none
                           focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={handleSaveNotes}
                loading={saving}
              >
                <Save className="w-4 h-4" />
                Guardar notas
              </Button>
            </Card>
          </div>

          {/* Right Column - Conversation */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <h3 className="font-semibold text-gray-900 mb-4">Historial de conversación</h3>

              <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay mensajes en esta conversación
                  </p>
                ) : (
                  messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))
                )}
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Última actualización: {new Date(referral.updated_at).toLocaleString('es-CO')}
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
