'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/layout';
import { Button, Alert } from '@/components/ui';
import { PatientCard, PatientSearch } from '@/components/admin';
import { LogOut, RefreshCw, Loader2, Users, MessageSquare, AlertTriangle, FileWarning } from 'lucide-react';

interface PatientData {
  id: string;
  full_name: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
  conversation_count: number;
  active_conversations: number;
  last_activity: string;
  latest_risk_level: string | null;
  latest_summary: string | null;
  latest_tags: string[];
  conversation_topics: string[];
  open_referrals: number;
  has_high_priority: boolean;
}

interface Stats {
  total: number;
  activeConversations: number;
  highRisk: number;
  openReferrals: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string>('');
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, activeConversations: 0, highRisk: 0, openReferrals: 0 });
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Verify admin role client-side
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/chat');
        return;
      }

      setAdminName(profile.full_name || 'Admin');

      // Fetch patients from API
      const response = await fetch('/api/admin/patients');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar datos');
      }

      setPatients(data.patients);
      setStats(data.stats);
    } catch (err: any) {
      console.error('Admin dashboard error:', err);
      setError(err.message || 'Error al cargar el panel');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // Filter patients
  const filteredPatients = patients.filter(patient => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesName = patient.full_name?.toLowerCase().includes(searchLower);
      const matchesCity = patient.city?.toLowerCase().includes(searchLower);
      const matchesCountry = patient.country?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesCity && !matchesCountry) return false;
    }

    // Risk filter
    if (riskFilter !== 'all') {
      if (riskFilter === 'none') {
        if (patient.latest_risk_level) return false;
      } else {
        if (patient.latest_risk_level !== riskFilter) return false;
      }
    }

    return true;
  });

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
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm font-medium text-gray-700">Panel Admin</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {adminName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">Pacientes</span>
            </div>
            <div className="text-2xl font-bold text-[var(--primary)]">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">Conv. activas</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.activeConversations}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-600">Riesgo alto</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.highRisk}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <FileWarning className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-600">Referrals abiertos</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.openReferrals}</div>
          </div>
        </div>

        {/* Header with refresh */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pacientes registrados</h1>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData(true)}
            loading={refreshing}
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Search & Filters */}
        <PatientSearch
          search={search}
          onSearchChange={setSearch}
          riskFilter={riskFilter}
          onRiskFilterChange={setRiskFilter}
        />

        {/* Patient List */}
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron pacientes
            </h3>
            <p className="text-gray-600">
              {search || riskFilter !== 'all'
                ? 'Intenta cambiar los filtros de búsqueda.'
                : 'Los pacientes registrados aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
