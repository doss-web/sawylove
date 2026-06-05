import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CHARACTERS } from "@/prompts/characters";
import { chat } from "@/lib/llm";
import { textToSpeech } from "@/lib/tts";
import { db } from "@/lib/db";
import { extractMemories, buildMemoryContext } from "@/lib/memory";
import { checkRateLimit, incrementMessageCount } from "@/lib/rate-limit";

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

  // Rate limit check
  const rateCheck = await checkRateLimit(user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Daily message limit reached. Subscribe for unlimited messages.", remaining: 0 },
      { status: 429 }
    );
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

  // Build memory context from stored facts
  const memoryContext = await buildMemoryContext(user.id, characterId);

  // Full system prompt
  const fullPrompt = systemPrompt + "\n\n" + memoryContext;

  // Moderation check — LLM-based NSFW filter
  const MODERATION_PROMPT = "Determine if the following user message is sexually explicit, pornographic, or NSFW. Answer ONLY \"yes\" or \"no\".";

  const modCheck = await chat({
    systemPrompt: MODERATION_PROMPT,
    messages: [{ role: "user", content: message }],
    maxTokens: 5,
  });

  if (modCheck.toLowerCase().trim().startsWith("yes")) {
    // Save the user message but respond with a deflection
    await db.message.create({
      data: { sessionId: chatSession!.id, role: "user", content: message },
    });
    const deflection = lang === "zh"
      ? "我更想好好了解你这个人。聊点别的吧？😊"
      : "I'd rather get to know the real you. Let's talk about something else? 😊";
    return NextResponse.json({
      id: "",
      role: "assistant",
      content: deflection,
      audioUrl: null,
      createdAt: new Date().toISOString(),
    });
  }

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

  // Fire-and-forget memory extraction (don't block response)
  extractMemories(message, reply, []).then(async (result) => {
    // Save new facts
    for (const fact of result.newFacts) {
      await db.userMemory.upsert({
        where: { userId_key: { userId: user.id, key: fact.key } },
        update: { value: fact.value },
        create: { userId: user.id, key: fact.key, value: fact.value },
      });
    }
    // Update session
    await db.chatSession.update({
      where: { id: chatSession!.id },
      data: {
        mood: result.mood || undefined,
        stage: result.stageUpdate || undefined,
      },
    });
  }).catch(e => console.error("Memory extraction failed:", e));

  // Generate TTS audio
  let audioUrl: string | null = null;
  try {
    audioUrl = await textToSpeech(reply);
  } catch (e) {
    console.error("TTS failed:", e);
    // Chat still works without audio
  }

  // Increment user's daily message count
  await incrementMessageCount(user.id);

  return NextResponse.json({
    id: savedMsg.id,
    role: "assistant",
    content: reply,
    audioUrl,
    createdAt: savedMsg.createdAt.toISOString(),
    remaining: rateCheck.remaining - 1,
  });
}
