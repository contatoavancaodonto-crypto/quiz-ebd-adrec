import { useFullProfile } from "@/hooks/useFullProfile";

const ROMAN = ["1º", "2º", "3º", "4º"];

/**
 * Retorna informações dinâmicas do período vigente:
 * - trimestre atual (1º/2º/3º/4º) baseado no mês corrente
 * - ano corrente
 * - igreja do usuário (a partir do perfil; fallback "ADREC")
 *
 * Também devolve `eyebrow(prefix)` para montar rapidamente o texto
 * usado no PageHero, ex.: "Resultado · 2º TRI. 2026 - IGREJA X".
 */
export function useCurrentPeriodLabel() {
  const { data: profile } = useFullProfile();
  const now = new Date();
  const trimesterIndex = Math.floor(now.getMonth() / 3); // 0..3
  const trimester = ROMAN[trimesterIndex];
  const year = now.getFullYear();
  const church = profile?.church_name?.trim() || "ADREC";

  const periodLabel = `${trimester} TRI. ${year} - ${church}`;

  const eyebrow = (prefix: string) => `${prefix} · ${periodLabel}`;

  return { trimester, year, church, periodLabel, eyebrow };
}
