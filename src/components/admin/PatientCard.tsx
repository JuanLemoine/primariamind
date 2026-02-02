'use client';

import Link from 'next/link';
import { User, MapPin, MessageSquare, AlertTriangle, Clock } from 'lucide-react';

interface PatientCardProps {
  patient: {
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
    open_referrals: number;
    has_high_priority: boolean;
  };
}

const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function PatientCard({ patient }: PatientCardProps) {
  const location = [patient.city, patient.country].filter(Boolean).join(', ');

  return (
    <Link href={`/admin/patient/${patient.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {patient.full_name || 'Sin nombre'}
              </h3>
              {location && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {patient.has_high_priority && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                Prioridad alta
              </span>
            )}
            {patient.latest_risk_level && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${riskColors[patient.latest_risk_level] || 'bg-gray-100 text-gray-700'}`}>
                Riesgo: {patient.latest_risk_level}
              </span>
            )}
          </div>
        </div>

        {patient.latest_summary && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
            {patient.latest_summary}
          </p>
        )}

        {patient.latest_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {patient.latest_tags.slice(0, 4).map(tag => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                {tag}
              </span>
            ))}
            {patient.latest_tags.length > 4 && (
              <span className="text-xs text-gray-400">+{patient.latest_tags.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>{patient.conversation_count} conversaciones</span>
          </div>
          {patient.open_referrals > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              <span>{patient.open_referrals} referrals abiertos</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(patient.last_activity).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
