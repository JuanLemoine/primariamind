'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/layout';
import { Button, Alert } from '@/components/ui';
import { CaseCard, CaseFilters } from '@/components/therapist';
import { LogOut, RefreshCw, Loader2, FolderOpen } from 'lucide-react';
import { ReferralWithDetails, CaseListFilters, Specialty } from '@/types';

export default function TherapistDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [therapistName, setTherapistName] = useState<string>('');
  const [therapistId, setTherapistId] = useState<string>('');
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [filters, setFilters] = useState<CaseListFilters>({
    status: 'all',
    priority: 'all',
  });

  // Load data
  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Get therapist profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'therapist') {
        router.push('/chat');
        return;
      }

      setTherapistName(profile.full_name || 'Terapeuta');
      setTherapistId(user.id);

      // Load specialties
      const { data: specs } = await supabase
        .from('specialties')
        .select('*')
        .order('name');

      setSpecialties(specs || []);

      // Load referrals (pool + assigned to this therapist)
      let query = supabase
        .from('referrals')
        .select(`
          *,
          conversation:conversations(*),
          user_profile:profiles!referrals_user_id_fkey(id, full_name, country, city),
          specialty:specialties(*),
          insights:conversation_insights(*)
        `)
        .or(`status.eq.open,assigned_therapist_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      const { data: refs, error: refsError } = await query;

      if (refsError) {
        console.error('Error loading referrals:', refsError);
        setError('Error al cargar los casos');
      } else {
        // Filter by specialty if needed (client-side since specialty is a relation)
        let filteredRefs = refs || [];
        if (filters.specialty) {
          filteredRefs = filteredRefs.filter(
            (r: any) => r.specialty?.slug === filters.specialty
          );
        }
        setReferrals(filteredRefs as ReferralWithDetails[]);
      }

    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError('Error al cargar el panel');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleRefresh = () => {
    loadData(true);
  };

  // Count stats
  const openCases = referrals.filter(r => r.status === 'open').length;
  const assignedCases = referrals.filter(r => r.status === 'assigned').length;
  const highPriorityCases = referrals.filter(r => r.priority === 'high').length;

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
            <span className="text-sm font-medium text-gray-700">Panel Psicólogo</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {therapistName}
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
            <div className="text-2xl font-bold text-[var(--primary)]">{referrals.length}</div>
            <div className="text-sm text-gray-600">Total casos</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{openCases}</div>
            <div className="text-sm text-gray-600">En pool</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{assignedCases}</div>
            <div className="text-sm text-gray-600">En seguimiento</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{highPriorityCases}</div>
            <div className="text-sm text-gray-600">Alta prioridad</div>
          </div>
        </div>

        {/* Header with refresh */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Casos derivados</h1>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
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

        {/* Filters */}
        <CaseFilters
          filters={filters}
          onFilterChange={setFilters}
          specialties={specialties}
        />

        {/* Case List */}
        {referrals.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay casos disponibles
            </h3>
            <p className="text-gray-600">
              {filters.status !== 'all' || filters.priority !== 'all' || filters.specialty
                ? 'Intenta cambiar los filtros para ver más casos.'
                : 'Los nuevos casos derivados aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {referrals.map((referral) => (
              <CaseCard key={referral.id} referral={referral} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
