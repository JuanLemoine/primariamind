'use client';

// Alert is used for styling reference
import { Phone, AlertTriangle, MessageCircle } from 'lucide-react';
import { EmergencyLine } from '@/types';

interface CrisisAlertProps {
  emergencyLines: EmergencyLine[];
  contactNotified: boolean;
}

export function CrisisAlert({ emergencyLines, contactNotified }: CrisisAlertProps) {
  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4 animate-pulse-slow">
      <div className="flex items-start gap-3">
        <div className="bg-red-100 p-2 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-red-800 text-lg mb-2">
            Recursos de ayuda inmediata
          </h3>
          <p className="text-red-700 text-sm mb-4">
            Si estás en peligro inmediato o tienes pensamientos de hacerte daño, por favor busca ayuda ahora:
          </p>

          <div className="space-y-3">
            {emergencyLines.map((line, index) => (
              <a
                key={index}
                href={`tel:${line.number.replace(/\s/g, '')}`}
                className="flex items-center gap-3 bg-white p-3 rounded-lg border border-red-200
                           hover:bg-red-50 transition-colors"
              >
                <div className="bg-red-100 p-2 rounded-full">
                  <Phone className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-semibold text-red-800">{line.name}</div>
                  <div className="text-lg font-bold text-red-900">{line.number}</div>
                  <div className="text-xs text-red-600">{line.description}</div>
                </div>
              </a>
            ))}
          </div>

          {contactNotified && (
            <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Hemos notificado a tu contacto de emergencia para que pueda brindarte apoyo.
                </span>
              </div>
            </div>
          )}

          <p className="text-sm text-red-600 mt-4 italic">
            No estás solo/a. Hay personas que quieren ayudarte.
          </p>
        </div>
      </div>
    </div>
  );
}
