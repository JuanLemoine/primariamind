# PrimariaMind by Neurosay

**Orientación en salud mental primaria con inteligencia artificial**

## Descripción

PrimariaMind es una aplicación web que proporciona orientación inicial en salud mental a través de un asistente de IA. El sistema realiza triage automático, detecta situaciones de riesgo y facilita la conexión con profesionales de salud mental cuando es necesario.

**Importante:** Este servicio NO reemplaza la atención médica profesional. Está diseñado para brindar psicoeducación y orientación general.

## Características

### Para Usuarios
- Chat con asistente de IA especializado en salud mental primaria
- Triage automático para evaluar nivel de riesgo
- Protocolo de crisis con líneas de emergencia locales
- Opción de agendar citas con psicólogos especializados
- Registro de contacto de emergencia para notificaciones en caso de riesgo alto

### Para Psicólogos
- Panel de casos derivados con filtros por prioridad y especialidad
- Vista de resumen e insights generados por IA
- Acceso al historial de conversación (con mínima información necesaria)
- Sistema de notas del terapeuta
- Pool de casos para asignación

### Seguridad
- Row Level Security (RLS) en Supabase
- Autenticación con Supabase Auth
- Separación de roles (usuario/terapeuta)
- Auditoría de notificaciones de emergencia
- Datos sensibles protegidos

## Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **IA:** OpenAI GPT-4o-mini
- **Validación:** Zod
- **Testing:** Vitest

## Requisitos Previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- API Key de [OpenAI](https://platform.openai.com)

## Instalación

### 1. Instalar dependencias

```bash
cd primariamind
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y completa las variables:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# OpenAI
OPENAI_API_KEY=sk-...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar Supabase

#### Crear las tablas

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a SQL Editor
3. Ejecuta en orden los archivos de `supabase/migrations/`:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_seed_data.sql`

#### Crear usuarios de prueba (opcional)

1. Ve a Authentication > Users
2. Crea usuarios de prueba:
   - Usuario normal: `user@test.com`
   - Terapeuta: `therapist@test.com`
3. Ejecuta `supabase/seed/setup_demo_therapists.sql` con los UUIDs correctos

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
primariamind/
├── src/
│   ├── app/                    # Páginas (App Router)
│   │   ├── api/               # API Routes
│   │   │   ├── chat/send/     # Envío de mensajes
│   │   │   ├── therapists/    # Disponibilidad
│   │   │   └── appointments/  # Citas
│   │   ├── auth/              # Login/Register
│   │   ├── consent/           # Consentimiento
│   │   ├── onboarding/        # Onboarding
│   │   ├── chat/              # Chat principal
│   │   └── therapist/         # Panel psicólogo
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base
│   │   ├── chat/             # Componentes del chat
│   │   ├── therapist/        # Componentes panel
│   │   └── layout/           # Layout y Logo
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilidades
│   │   ├── ai/               # Integración OpenAI
│   │   ├── supabase/         # Clientes Supabase
│   │   ├── utils/            # Helpers
│   │   └── validations/      # Schemas Zod
│   ├── prompts/               # Prompts de IA
│   └── types/                 # TypeScript types
├── supabase/
│   ├── migrations/            # SQL para crear tablas
│   └── seed/                  # Datos de ejemplo
└── tests/                     # Tests unitarios
```

## Especialidades Disponibles

| Slug | Nombre | Descripción |
|------|--------|-------------|
| ansiedad | Ansiedad | Trastornos de ansiedad, pánico, fobias |
| depresion | Depresión | Estado de ánimo, desesperanza |
| duelo | Duelo | Pérdidas, procesos de duelo |
| estres_laboral | Estrés Laboral | Burnout, agotamiento |
| parejas_familia | Parejas y Familia | Relaciones, conflictos |
| adicciones | Adicciones | Dependencias |
| trauma | Trauma | TEPT, experiencias traumáticas |
| trastornos_sueno | Trastornos del Sueño | Insomnio |
| autoestima | Autoestima | Autoconcepto |
| general | General | Orientación general |

## Testing

```bash
# Ejecutar tests en modo watch
npm test

# Ejecutar tests una vez
npm run test:run
```

## Líneas de Emergencia

El sistema incluye líneas de emergencia para:
- **Colombia** (default): 123, 192 opción 4, Línea 106
- **México:** 911, SAPTEL, Línea de la Vida
- **Argentina:** 107, 135
- **Chile:** 131, Salud Responde
- **España:** 112, Teléfono de la Esperanza

## Checklist de Seguridad

- [x] Row Level Security (RLS) habilitado en todas las tablas
- [x] Autenticación requerida para rutas protegidas
- [x] Validación de entrada con Zod en todos los endpoints
- [x] Roles separados (user/therapist) con permisos diferenciados
- [x] Datos sensibles (contacto de emergencia) solo accesibles por el propietario
- [x] Auditoría de notificaciones de emergencia
- [x] Service role key solo usado en backend para operaciones administrativas
- [x] Disclaimers claros sobre limitaciones del servicio

## Próximos Pasos (Post-MVP)

- [ ] Integración real con Twilio/WhatsApp para notificaciones SMS
- [ ] Verificación de credenciales de terapeutas
- [ ] Sistema de pagos para citas
- [ ] Videollamadas integradas
- [ ] App móvil (React Native)
- [ ] Dashboard de métricas para administradores
- [ ] Certificación HIPAA/ISO 27001

## Consideraciones Éticas

1. **Disclaimers claros:** El sistema siempre comunica que no reemplaza atención profesional
2. **Protocolo de crisis:** Prioridad absoluta en casos de riesgo
3. **Consentimiento informado:** Los usuarios aceptan términos antes de usar
4. **Mínima exposición:** Los terapeutas ven solo información necesaria
5. **Auditoría:** Todas las notificaciones de emergencia quedan registradas

---

**Desarrollado por Neurosay para el bienestar mental.**
