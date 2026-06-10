import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("[storage] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Audio upload will fail.");
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

const BUCKET = "audio";

/**
 * Upload an audio buffer to Supabase Storage and return the public URL.
 */
export async function uploadAudio(buffer: Buffer, fileName: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: "audio/mpeg",
      upsert: false,
    });

  if (error) throw new Error(`Audio upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Delete an audio file from Supabase Storage by its public URL.
 * Returns true if deleted, false if not found.
 */
export async function deleteAudio(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    // URL format: https://xxx.supabase.co/storage/v1/object/public/audio/tts-xxx.mp3
    const pathSegment = urlObj.pathname.split("/public/audio/")[1];
    if (!pathSegment) return false;

    const { error } = await supabase.storage.from(BUCKET).remove([decodeURIComponent(pathSegment)]);
    return !error;
  } catch {
    return false;
  }
}
