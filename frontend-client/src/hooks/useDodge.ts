import { useCallback, useRef, useState } from "react";

const THRESHOLD = 95;
const MAX_Y = 26;

export function useDodge(active: boolean) {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [fleeing, setFleeing] = useState(false);

  const reset = useCallback(() => {
    setFleeing(false);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!active || !zoneRef.current) return;
      const zone = zoneRef.current.getBoundingClientRect();
      const centerX = zone.left + zone.width / 2;
      const centerY = zone.top + zone.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const distance = Math.hypot(dx, dy);

      if (distance < THRESHOLD) {
        const angle = Math.atan2(dy, dx);
        const push = (THRESHOLD - distance) * 1.3;
        const maxX = zone.width / 2 - 26;
        const nextX = Math.max(-maxX, Math.min(maxX, -Math.cos(angle) * push));
        const nextY = Math.max(-MAX_Y, Math.min(MAX_Y, -Math.sin(angle) * push));
        setFleeing(true);
        setOffset({ x: nextX, y: nextY });
      } else {
        reset();
      }
    },
    [active, reset],
  );

  return { zoneRef, offset, fleeing, handlePointerMove, handlePointerLeave: reset, reset };
}
