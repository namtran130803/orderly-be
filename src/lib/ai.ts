import Groq from 'groq-sdk';
import { env } from '@/config/env';
import { ANALYSIS_MENU_PROMPT, GENERATION_MENU_PROMPT } from '@/config/ai/menu.prompts';
import { ANALYSIS_EXPENSE_PROMPT, GENERATION_EXPENSE_PROMPT } from '@/config/ai/expense.prompts';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

function extractJson(raw: string): string {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  return raw.trim();
}

async function callGroqVision(prompt: string, imageBase64: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ],
      },
    ],
    temperature: 0.2,
    top_p: 0.5,
    stream: false,
  });

  return completion.choices[0]?.message?.content ?? '';
}

async function callGroqText(systemPrompt: string, userContent: string, maxTokens: number = 4096): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
    top_p: 0.5,
    stream: false,
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  return extractJson(raw);
}

// Menu
export async function callGroqForAnalysis(imageBase64: string): Promise<string> {
  return callGroqVision(ANALYSIS_MENU_PROMPT, imageBase64);
}

export async function callGroqForGeneration(description: string): Promise<string> {
  return callGroqText(GENERATION_MENU_PROMPT, description);
}

// Expense
export async function callGroqForExpenseAnalysis(imageBase64: string): Promise<string> {
  return callGroqVision(ANALYSIS_EXPENSE_PROMPT, imageBase64);
}

export async function callGroqForExpenseGeneration(description: string): Promise<string> {
  return callGroqText(GENERATION_EXPENSE_PROMPT, description);
}
