import { ClassificationResult } from './interfaces/ai-classifier.interface';

export function buildClassificationPrompt(text: string): string {
  return `Você é um classificador operacional industrial.

Analise a mensagem abaixo e retorne um JSON com:
- setor: (manutencao|producao|qualidade|pcp|compras|seguranca|ti|outros)
- prioridade: (baixa|media|alta|critica)
- urgencia: (baixa|media|alta)
- tipo: (parada_maquina|falta_material|qualidade|seguranca|manutencao_preventiva|outros)
- sla_horas: número inteiro
- maquina: string ou null
- op: string ou null
- justificativa: string curta (máximo 100 caracteres)

Mensagem: "${text.replace(/"/g, "'")}"

Retorne SOMENTE o JSON válido, sem markdown, sem explicações.`;
}

export function parseClassificationResponse(raw: string): ClassificationResult {
  const cleaned = raw.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned) as ClassificationResult;
}
