import { useEffect, useRef, useState } from "react";

function format(ms: number) {
  const totalCs = Math.floor(ms / 10); // centésimos
  const minutes = Math.floor(totalCs / 6000);
  const seconds = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(cs).padStart(2, "0")}`;
}

export function useTimer(running: boolean) {
  const [ms, setMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (!running) {
      // pausa: acumula o que rodou e zera o start
      if (startRef.current !== null) {
        accumulatedRef.current += performance.now() - startRef.current;
        startRef.current = null;
      }
      return;
    }

    startRef.current = performance.now();
    const interval = setInterval(() => {
      if (startRef.current !== null) {
        setMs(accumulatedRef.current + (performance.now() - startRef.current));
      }
    }, 50); // 20fps é suficiente para mostrar centésimos

    return () => clearInterval(interval);
  }, [running]);

  return {
    ms,
    seconds: Math.floor(ms / 1000),
    formatted: format(ms),
  };
}

export const formatTimeMs = format;
