import { useEffect, useState } from "react";

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
}

function compute(target: number): CountdownValue {
  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true };
  }
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, totalMs: diff, expired: false };
}

export function useCountdown(
  targetDate: string | Date | null | undefined,
  onExpire?: () => void
): CountdownValue {
  const target = targetDate ? new Date(targetDate).getTime() : 0;
  const [value, setValue] = useState<CountdownValue>(() => compute(target));

  useEffect(() => {
    if (!target) return;

    const initialValue = compute(target);
    setValue(initialValue);

    const id = setInterval(() => {
      const newValue = compute(target);
      setValue(newValue);
      if (newValue.expired) {
        onExpire?.();
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [target, onExpire]);

  return value;
}
