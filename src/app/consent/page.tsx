'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/layout';
import { Button, Card, CardContent, Alert } from '@/components/ui';
import { Shield, AlertTriangle, FileText, MapPin, Loader2, CheckCircle, UserCircle } from 'lucide-react';

interface LocationData {
  country: string;
  city: string;
  loading: boolean;
  error: string | null;
  granted: boolean;
}

interface DemographicData {
  age_range: string;
  gender: string;
  education_level: string;
}

export default function ConsentPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData>({
    country: '',
    city: '',
    loading: false,
    error: null,
    granted: false,
  });
  const [demographics, setDemographics] = useState<DemographicData>({
    age_range: '',
    gender: '',
    education_level: '',
  });

  // Check if user already accepted consent - if so, redirect to chat
  useEffect(() => {
    async function checkConsent() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('consent_accepted')
        .eq('id', user.id)
        .single();

      // If consent already accepted, redirect to chat
      if (profile?.consent_accepted) {
        router.push('/chat');
        return;
      }

      setChecking(false);
    }

    checkConsent();
  }, [supabase, router]);

  const requestGeolocation = async () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Tu navegador no soporta geolocalización',
      }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get city/country from coordinates
          const { latitude, longitude } = position.coords;
          
          // Nominatim requires a User-Agent header
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`,
            {
              headers: {
                'User-Agent': 'PrimariaMind/1.0 (https://primariamind.com)',
              },
            }
          );
          
          if (!response.ok) {
            console.error('Nominatim response not ok:', response.status);
            throw new Error('Error al obtener ubicación');
          }
          
          const data = await response.json();
          console.log('Nominatim response:', data); // Debug log
          
          const city = data.address?.city || 
                       data.address?.town || 
                       data.address?.village || 
                       data.address?.municipality || 
                       data.address?.state ||
                       '';
          const country = data.address?.country || '';
          
          if (!city && !country) {
            // If we couldn't get any location info, still mark as granted with coords
            setLocation({
              country: 'Ubicación detectada',
              city: `(${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
              loading: false,
              error: null,
              granted: true,
            });
          } else {
            setLocation({
              country,
              city,
              loading: false,
              error: null,
              granted: true,
            });
          }
        } catch (err: any) {
          console.error('Geocoding error:', err);
          setLocation(prev => ({
            ...prev,
            loading: false,
            error: 'No pudimos identificar tu ciudad. Puedes continuar sin ella.',
            granted: false,
          }));
        }
      },
      (err) => {
        console.error('Geolocation error:', err.code, err.message);
        let errorMessage = 'No pudimos acceder a tu ubicación.';
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = 'Permiso de ubicación denegado. Puedes continuar sin ella.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMessage = 'Ubicación no disponible. Puedes continuar sin ella.';
        } else if (err.code === err.TIMEOUT) {
          errorMessage = 'Tiempo de espera agotado. Puedes continuar sin ella.';
        }
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          granted: false,
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 15000, // Increased timeout
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Use API route to handle consent (avoids RLS issues)
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: location.country || null,
          city: location.city || null,
          age_range: demographics.age_range || null,
          gender: demographics.gender || null,
          education_level: demographics.education_level || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar el consentimiento');
      }

      router.push('/onboarding/emergency-contact');
      router.refresh();
    } catch (err: any) {
      console.error('Consent error:', err);
      setError(err.message || 'Ocurrió un error al guardar tu consentimiento. Intenta de nuevo.');
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
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Consentimiento Informado</h1>
          <p className="text-gray-600 mt-2">
            Antes de continuar, es importante que entiendas cómo funciona este servicio.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            <div className="space-y-6">
              {/* Combined Information Section */}
              <div className="border border-gray-200 bg-white rounded-lg p-5 space-y-5">
                {/* Not Medical Disclaimer */}
                <div className="flex gap-3">
                  <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Este servicio NO reemplaza atención médica
                    </h3>
                    <p className="text-sm text-gray-600">
                      PrimariaMind ofrece <strong>orientación general y psicoeducación</strong> en salud mental primaria.
                      No realizamos diagnósticos, no prescribimos tratamientos y no reemplazamos la consulta con
                      profesionales de salud mental certificados.
                    </p>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Not for Emergencies */}
                <div className="flex gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      NO usar en emergencias
                    </h3>
                    <p className="text-sm text-gray-600">
                      Si estás en <strong>peligro inmediato</strong>, tienes pensamientos de hacerte daño o estás
                      en una situación de crisis, <strong>llama inmediatamente al 123</strong> (Colombia) o a los
                      servicios de emergencia de tu país.
                    </p>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Data Treatment */}
                <div className="flex gap-3">
                  <FileText className="w-6 h-6 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Tratamiento de datos
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Tus conversaciones son <strong>confidenciales</strong> y se almacenan de forma segura.
                      Los datos se utilizan para:
                    </p>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
                      <li>Brindarte orientación personalizada</li>
                      <li>Detectar situaciones de riesgo para proteger tu bienestar</li>
                      <li>Conectarte con profesionales si es necesario</li>
                      <li>Mejorar nuestros servicios (datos anonimizados)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Location with Geolocation */}
              <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                <div className="flex gap-3">
                  <MapPin className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Tu ubicación (opcional)
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Esto nos ayuda a mostrarte líneas de emergencia y recursos de tu región.
                    </p>
                    
                    {location.granted ? (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                        <CheckCircle className="w-5 h-5" />
                        <span>
                          Ubicación detectada: <strong>{location.city}{location.city && location.country ? ', ' : ''}{location.country}</strong>
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={requestGeolocation}
                          disabled={location.loading}
                          className="w-full"
                        >
                          {location.loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Obteniendo ubicación...
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4 mr-2" />
                              Permitir acceso a mi ubicación
                            </>
                          )}
                        </Button>
                        {location.error && (
                          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                            {location.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Demographic Data */}
              <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                <div className="flex gap-3">
                  <UserCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Datos demográficos (opcional)
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Esta información nos ayuda a brindarte una orientación más personalizada.
                    </p>

                    <div className="space-y-4">
                      {/* Age Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rango de edad
                        </label>
                        <select
                          value={demographics.age_range}
                          onChange={(e) => setDemographics(prev => ({ ...prev, age_range: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="13-17">13 - 17 años</option>
                          <option value="18-24">18 - 24 años</option>
                          <option value="25-34">25 - 34 años</option>
                          <option value="35-44">35 - 44 años</option>
                          <option value="45-54">45 - 54 años</option>
                          <option value="55-64">55 - 64 años</option>
                          <option value="65+">65+ años</option>
                        </select>
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Género
                        </label>
                        <select
                          value={demographics.gender}
                          onChange={(e) => setDemographics(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                          <option value="no_binario">No binario</option>
                          <option value="prefiero_no_decir">Prefiero no decir</option>
                        </select>
                      </div>

                      {/* Education Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nivel de escolaridad
                        </label>
                        <select
                          value={demographics.education_level}
                          onChange={(e) => setDemographics(prev => ({ ...prev, education_level: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="primaria">Primaria</option>
                          <option value="secundaria">Secundaria / Bachillerato</option>
                          <option value="tecnico">Técnico / Tecnológico</option>
                          <option value="universitario">Universitario</option>
                          <option value="posgrado">Posgrado</option>
                          <option value="prefiero_no_decir">Prefiero no decir</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                loading={loading}
                onClick={handleSubmit}
              >
                Acepto y continúo
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-gray-500 mt-6 px-4">
          Al hacer clic en "Acepto y continúo", confirmas que has leído y comprendido que este servicio
          ofrece orientación general, no reemplaza atención médica profesional, no es para emergencias,
          y aceptas el tratamiento de tus datos según nuestra política de privacidad.
          Puedes revocar tu consentimiento en cualquier momento desde tu perfil.
        </p>
      </div>
    </div>
  );
}
