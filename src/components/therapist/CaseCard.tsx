'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { Clock, AlertTriangle, User, ChevronRight } from 'lucide-react';
import { ReferralWithDetails, RiskLevel } from '@/types';
import Link from 'next/link';

interface CaseCardProps {
  referral: ReferralWithDetails;
}

const riskColors: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

const riskLabels: Record<RiskLevel, string> = {
  low: 'Bajo',
  moderate: 'Moderado',
  high: 'Alto',
  critical: 'Crítico',
};

export function CaseCard({ referral }: CaseCardProps) {
  const latestInsight = referral.insights?.[0];
  const riskLevel = latestInsight?.risk_level || 'moderate';

  return (
    <Link href={`/therapist/case/${referral.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {referral.user_profile?.full_name || 'Usuario'}
                </h3>
                <p className="text-sm text-gray-500">
                  {referral.conversation?.title || `Caso #${referral.id.slice(0, 8)}`}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {/* Risk level */}
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium border',
                riskColors[riskLevel]
              )}>
                Riesgo: {riskLabels[riskLevel]}
              </span>

              {/* Priority */}
              {referral.priority === 'high' && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Prioritario
                </span>
              )}

              {/* Specialty */}
              {referral.specialty && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  {referral.specialty.name}
                </span>
              )}

              {/* Status */}
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium border',
                referral.status === 'open' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                referral.status === 'assigned' ? 'bg-green-100 text-green-800 border-green-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
              )}>
                {referral.status === 'open' ? 'Disponible' :
                 referral.status === 'assigned' ? 'En seguimiento' :
                 referral.status === 'waiting' ? 'Lista de espera' : 'Cerrado'}
              </span>
            </div>

            {/* Summary */}
            {latestInsight?.summary && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {latestInsight.summary}
              </p>
            )}

            {/* Tags */}
            {latestInsight?.tags && latestInsight.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {latestInsight.tags.slice(0, 4).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {latestInsight.tags.length > 4 && (
                  <span className="px-2 py-0.5 text-gray-400 text-xs">
                    +{latestInsight.tags.length - 4} más
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5 mr-1" />
          Creado: {new Date(referral.created_at).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </Card>
    </Link>
  );
}
