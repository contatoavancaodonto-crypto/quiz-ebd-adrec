import { supabase } from "@/integrations/supabase/client";

/**
 * Códigos de erro do Postgres que indicam vínculos/dependências bloqueando o DELETE.
 * - 23503 foreign_key_violation
 * - 23505 unique_violation (rare here)
 */
const FK_BLOCKING_CODES = new Set(["23503"]);

export interface SmartDeleteOptions {
  /** Tabela a deletar */
  table:
    | "churches"
    | "classes"
    | "quizzes"
    | "verses"
    | "badges"
    | "seasons"
    | "participants";
  id: string;
  /** Coluna usada para soft delete (default: "active" → false) */
  softColumn?: string;
  /** Valor de soft delete (default: false) */
  softValue?: any;
}

export interface SmartDeleteResult {
  ok: boolean;
  mode?: "hard" | "soft";
  error?: string;
}

/**
 * Tenta DELETE permanente. Se houver vínculos (FK), faz soft delete.
 * Para entidades sem suporte (RLS), retorna erro para o caller tratar.
 */
export async function smartDelete(
  opts: SmartDeleteOptions
): Promise<SmartDeleteResult> {
  const { table, id, softColumn = "active", softValue = false } = opts;

  // 1) Tenta hard delete
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (!error) return { ok: true, mode: "hard" };

  // 2) Se foi violação de FK → soft delete
  const code = (error as any)?.code as string | undefined;
  if (code && FK_BLOCKING_CODES.has(code)) {
    const { error: softErr } = await (supabase as any)
      .from(table)
      .update({ [softColumn]: softValue })
      .eq("id", id);
    if (softErr) return { ok: false, error: softErr.message };
    return { ok: true, mode: "soft" };
  }

  return { ok: false, error: error.message };
}

/**
 * Oculta um perfil de usuário (soft delete via hidden_at).
 * Não remove a conta de auth — usuário ainda consegue logar.
 */
export async function hideUserProfile(profileId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ hidden_at: new Date().toISOString() } as any)
    .eq("id", profileId);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

/** Reverte ocultação de um perfil */
export async function restoreUserProfile(profileId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ hidden_at: null } as any)
    .eq("id", profileId);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
