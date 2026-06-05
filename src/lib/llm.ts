import OpenAI from "openai";

// Provider-agnostic: works with any OpenAI-compatible API
const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
});

const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

interface ChatParams {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}

export async function chat({ systemPrompt, messages, maxTokens = 500 }: ChatParams): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.9,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
  });

  return response.choices[0]?.message?.content || "";
}
