'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/layout';
import { Button, Input, Checkbox, Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from '@/components/ui';
import { emergencyContactSchema } from '@/lib/validations';
import { z } from 'zod';
import { UserPlus, Heart, AlertCircle, Loader2 } from 'lucide-react';

export default function EmergencyContactPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user already has emergency contact - if so, redirect to chat
  useEffect(() => {
    async function checkExistingContact() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: existingContact } = await supabase
        .from('emergency_contacts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // If user already has a contact, redirect to chat
      if (existingContact && existingContact.length > 0) {
        router.push('/chat');
        return;
      }

      setChecking(false);
    }

    checkExistingContact();
  }, [supabase, router]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relation: '',
    consent_notify: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      emergencyContactSchema.parse(formData);
      setFieldErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach(e => {
          if (e.path[0]) {
            errors[e.path[0] as string] = e.message;
          }
        });
        setFieldErrors(errors);
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from('emergency_contacts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingContact) {
        // Update existing contact
        const { error: updateError } = await supabase
          .from('emergency_contacts')
          .update({
            name: formData.name,
            phone: formData.phone,
            relation: formData.relation,
            consent_notify: formData.consent_notify,
          })
          .eq('id', existingContact.id);

        if (updateError) throw updateError;
      } else {
        // Insert new contact
        const { error: insertError } = await supabase
          .from('emergency_contacts')
          .insert({
            user_id: user.id,
            name: formData.name,
            phone: formData.phone,
            relation: formData.relation,
            consent_notify: formData.consent_notify,
          });

        if (insertError) throw insertError;
      }

      router.push('/chat');
      router.refresh();
    } catch (err: any) {
      console.error('Emergency contact error:', err);
      setError('Ocurrió un error al guardar el contacto. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Contacto de Emergencia</h1>
          <p className="text-gray-600 mt-2">
            Registra a alguien de confianza que pueda apoyarte
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle>¿Por qué es importante?</CardTitle>
                <CardDescription>
                  Si detectamos una situación de riesgo, podemos notificar a esta persona para que te brinde apoyo.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Nombre completo"
                name="name"
                type="text"
                placeholder="Nombre de tu contacto de emergencia"
                value={formData.name}
                onChange={handleChange}
                error={fieldErrors.name}
                autoComplete="off"
              />

              <Input
                label="Teléfono"
                name="phone"
                type="tel"
                placeholder="+57 300 123 4567"
                value={formData.phone}
                onChange={handleChange}
                error={fieldErrors.phone}
                hint="Incluye el código de país si es posible"
                autoComplete="off"
              />

              <Input
                label="Relación"
                name="relation"
                type="text"
                placeholder="Ej: Madre, Hermano, Amigo/a, Pareja"
                value={formData.relation}
                onChange={handleChange}
                error={fieldErrors.relation}
                autoComplete="off"
              />

              {/* Consent for notifications */}
              <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-2">
                      Autorización de notificación
                    </h3>
                    <p className="text-sm text-orange-800 mb-3">
                      Si activas esta opción, en caso de detectar una <strong>situación de riesgo alto</strong>,
                      enviaremos un mensaje breve a tu contacto informando que podrías necesitar apoyo.
                      <strong> No compartiremos detalles de tus conversaciones.</strong>
                    </p>
                    <p className="text-xs text-orange-700 mb-3 italic">
                      El mensaje será similar a: "Alerta de bienestar: [Tu nombre] podría necesitar apoyo.
                      Por favor contáctalo(a) y si hay riesgo inmediato llama a emergencias."
                    </p>
                    <Checkbox
                      name="consent_notify"
                      checked={formData.consent_notify}
                      onChange={handleChange}
                      label="Autorizo que se notifique a mi contacto de emergencia si el sistema detecta riesgo alto"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loading}
                >
                  <UserPlus className="w-5 h-5" />
                  Guardar contacto y continuar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-gray-500 mt-6 px-4">
          Puedes actualizar esta información en cualquier momento desde tu perfil.
          Tu contacto no recibirá ninguna notificación al ser registrado.
        </p>
      </div>
    </div>
  );
}
