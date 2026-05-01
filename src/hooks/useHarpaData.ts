import { useQuery } from "@tanstack/react-query";

export interface Hino {
  hino: string;
  coro: string;
  verses: Record<string, string>;
}

let inflight: Promise<Record<string, Hino | unknown>> | null = null;

async function fetchHarpa(): Promise<Record<string, Hino | unknown>> {
  if (inflight) return inflight;
  inflight = fetch("/data/harpa-crista.json", { cache: "force-cache" })
    .then((r) => {
      if (!r.ok) throw new Error("Falha ao baixar a Harpa");
      return r.json();
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

/** Pré-carrega o JSON da Harpa (use em hover/touchstart de links) */
export function prefetchHarpa() {
  void fetchHarpa();
}

export function useHarpaData() {
  return useQuery({
    queryKey: ["harpa-crista"],
    queryFn: fetchHarpa,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
