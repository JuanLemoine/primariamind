// Triage prompt for risk assessment
// This analyzes messages and returns a structured JSON assessment

export const TRIAGE_PROMPT = `Analiza el siguiente mensaje del usuario y su contexto de conversación. Debes evaluar el nivel de riesgo y determinar si necesita atención humana.

## CRITERIOS DE EVALUACIÓN

### Nivel de Riesgo (risk_level)
- **low**: Consultas informativas, bienestar general, curiosidad sobre salud mental
- **moderate**: Síntomas leves de ansiedad/estrés, situaciones difíciles pero manejables
- **high**: Síntomas significativos, ideación pasiva de autolesión, crisis emocional intensa
- **critical**: Ideación suicida activa, planes de autolesión, psicosis, emergencia inmediata

### Necesita Humano (needs_human)
Marca como true si:
- Síntomas persistentes o significativos que requieren evaluación profesional
- El usuario expresa deseo de hablar con alguien "real"
- Situaciones complejas que exceden orientación básica
- Necesidad de seguimiento continuo
- Problemas de relaciones/familia que requieren terapia
- Situaciones legales o médicas complejas

### Bandera de Emergencia (emergency_flag)
Marca como true SOLO si:
- Ideación suicida activa o planes específicos
- Intención de hacerse daño o a otros
- Síntomas psicóticos activos
- Abuso activo o peligro inmediato
- Crisis que requiere intervención inmediata

### Especialidad Recomendada (recommended_specialty)
Usa una de estas opciones o null si no aplica:
- ansiedad
- depresion
- duelo
- estres_laboral
- parejas_familia
- adicciones
- trauma
- trastornos_sueno
- autoestima
- general

### Urgencia (urgency)
Escala del 1 al 10:
- 1-3: Puede esperar, situación estable
- 4-6: Debería atenderse pronto pero no urgente
- 7-8: Requiere atención prioritaria
- 9-10: Requiere atención inmediata

## PRINCIPIO DE PRECAUCIÓN

Es mejor ser conservador y escalar el riesgo que subestimarlo.
Ante la duda, prioriza la seguridad del usuario.

## RESPUESTA

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional:

{
  "risk_level": "low" | "moderate" | "high" | "critical",
  "needs_human": boolean,
  "emergency_flag": boolean,
  "recommended_specialty": string | null,
  "urgency": number (1-10),
  "reasons": string[] (razones cortas de tu evaluación),
  "suggested_next_steps": string[] (pasos sugeridos para el usuario)
}`;

export const TRIAGE_EXAMPLES = `
Ejemplos de evaluación:

Usuario: "Me siento un poco estresado por el trabajo"
{
  "risk_level": "low",
  "needs_human": false,
  "emergency_flag": false,
  "recommended_specialty": "estres_laboral",
  "urgency": 2,
  "reasons": ["Estrés laboral leve", "No hay señales de crisis"],
  "suggested_next_steps": ["Técnicas de manejo del estrés", "Evaluación de carga laboral"]
}

Usuario: "Llevo semanas sin poder dormir y me siento cada vez peor, no veo salida"
{
  "risk_level": "high",
  "needs_human": true,
  "emergency_flag": false,
  "recommended_specialty": "depresion",
  "urgency": 7,
  "reasons": ["Insomnio prolongado", "Desesperanza expresada", "Posibles síntomas depresivos"],
  "suggested_next_steps": ["Evaluación profesional", "Técnicas de higiene del sueño", "Seguimiento cercano"]
}

Usuario: "Ya no quiero seguir viviendo, he pensado en cómo acabar con esto"
{
  "risk_level": "critical",
  "needs_human": true,
  "emergency_flag": true,
  "recommended_specialty": "general",
  "urgency": 10,
  "reasons": ["Ideación suicida activa", "Posibles planes de autolesión", "Emergencia psicológica"],
  "suggested_next_steps": ["Contactar línea de crisis 123", "Notificar contacto de emergencia", "Derivación urgente a profesional"]
}`;
