'use client';

import { CaseListFilters } from '@/types';

interface CaseFiltersProps {
  filters: CaseListFilters;
  onFilterChange: (filters: CaseListFilters) => void;
  specialties: Array<{ id: string; slug: string; name: string }>;
}

export function CaseFilters({ filters, onFilterChange, specialties }: CaseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {/* Priority Filter */}
      <select
        value={filters.priority || 'all'}
        onChange={(e) => onFilterChange({
          ...filters,
          priority: e.target.value as 'normal' | 'high' | 'all',
        })}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      >
        <option value="all">Todas las prioridades</option>
        <option value="high">Alta prioridad</option>
        <option value="normal">Prioridad normal</option>
      </select>

      {/* Status Filter */}
      <select
        value={filters.status || 'all'}
        onChange={(e) => onFilterChange({
          ...filters,
          status: e.target.value as 'open' | 'assigned' | 'waiting' | 'closed' | 'all',
        })}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      >
        <option value="all">Todos los estados</option>
        <option value="open">Disponibles (pool)</option>
        <option value="assigned">En seguimiento</option>
        <option value="waiting">Lista de espera</option>
        <option value="closed">Cerrados</option>
      </select>

      {/* Specialty Filter */}
      <select
        value={filters.specialty || ''}
        onChange={(e) => onFilterChange({
          ...filters,
          specialty: e.target.value || undefined,
        })}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      >
        <option value="">Todas las especialidades</option>
        {specialties.map((specialty) => (
          <option key={specialty.id} value={specialty.slug}>
            {specialty.name}
          </option>
        ))}
      </select>
    </div>
  );
}
