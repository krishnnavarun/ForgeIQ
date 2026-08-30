import { useEffect, useRef } from "react";

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.setAttribute("data-visible", "true");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.setAttribute("data-visible", "true");
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -64px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}
