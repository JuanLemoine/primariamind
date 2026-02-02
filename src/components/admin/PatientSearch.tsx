'use client';

import { Search } from 'lucide-react';

interface PatientSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  riskFilter: string;
  onRiskFilterChange: (value: string) => void;
}

export function PatientSearch({
  search,
  onSearchChange,
  riskFilter,
  onRiskFilterChange,
}: PatientSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, ciudad o país..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <select
        value={riskFilter}
        onChange={(e) => onRiskFilterChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">Todos los riesgos</option>
        <option value="critical">Riesgo crítico</option>
        <option value="high">Riesgo alto</option>
        <option value="moderate">Riesgo moderado</option>
        <option value="low">Riesgo bajo</option>
        <option value="none">Sin evaluación</option>
      </select>
    </div>
  );
}
