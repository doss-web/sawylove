import OpenAI from "openai";

const ttsClient = new OpenAI({
  apiKey: process.env.TTS_API_KEY || process.env.LLM_API_KEY!,
  baseURL: process.env.TTS_BASE_URL || process.env.LLM_BASE_URL || "https://api.openai.com/v1",
});

const TTS_MODEL = process.env.TTS_MODEL || "tts-1";
const TTS_VOICE = process.env.TTS_VOICE || "alloy";

export async function textToSpeech(text: string): Promise<string> {
  // Trim text for TTS — take first 200 chars to keep it snappy
  const ttsText = text.length > 200 ? text.slice(0, 200) + "..." : text;

  const response = await ttsClient.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE as any,
    input: ttsText,
    response_format: "mp3",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  const base64 = buffer.toString("base64");
  return `data:audio/mp3;base64,${base64}`;
}
