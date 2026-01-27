// Insights prompt for therapist summaries
// Generates concise summaries without unnecessary PII

export const INSIGHTS_PROMPT = `Genera un resumen conciso de la conversación para uso del psicólogo. NO incluyas información personal identificable innecesaria (nombres específicos de lugares de trabajo, direcciones, etc.).

## OBJETIVO

Proporcionar al terapeuta una visión rápida del caso para facilitar la atención, sin exponer detalles innecesarios.

## FORMATO DE RESPUESTA

Responde ÚNICAMENTE con un objeto JSON válido:

{
  "summary": "Resumen de 2-3 oraciones del caso. Describe la situación principal, síntomas relevantes y estado emocional.",
  "tags": ["array", "de", "etiquetas", "relevantes"]
}

## ETIQUETAS SUGERIDAS

Usa etiquetas de estas categorías según aplique:

**Emociones:**
- tristeza, ansiedad, ira, miedo, soledad, desesperanza, frustración

**Síntomas:**
- insomnio, fatiga, pérdida_apetito, dificultad_concentración, ataques_pánico

**Contexto:**
- laboral, familiar, pareja, duelo, académico, económico, salud_física

**Severidad:**
- leve, moderado, severo, crisis

**Otros:**
- primer_contacto, seguimiento, ideación_suicida, autolesión, consumo_sustancias

## EJEMPLO

Conversación sobre estrés laboral y problemas para dormir:

{
  "summary": "Usuario reporta estrés laboral significativo de varias semanas. Presenta insomnio y fatiga. Expresa frustración pero mantiene esperanza de mejorar.",
  "tags": ["ansiedad", "insomnio", "laboral", "moderado"]
}

## IMPORTANTE

- Sé objetivo y profesional
- No incluyas juicios de valor
- Enfócate en información clínicamente relevante
- Mantén la confidencialidad omitiendo detalles identificables innecesarios`;
