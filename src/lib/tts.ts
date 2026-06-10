import { EdgeTTS } from "node-edge-tts";
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { uploadAudio } from "@/lib/storage";

// Male voices suitable for a boyfriend character
const VOICE_EN = "en-US-GuyNeural";       // Natural, conversational male
const VOICE_ZH = "zh-CN-YunyangNeural";   // 云扬 — warm, sunny male voice

// Temp directory for audio files
const TMP_DIR = join(process.cwd(), ".tmp");
if (!existsSync(TMP_DIR)) {
  try { mkdirSync(TMP_DIR, { recursive: true }); } catch {}
}

// Trim text to keep it snappy — Edge TTS handles longer text well
function trimText(text: string, maxChars = 300): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3).replace(/\s+\S*$/, "") + "...";
}

export async function textToSpeech(text: string, lang?: "en" | "zh"): Promise<string> {
  const voice = lang === "zh" ? VOICE_ZH : VOICE_EN;
  const ttsText = trimText(text);
  const outputPath = join(TMP_DIR, `tts-${randomUUID()}.mp3`);

  const tts = new EdgeTTS({
    voice,
    lang: lang === "zh" ? "zh-CN" : "en-US",
    outputFormat: "audio-24khz-96kbitrate-mono-mp3",
    timeout: 15000,
  });

  await tts.ttsPromise(ttsText, outputPath);

  const buffer = readFileSync(outputPath);

  // Clean up temp file
  try { unlinkSync(outputPath); } catch {}

  // Upload to Supabase Storage and return public URL
  const fileName = `tts-${randomUUID()}.mp3`;
  return await uploadAudio(buffer, fileName);
}
