import OpenAI from "openai";

// Provider-agnostic: works with any OpenAI-compatible API
const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
  timeout: 30000, // 30s timeout — prevent hanging requests
  maxRetries: 1,
});

const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

interface ChatParams {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
}

export async function chat({ systemPrompt, messages, maxTokens = 500, temperature = 0.9 }: ChatParams): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
  });

  return response.choices[0]?.message?.content || "";
}
