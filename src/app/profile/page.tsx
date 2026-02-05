'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/layout';
import { Button, Alert } from '@/components/ui';
import {
  ArrowLeft, Loader2, Save, User, Phone, MapPin,
  CheckCircle, Mail,
} from 'lucide-react';

interface ProfileData {
  full_name: string;
  country: string;
  city: string;
  age_range: string;
  gender: string;
  education_level: string;
}

interface EmergencyContactData {
  name: string;
  phone: string;
  relation: string;
  consent_notify: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    country: '',
    city: '',
    age_range: '',
    gender: '',
    education_level: '',
  });

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContactData>({
    name: '',
    phone: '',
    relation: '',
    consent_notify: false,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth'); return; }

        const response = await fetch('/api/profile');
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        setEmail(data.email || '');

        if (data.profile) {
          setProfile({
            full_name: data.profile.full_name || '',
            country: data.profile.country || '',
            city: data.profile.city || '',
            age_range: data.profile.age_range || '',
            gender: data.profile.gender || '',
            education_level: data.profile.education_level || '',
          });
        }

        if (data.emergency_contact) {
          setEmergencyContact({
            name: data.emergency_contact.name || '',
            phone: data.emergency_contact.phone || '',
            relation: data.emergency_contact.relation || '',
            consent_notify: data.emergency_contact.consent_notify || false,
          });
        }
      } catch (err: any) {
        console.error('Load profile error:', err);
        setError('Error al cargar tu perfil');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase, router]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          emergency_contact: emergencyContact,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setError(err.message || 'Error al guardar los cambios');
    } finally {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/chat')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo size="sm" />
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm font-medium text-gray-700">Mi perfil</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <Alert variant="error" className="mb-6">{error}</Alert>
        )}
        {success && (
          <Alert variant="success" className="mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          </Alert>
        )}

        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Información personal
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar desde aquí.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rango de edad</label>
                <select
                  value={profile.age_range}
                  onChange={(e) => setProfile(prev => ({ ...prev, age_range: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin especificar</option>
                  <option value="13-17">13 - 17 años</option>
                  <option value="18-24">18 - 24 años</option>
                  <option value="25-34">25 - 34 años</option>
                  <option value="35-44">35 - 44 años</option>
                  <option value="45-54">45 - 54 años</option>
                  <option value="55-64">55 - 64 años</option>
                  <option value="65+">65+ años</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin especificar</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="no_binario">No binario</option>
                  <option value="prefiero_no_decir">Prefiero no decir</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de escolaridad</label>
              <select
                value={profile.education_level}
                onChange={(e) => setProfile(prev => ({ ...prev, education_level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin especificar</option>
                <option value="primaria">Primaria</option>
                <option value="secundaria">Secundaria / Bachillerato</option>
                <option value="tecnico">Técnico / Tecnológico</option>
                <option value="universitario">Universitario</option>
                <option value="posgrado">Posgrado</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> País
                </label>
                <input
                  type="text"
                  value={profile.country}
                  onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Colombia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Bogotá"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-500" />
            Contacto de emergencia
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del contacto</label>
              <input
                type="text"
                value={emergencyContact.name}
                onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre completo"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={emergencyContact.phone}
                  onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relación</label>
                <input
                  type="text"
                  value={emergencyContact.relation}
                  onChange={(e) => setEmergencyContact(prev => ({ ...prev, relation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Mamá, Pareja, Amigo"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
              <input
                type="checkbox"
                id="consent_notify"
                checked={emergencyContact.consent_notify}
                onChange={(e) => setEmergencyContact(prev => ({ ...prev, consent_notify: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="consent_notify" className="text-sm text-gray-600">
                Autorizo que se notifique a este contacto en caso de que se detecte una situación de riesgo durante mis conversaciones.
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          loading={saving}
        >
          <Save className="w-4 h-4" />
          Guardar cambios
        </Button>
      </main>
    </div>
  );
}
