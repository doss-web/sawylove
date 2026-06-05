import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CHARACTERS } from "@/prompts/characters";
import { chat } from "@/lib/llm";
import { textToSpeech } from "@/lib/tts";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId, message } = await req.json();
  if (!characterId || !message?.trim()) {
    return NextResponse.json({ error: "Missing characterId or message" }, { status: 400 });
  }

  const character = CHARACTERS.find(c => c.slug === characterId);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Determine language: use user preference
  const lang = user.language === "zh" ? "zh" : "en";
  const systemPrompt = lang === "zh" ? character.systemPromptZh : character.systemPromptEn;

  // Get or create chat session
  let chatSession = await db.chatSession.findUnique({
    where: { userId_characterId: { userId: user.id, characterId } },
  });
  if (!chatSession) {
    chatSession = await db.chatSession.create({
      data: { userId: user.id, characterId },
    });
  }

  // Build memory context (stub — enhanced in Task 9)
  const memoryContext = "";

  // Full system prompt
  const fullPrompt = systemPrompt + "\n\n" + memoryContext;

  // Get recent message history (last 20 messages)
  const recentMessages = await db.message.findMany({
    where: { sessionId: chatSession.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const history = recentMessages.reverse().map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Save user message
  await db.message.create({
    data: { sessionId: chatSession.id, role: "user", content: message },
  });

  // Get AI reply
  const reply = await chat({ systemPrompt: fullPrompt, messages: [...history, { role: "user", content: message }] });

  // Save AI reply
  const savedMsg = await db.message.create({
    data: { sessionId: chatSession.id, role: "assistant", content: reply },
  });

  // Generate TTS audio
  let audioUrl: string | null = null;
  try {
    audioUrl = await textToSpeech(reply);
  } catch (e) {
    console.error("TTS failed:", e);
    // Chat still works without audio
  }

  return NextResponse.json({
    id: savedMsg.id,
    role: "assistant",
    content: reply,
    audioUrl,
    createdAt: savedMsg.createdAt.toISOString(),
  });
}
