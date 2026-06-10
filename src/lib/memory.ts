import { chat } from "@/lib/llm";
import { db } from "@/lib/db";

const EXTRACTION_PROMPT = `Extract key facts about the user from this conversation. Return a JSON object with:
- "newFacts": array of {key, value} for new or updated information about the user (name, age, job, hobbies, likes, dislikes, important life events, relationships, mood, etc.)
- "mood": the user's current emotional state (one word or short phrase)
- "stageUpdate": the relationship stage, one of: "acquaintance", "getting_to_know", "flirting", "dating", "close", "deep"
- "summary": a 1-2 sentence summary of this conversation turn, capturing the most meaningful exchange

Only include facts explicitly mentioned. If nothing new, return empty arrays. Respond with ONLY valid JSON, no explanation.`;

interface ExtractionResult {
  newFacts: { key: string; value: string }[];
  mood: string;
  stageUpdate: string;
  summary: string;
}

export async function extractMemories(
  userMessage: string,
  aiReply: string,
  previousFacts: { key: string; value: string }[]
): Promise<ExtractionResult> {
  const factsContext = previousFacts.length > 0
    ? `Previous known facts about user:\n${previousFacts.map(f => `- ${f.key}: ${f.value}`).join("\n")}`
    : "No previous facts known.";

  const result = await chat({
    systemPrompt: EXTRACTION_PROMPT,
    messages: [
      {
        role: "user",
        content: `${factsContext}\n\nUser's message: "${userMessage}"\nAI's reply: "${aiReply}"\n\nExtract new/updated facts, mood, relationship stage, and summary.`,
      },
    ],
    maxTokens: 500,
    temperature: 0.3,
  });

  try {
    // Parse JSON from response (strip markdown code fences if present)
    const json = JSON.parse(result.replace(/```json/g, "").replace(/```/g, "").trim());
    return {
      newFacts: json.newFacts || [],
      mood: json.mood || "",
      stageUpdate: json.stageUpdate || "",
      summary: json.summary || "",
    };
  } catch {
    return { newFacts: [], mood: "", stageUpdate: "", summary: "" };
  }
}

export async function buildMemoryContext(userId: string, characterId: string): Promise<string> {
  const memories = await db.userMemory.findMany({
    where: { userId, characterId },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });
  const session = await db.chatSession.findUnique({ where: { userId_characterId: { userId, characterId } } });

  const factsText = memories.map(m => `- ${m.key}: ${m.value}`).join("\n");
  const mood = session?.mood || "unknown";
  const stage = session?.stage || "acquaintance";
  const summary = session?.summary || "";

  return `[MEMORY CONTEXT]
About the user:
${factsText || "(no facts yet)"}

Current mood: ${mood}
Relationship stage: ${stage}
Recent conversation summary: ${summary || "(new conversation)"}

Use this context naturally. Mention specific facts only when relevant. Don't force references.`;
}
