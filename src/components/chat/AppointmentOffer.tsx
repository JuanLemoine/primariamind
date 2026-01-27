'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { Calendar, Clock, User, X, Check } from 'lucide-react';
import { formatDateOnly, formatTime } from '@/lib/utils';

interface AvailableSlot {
  id: string;
  therapist_id: string;
  therapist_name: string;
  start_ts: string;
  end_ts: string;
}

interface AppointmentOfferProps {
  slots: AvailableSlot[];
  specialty?: string;
  onBook: (slotId: string) => void;
  onDismiss: () => void;
  loading?: boolean;
}

export function AppointmentOffer({
  slots,
  specialty,
  onBook,
  onDismiss,
  loading
}: AppointmentOfferProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = new Date(slot.start_ts).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, AvailableSlot[]>);

  const handleBook = () => {
    if (selectedSlot) {
      onBook(selectedSlot);
    }
  };

  return (
    <Card className="border-2 border-teal-200 bg-teal-50 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 p-2 rounded-full">
            <Calendar className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-teal-800">
              Agenda una cita con un profesional
            </h3>
            {specialty && (
              <p className="text-sm text-teal-600">
                Especialidad recomendada: {specialty}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-teal-700 mb-4">
        Basado en nuestra conversación, te recomendamos hablar con uno de nuestros psicólogos.
        Selecciona un horario disponible:
      </p>

      <div className="space-y-4 max-h-64 overflow-y-auto">
        {Object.entries(slotsByDate).map(([date, dateSlots]) => (
          <div key={date}>
            <h4 className="text-sm font-semibold text-teal-800 mb-2">
              {formatDateOnly(date)}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dateSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedSlot === slot.id
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'bg-white border-teal-200 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-sm">
                      {formatTime(slot.start_ts)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 opacity-70" />
                    <span className="text-xs truncate opacity-80">
                      {slot.therapist_name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {slots.length === 0 && (
        <div className="text-center py-4 text-teal-600">
          No hay horarios disponibles en este momento. Te agregaremos a la lista de espera.
        </div>
      )}

      <div className="flex gap-3 mt-4 pt-4 border-t border-teal-200">
        <Button
          variant="secondary"
          onClick={onDismiss}
          className="flex-1"
        >
          Ahora no
        </Button>
        <Button
          onClick={handleBook}
          disabled={!selectedSlot || loading}
          loading={loading}
          className="flex-1 bg-teal-600 hover:bg-teal-700"
        >
          <Check className="w-4 h-4" />
          Agendar cita
        </Button>
      </div>
    </Card>
  );
}
