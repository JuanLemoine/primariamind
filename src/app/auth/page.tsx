'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/layout';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from '@/components/ui';
import { registerSchema, loginSchema } from '@/lib/validations';
import { z } from 'zod';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    try {
      if (mode === 'register') {
        registerSchema.parse(formData);
      } else {
        loginSchema.parse(formData);
      }
      setFieldErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach(e => {
          if (e.path[0]) {
            errors[e.path[0] as string] = e.message;
          }
        });
        setFieldErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
            },
          },
        });

        if (signUpError) throw signUpError;

        setSuccess('Cuenta creada. Revisa tu correo para confirmar tu cuenta.');
        setMode('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;

        router.push('/consent');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message.includes('Invalid login')) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (err.message.includes('already registered')) {
        setError('Este email ya está registrado. Intenta iniciar sesión.');
      } else {
        setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <p className="text-gray-600 mt-2">
            Orientación en salud mental primaria
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Ingresa tus credenciales para continuar'
                : 'Completa tus datos para registrarte'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mb-4">
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <Input
                  label="Nombre completo"
                  name="full_name"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.full_name}
                  onChange={handleChange}
                  error={fieldErrors.full_name}
                  autoComplete="name"
                />
              )}

              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                error={fieldErrors.email}
                autoComplete="email"
              />

              <Input
                label="Contraseña"
                name="password"
                type="password"
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                value={formData.password}
                onChange={handleChange}
                error={fieldErrors.password}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />

              <Button
                type="submit"
                className="w-full"
                loading={loading}
              >
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError(null);
                    setSuccess(null);
                    setFieldErrors({});
                  }}
                  className="text-[var(--primary)] hover:underline font-medium"
                >
                  {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-gray-500 mt-6 px-4">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad.
          Este servicio no reemplaza la atención médica profesional.
        </p>
      </div>
    </div>
  );
}
