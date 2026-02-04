import OpenAI from 'openai';
import { SYSTEM_PROMPT, TRIAGE_PROMPT, TRIAGE_EXAMPLES, INSIGHTS_PROMPT } from '@/prompts';
import { triageResultSchema, insightResultSchema } from '@/lib/validations';
import { Message, TriageResult, InsightResult } from '@/types';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

const MODEL = 'gpt-4o-mini'; // Cost-effective model for MVP

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Generate a chat response from the AI assistant
 */
export async function generateChatResponse(
  messages: Message[],
  userMessage: string
): Promise<string> {
  const chatMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: chatMessages,
      max_tokens: 800,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content ||
      'Lo siento, no pude procesar tu mensaje. ¿Podrías intentarlo de nuevo?';
  } catch (error) {
    console.error('OpenAI chat error:', error);
    throw new Error('Error al generar respuesta');
  }
}

/**
 * Perform triage analysis on the user's message
 */
export async function performTriage(
  messages: Message[],
  userMessage: string
): Promise<TriageResult> {
  // Build context from recent messages
  const context = messages.slice(-5).map(m =>
    `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`
  ).join('\n');

  const prompt = `${TRIAGE_PROMPT}

${TRIAGE_EXAMPLES}

## CONTEXTO DE LA CONVERSACIÓN
${context || 'Primera interacción'}

## MENSAJE ACTUAL DEL USUARIO
${userMessage}

Responde ÚNICAMENTE con el JSON de evaluación:`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'Eres un sistema de triage de salud mental. Respondes SOLO con JSON válido.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more consistent JSON
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty triage response');
    }

    const parsed = JSON.parse(content);
    const validated = triageResultSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Triage error:', error);

    // Return safe default on error
    return {
      risk_level: 'moderate',
      needs_human: false,
      emergency_flag: false,
      recommended_specialty: null,
      urgency: 5,
      reasons: ['Error en evaluación automática'],
      suggested_next_steps: ['Continuar conversación', 'Monitorear siguiente mensaje'],
    };
  }
}

/**
 * Generate insights summary for therapists
 */
export async function generateInsights(
  messages: Message[]
): Promise<InsightResult> {
  // Build conversation summary
  const conversation = messages.map(m =>
    `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`
  ).join('\n');

  const prompt = `${INSIGHTS_PROMPT}

## CONVERSACIÓN
${conversation}

Responde ÚNICAMENTE con el JSON de insights:`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'Eres un sistema de análisis clínico. Respondes SOLO con JSON válido.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty insights response');
    }

    const parsed = JSON.parse(content);
    const validated = insightResultSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Insights error:', error);

    // Return safe default on error
    return {
      summary: 'No se pudo generar resumen automático.',
      tags: ['error_procesamiento'],
    };
  }
}

/**
 * Generate a short title for a conversation based on the user's topic
 */
export async function generateConversationTitle(
  messages: Message[]
): Promise<string> {
  const conversation = messages.map(m =>
    `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`
  ).join('\n');

  try {
    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'Eres un sistema que genera títulos cortos para conversaciones de salud mental. Responde SOLO con el título, sin comillas ni puntuación final. El título debe describir el motivo principal o tema de consulta del usuario en máximo 5 palabras. Ejemplos: "Estrés laboral y agotamiento", "Ansiedad por exámenes", "Problemas familiares", "Dificultad para dormir", "Tristeza y soledad".',
        },
        {
          role: 'user',
          content: `Genera un título corto para esta conversación:\n\n${conversation}`,
        },
      ],
      max_tokens: 30,
      temperature: 0.3,
    });

    const title = response.choices[0]?.message?.content?.trim();
    return title || 'Conversación';
  } catch (error) {
    console.error('Title generation error:', error);
    return 'Conversación';
  }
}
