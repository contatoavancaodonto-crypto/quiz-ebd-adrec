import { useQuery } from "@tanstack/react-query";

export interface BibliaBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

let inflight: Promise<BibliaBook[]> | null = null;

async function fetchBiblia(): Promise<BibliaBook[]> {
  if (inflight) return inflight;
  inflight = fetch("/data/biblia-acf.json", { cache: "force-cache" })
    .then((r) => {
      if (!r.ok) throw new Error("Falha ao baixar a Bíblia");
      return r.json() as Promise<BibliaBook[]>;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

/** Pré-carrega o JSON da Bíblia (use em hover/touchstart de links) */
export function prefetchBiblia() {
  void fetchBiblia();
}

export function useBibliaData() {
  return useQuery({
    queryKey: ["biblia-acf"],
    queryFn: fetchBiblia,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
