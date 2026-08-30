import { useEffect, useRef, useState } from "react";

export type RobotMood = "idle" | "watching" | "shy" | "confused" | "happy";

const CAPTIONS: Record<Exclude<RobotMood, "idle">, string> = {
  watching: "I see you typing. Looking good.",
  shy: "Not peeking at your password!",
  confused: "Hmm, that didn't work. Try again?",
  happy: "Welcome aboard!",
};

const ENCOURAGEMENTS = [
  "Every bug you fix makes you a sharper engineer.",
  "Ship it. Iteration beats perfection.",
  "Good code today beats perfect code someday.",
  "Small commits, steady progress.",
  "You've debugged worse than this. You've got this.",
  "The best developers Google things too.",
  "Consistency compounds. Keep showing up.",
];

type RobotMascotProps = {
  mood: RobotMood;
  message?: string;
};

export function RobotMascot({ mood, message }: RobotMascotProps) {
  const headRef = useRef<SVGRectElement>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * ENCOURAGEMENTS.length));

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const head = headRef.current;
      if (!head) return;
      const rect = head.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const distance = Math.hypot(dx, dy) || 1;
      const pull = Math.min(distance, 260) / 260;
      setGaze({ x: (dx / distance) * pull, y: (dy / distance) * pull });
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    if (mood !== "idle") return;
    const interval = window.setInterval(() => {
      setQuoteIndex((index) => (index + 1) % ENCOURAGEMENTS.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, [mood]);

  const pupilX = gaze.x * 7;
  const pupilY = gaze.y * 5;
  const headTilt = gaze.x * 2.4;
  const caption = message ?? (mood === "idle" ? ENCOURAGEMENTS[quoteIndex] : CAPTIONS[mood]);

  return (
    <div className="robot-wrap">
      <svg className={`robot mood-${mood}`} viewBox="0 0 240 240" width="252" height="252" role="img" aria-label={caption}>
        <ellipse className="robot-shadow" cx="120" cy="220" rx="70" ry="10" />

        <g className="robot-tilt" style={{ transform: `rotate(${headTilt}deg)`, transformOrigin: "120px 100px" }}>
          <g className="robot-antenna">
            <line x1="120" y1="8" x2="120" y2="32" />
            <circle className="robot-antenna-dot" cx="120" cy="6" r="8" />
          </g>

          <rect ref={headRef} className="robot-head" x="38" y="32" width="164" height="128" rx="38" />

          <circle className="robot-cheek" cx="70" cy="118" r="9" />
          <circle className="robot-cheek" cx="170" cy="118" r="9" />

          <circle className="robot-eye-white" cx="88" cy="88" r="17" />
          <circle className="robot-eye-white" cx="152" cy="88" r="17" />
          <circle className="robot-pupil" cx={88 + pupilX} cy={88 + pupilY} r="7.5" />
          <circle className="robot-pupil" cx={152 + pupilX} cy={88 + pupilY} r="7.5" />

          <path className="robot-mouth robot-mouth-neutral" d="M 92 130 Q 120 136 148 130" />
          <path className="robot-mouth robot-mouth-happy" d="M 88 126 Q 120 152 152 126" />
          <path className="robot-mouth robot-mouth-confused" d="M 94 140 Q 120 122 146 140" />

          <path className="robot-hand robot-hand-left" d="M 56 164 Q 90 82 122 164 Z" />
          <path className="robot-hand robot-hand-right" d="M 118 164 Q 150 82 184 164 Z" />
        </g>

        <rect className="robot-body" x="74" y="168" width="92" height="48" rx="18" />
        <circle className="robot-panel-light" cx="120" cy="192" r="7" />
      </svg>
      <p className="robot-caption" key={caption}>{caption}</p>
    </div>
  );
}
