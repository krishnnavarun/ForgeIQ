import type { CSSProperties, ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
};

export function Reveal({ children, className = "", delay = 0, direction = "up" }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  const style = delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined;
  const directionClass = direction === "up" ? "" : ` reveal-${direction}`;

  return (
    <div ref={ref} data-reveal className={`${className}${directionClass}`} style={style}>
      {children}
    </div>
  );
}
