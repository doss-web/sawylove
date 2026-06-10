import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CHARACTERS } from "@/prompts/characters";
import { chat } from "@/lib/llm";
import { textToSpeech } from "@/lib/tts";
import { db } from "@/lib/db";
import { extractMemories, buildMemoryContext } from "@/lib/memory";
import { checkAndIncrementRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId, message } = await req.json();
  if (!characterId || !message?.trim()) {
    return NextResponse.json({ error: "Missing characterId or message" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long. Please keep it under 2000 characters." }, { status: 400 });
  }

  const character = CHARACTERS.find(c => c.slug === characterId);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Rate limit check — atomic check + increment prevents race condition
  const rateCheck = await checkAndIncrementRateLimit(user.id);
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

  const isNSFW = modCheck.toLowerCase().trim().replace(/[^a-z]/g, "");
  if (isNSFW === "yes") {
    // Save the user message but respond with a deflection
    await db.message.create({
      data: { sessionId: chatSession!.id, role: "user", content: message },
    });
    const deflection = lang === "zh"
      ? "我更想好好了解你这个人。聊点别的吧？"
      : "I'd rather get to know the real you. Let's talk about something else?";
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

  // Fire-and-forget memory extraction — batched: every 10 msgs or 5 min idle
  (async () => {
    try {
      // Count unprocessed messages since last extraction
      const unprocessedCount = await db.message.count({
        where: {
          sessionId: chatSession.id,
          createdAt: { gt: chatSession.lastMemoryExtractionAt || chatSession.createdAt },
        },
      });

      // Find the oldest unprocessed message for idle check
      const oldestUnprocessed = unprocessedCount > 0
        ? await db.message.findFirst({
            where: {
              sessionId: chatSession.id,
              createdAt: { gt: chatSession.lastMemoryExtractionAt || chatSession.createdAt },
            },
            orderBy: { createdAt: "asc" },
            select: { createdAt: true },
          })
        : null;

      const minutesSinceOldest = oldestUnprocessed
        ? (Date.now() - oldestUnprocessed.createdAt.getTime()) / 60000
        : 0;

      const shouldExtract = unprocessedCount >= 10 || (unprocessedCount > 0 && minutesSinceOldest >= 5);

      if (!shouldExtract) return;

      // Lock the extraction window immediately to prevent concurrent duplicate extraction
      const extractionTime = new Date();
      await db.chatSession.update({
        where: { id: chatSession!.id },
        data: { lastMemoryExtractionAt: extractionTime },
      });

      // Do the extraction
      const previousFacts = await db.userMemory.findMany({ where: { userId: user.id, characterId } });
      const result = await extractMemories(message, reply, previousFacts.map(f => ({ key: f.key, value: f.value })));

      for (const fact of result.newFacts) {
        const existing = await db.userMemory.findFirst({
          where: { userId: user.id, characterId, key: fact.key },
        });
        if (existing) {
          await db.userMemory.update({ where: { id: existing.id }, data: { value: fact.value } });
        } else {
          await db.userMemory.create({ data: { userId: user.id, characterId, key: fact.key, value: fact.value } });
        }
      }

      await db.chatSession.update({
        where: { id: chatSession!.id },
        data: {
          mood: result.mood || undefined,
          stage: result.stageUpdate || undefined,
          summary: result.summary || undefined,
        },
      });
    } catch (e) {
      console.error("Memory extraction failed:", e);
    }
  })();

  // TTS — Edge-TTS is fast (~1s), synchronous is fine
  let audioUrl: string | null = null;
  try {
    audioUrl = await textToSpeech(reply, lang as "en" | "zh");
    // Save audio URL to message for history
    await db.message.update({ where: { id: savedMsg.id }, data: { audioUrl } });
  } catch (e) {
    console.error("TTS failed:", e);
    // Chat works without audio
  }

  return NextResponse.json({
    id: savedMsg.id,
    role: "assistant",
    content: reply,
    audioUrl,
    createdAt: savedMsg.createdAt.toISOString(),
    remaining: rateCheck.remaining,
  });
}
