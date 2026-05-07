import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a support screenshot reference to a viewable URL.
 * Accepts either a legacy public URL or a storage path inside the "support" bucket.
 * For storage paths, generates a short-lived signed URL.
 */
export async function resolveSupportAttachmentUrl(
  ref: string | null | undefined
): Promise<string | null> {
  if (!ref) return null;
  if (/^https?:\/\//i.test(ref)) return ref;
  const { data } = await supabase.storage.from("support").createSignedUrl(ref, 60 * 10);
  return data?.signedUrl ?? null;
}
