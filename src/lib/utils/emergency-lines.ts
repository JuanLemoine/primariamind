import { EmergencyLine } from '@/types';

interface EmergencyConfig {
  country: string;
  city?: string;
  lines: EmergencyLine[];
}

// Emergency lines configuration by country/city
// Default is Colombia
const emergencyConfigs: EmergencyConfig[] = [
  {
    country: 'colombia',
    lines: [
      {
        name: 'Línea de Emergencias',
        number: '123',
        description: 'Línea nacional de emergencias - Policía, Bomberos, Ambulancia'
      },
      {
        name: 'Línea de Salud Mental',
        number: '192 opción 4',
        description: 'Línea de atención en salud mental - Ministerio de Salud'
      }
    ]
  },
  {
    country: 'colombia',
    city: 'bogota',
    lines: [
      {
        name: 'Línea de Emergencias',
        number: '123',
        description: 'Línea nacional de emergencias - Policía, Bomberos, Ambulancia'
      },
      {
        name: 'Línea 106',
        number: '106',
        description: 'Línea de atención a la infancia y adolescencia - ICBF'
      },
      {
        name: 'Línea de Salud Mental',
        number: '192 opción 4',
        description: 'Línea de atención en salud mental - Ministerio de Salud'
      },
      {
        name: 'WhatsApp Secretaría de Salud',
        number: '300 754 8933',
        description: 'Atención en crisis de salud mental - Bogotá'
      }
    ]
  },
  {
    country: 'mexico',
    lines: [
      {
        name: 'Emergencias',
        number: '911',
        description: 'Número nacional de emergencias'
      },
      {
        name: 'SAPTEL',
        number: '55 5259 8121',
        description: 'Atención psicológica telefónica 24 horas'
      },
      {
        name: 'Línea de la Vida',
        number: '800 911 2000',
        description: 'Atención a crisis emocionales - CONADIC'
      }
    ]
  },
  {
    country: 'argentina',
    lines: [
      {
        name: 'Emergencias',
        number: '107',
        description: 'SAME - Emergencias médicas'
      },
      {
        name: 'Centro de Asistencia al Suicida',
        number: '135',
        description: 'Atención en crisis - 24 horas'
      },
      {
        name: 'Salud Mental',
        number: '0800-333-1665',
        description: 'Línea de atención en salud mental'
      }
    ]
  },
  {
    country: 'espana',
    lines: [
      {
        name: 'Emergencias',
        number: '112',
        description: 'Número europeo de emergencias'
      },
      {
        name: 'Teléfono de la Esperanza',
        number: '717 003 717',
        description: 'Atención al suicidio - 24 horas'
      }
    ]
  },
  {
    country: 'chile',
    lines: [
      {
        name: 'Emergencias',
        number: '131',
        description: 'Ambulancia y emergencias médicas'
      },
      {
        name: 'Salud Responde',
        number: '600 360 7777',
        description: 'Orientación en salud mental'
      }
    ]
  }
];

// Default emergency lines (Colombia)
const defaultLines: EmergencyLine[] = [
  {
    name: 'Línea de Emergencias',
    number: '123',
    description: 'Línea nacional de emergencias'
  },
  {
    name: 'Línea de Salud Mental',
    number: '192 opción 4',
    description: 'Línea de atención en salud mental'
  }
];

export function getEmergencyLines(country?: string | null, city?: string | null): EmergencyLine[] {
  if (!country) {
    return defaultLines;
  }

  const normalizedCountry = country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizedCity = city?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Try to find city-specific config first
  if (normalizedCity) {
    const cityConfig = emergencyConfigs.find(
      c => c.country === normalizedCountry && c.city === normalizedCity
    );
    if (cityConfig) {
      return cityConfig.lines;
    }
  }

  // Fall back to country config
  const countryConfig = emergencyConfigs.find(
    c => c.country === normalizedCountry && !c.city
  );
  if (countryConfig) {
    return countryConfig.lines;
  }

  return defaultLines;
}

export function formatEmergencyMessage(lines: EmergencyLine[]): string {
  let message = '🚨 **Si estás en peligro inmediato o tienes pensamientos de hacerte daño, por favor busca ayuda ahora:**\n\n';

  lines.forEach(line => {
    message += `📞 **${line.name}**: ${line.number}\n   ${line.description}\n\n`;
  });

  message += '💚 No estás solo/a. Hay personas que quieren ayudarte.\n\n';
  message += '_Este servicio no reemplaza la atención de emergencia. Si estás en crisis, llama a los números de emergencia._';

  return message;
}

export function getEmergencyNotificationMessage(userName: string): string {
  return `Alerta de bienestar: ${userName} podría necesitar apoyo. Por favor contáctalo(a) y si hay riesgo inmediato llama a emergencias (123 en Colombia).`;
}
