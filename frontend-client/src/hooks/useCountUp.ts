import { useEffect, useState } from "react";

type CountUpOptions = {
  duration?: number;
  delay?: number;
};

export function useCountUp(target: number, { duration = 1100, delay = 0 }: CountUpOptions = {}) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) return;

    let frame = 0;
    const timeout = setTimeout(() => {
      const startTime = performance.now();

      function tick(now: number) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        setValue(Math.round(eased * target));
        if (progress < 1) frame = requestAnimationFrame(tick);
      }

      frame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [target, duration, delay, reduceMotion]);

  return value;
}
