const stroke = 1.5;

function IconPriceTag({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 5a2 2 0 0 1 2-2h7.172a2 2 0 0 1 1.414.586l5.828 5.828A2 2 0 0 1 20 10.828V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="7.5" r="1.25" stroke="currentColor" strokeWidth={stroke} fill="none" />
    </svg>
  );
}

function IconPercentCircle({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={stroke} />
      <path d="M9 15l6-6M9.5 9h.01M14.5 15h.01" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
}

function IconPercentWithArrow({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="11" cy="13" r="7.5" stroke="currentColor" strokeWidth={stroke} />
      <path d="M8 16l5-5M8.5 11h.01M12.5 15h.01" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      <path
        d="M16 4l3 3M16 4v4M16 4h4"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowUpRight({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M7 17L17 7M7 7h10v10" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRoundedSquare({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth={stroke} />
    </svg>
  );
}

function IconFilledSquare({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" />
    </svg>
  );
}

function IconSparkle({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3l1.1 4.2L17 8.3l-3.9 1.1L12 13.6l-1.1-4.2L7 8.3l3.9-1.1L12 3Z"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ITEMS = [
  // top-left cluster
  { El: IconPercentCircle, x: 23, y: 5, w: 66, rot: 0, color: "#2097A9", op: 0.38, d: 0.0, t: 4.2 },
  { El: IconPriceTag, x: 32, y: 11, w: 98, rot: -8, color: "#2097A9", op: 0.95, d: 0.2, t: 4.8 },
  { El: IconRoundedSquare, x: 16, y: 10, w: 30, rot: -8, color: "#2097A9", op: 0.78, d: 0.8, t: 4.1 },
  { El: IconPercentCircle, x: 10, y: 16, w: 34, rot: 0, color: "#2097A9", op: 0.66, d: 1.1, t: 4.9 },
  { El: IconSparkle, x: 27, y: 20, w: 24, rot: 0, color: "#f4f8fb", op: 0.88, d: 0.6, t: 5.0 },

  // bottom-left cluster
  { El: IconPriceTag, x: 6, y: 86, w: 108, rot: 6, color: "#2097A9", op: 0.92, d: 0.6, t: 4.6 },
  { El: IconPriceTag, x: 17, y: 92, w: 90, rot: -8, color: "#e8d8bf", op: 0.78, d: 1.0, t: 5.0 },
  { El: IconPercentCircle, x: 31, y: 80, w: 70, rot: -10, color: "#2097A9", op: 0.78, d: 0.4, t: 4.4 },
  { El: IconPercentWithArrow, x: 15, y: 64, w: 78, rot: -4, color: "#2097A9", op: 0.95, d: 0.9, t: 4.7 },
  { El: IconArrowUpRight, x: 6, y: 70, w: 38, rot: -12, color: "#2097A9", op: 0.8, d: 0.1, t: 4.1 },
  { El: IconArrowUpRight, x: 18, y: 84, w: 42, rot: 0, color: "#2097A9", op: 0.88, d: 0.5, t: 4.9 },
  { El: IconRoundedSquare, x: 6, y: 74, w: 44, rot: -10, color: "#2097A9", op: 0.92, d: 1.2, t: 4.2 },
  { El: IconFilledSquare, x: 2, y: 76, w: 52, rot: -8, color: "#2097A9", op: 0.95, d: 0.8, t: 5.1 },
  { El: IconFilledSquare, x: 28, y: 89, w: 54, rot: -8, color: "#2097A9", op: 0.88, d: 0.3, t: 4.5 },
  { El: IconRoundedSquare, x: 25, y: 83, w: 46, rot: -10, color: "#2097A9", op: 0.9, d: 0.7, t: 4.0 },
  { El: IconCheck, x: 22, y: 78, w: 42, rot: 0, color: "#2097A9", op: 0.9, d: 1.3, t: 4.3 },
  { El: IconRoundedSquare, x: 13, y: 98, w: 32, rot: -10, color: "#d8c6aa", op: 0.72, d: 1.1, t: 4.8 },
  { El: IconPercentCircle, x: 37, y: 98, w: 56, rot: 0, color: "#2097A9", op: 0.95, d: 0.2, t: 5.2 },
  { El: IconPriceTag, x: 37, y: 94, w: 56, rot: 18, color: "#2097A9", op: 0.85, d: 0.9, t: 4.3 },
  { El: IconRoundedSquare, x: 9, y: 66, w: 26, rot: -10, color: "#2097A9", op: 0.72, d: 0.4, t: 4.2 },
  { El: IconCheck, x: 3, y: 69, w: 24, rot: 0, color: "#2097A9", op: 0.8, d: 1.0, t: 4.8 },
  { El: IconSparkle, x: 12, y: 74, w: 20, rot: 0, color: "#f6f4ee", op: 0.86, d: 1.2, t: 4.6 },
  { El: IconRoundedSquare, x: 20, y: 72, w: 22, rot: 4, color: "#d9cdb7", op: 0.72, d: 0.7, t: 5.1 },
  { El: IconPercentCircle, x: 6, y: 90, w: 36, rot: 0, color: "#2097A9", op: 0.68, d: 0.3, t: 4.3 },
  { El: IconSparkle, x: 24, y: 95, w: 22, rot: 0, color: "#fff6e8", op: 0.9, d: 1.3, t: 5.0 },

  // top-right cluster
  { El: IconPriceTag, x: 74, y: 6, w: 92, rot: 14, color: "#2097A9", op: 0.84, d: 0.2, t: 4.5 },
  { El: IconCheck, x: 84, y: 4, w: 48, rot: 0, color: "#2097A9", op: 0.9, d: 0.5, t: 4.7 },
  { El: IconPercentCircle, x: 88, y: 7, w: 70, rot: 0, color: "#e5d5b8", op: 0.65, d: 1.0, t: 4.9 },
  { El: IconPercentCircle, x: 94, y: 14, w: 82, rot: 0, color: "#2097A9", op: 0.9, d: 0.7, t: 4.6 },
  { El: IconPercentWithArrow, x: 85, y: 28, w: 86, rot: 8, color: "#2097A9", op: 0.96, d: 0.4, t: 4.4 },
  { El: IconPriceTag, x: 90, y: 42, w: 122, rot: 7, color: "#2097A9", op: 0.95, d: 0.8, t: 4.8 },
  { El: IconPriceTag, x: 77, y: 24, w: 84, rot: -12, color: "#2097A9", op: 0.95, d: 1.2, t: 5.0 },
  { El: IconPercentCircle, x: 76, y: 36, w: 76, rot: 4, color: "#2097A9", op: 0.75, d: 0.3, t: 4.1 },
  { El: IconPriceTag, x: 72, y: 22, w: 64, rot: -10, color: "#2097A9", op: 0.75, d: 1.1, t: 4.9 },
  { El: IconArrowUpRight, x: 80, y: 14, w: 44, rot: 0, color: "#2097A9", op: 0.72, d: 0.6, t: 4.0 },
  { El: IconFilledSquare, x: 97, y: 7, w: 52, rot: -8, color: "#2097A9", op: 0.9, d: 1.4, t: 4.2 },
  { El: IconFilledSquare, x: 82, y: 19, w: 44, rot: -6, color: "#2097A9", op: 0.85, d: 1.0, t: 4.6 },
  { El: IconRoundedSquare, x: 98, y: 0.6, w: 30, rot: -8, color: "#2097A9", op: 0.86, d: 0.2, t: 4.4 },
  { El: IconCheck, x: 81, y: 27, w: 34, rot: 0, color: "#2097A9", op: 0.9, d: 0.9, t: 4.7 },
  { El: IconRoundedSquare, x: 98, y: 24, w: 30, rot: 0, color: "#e6d8bf", op: 0.8, d: 0.3, t: 4.6 },
  { El: IconPercentCircle, x: 100, y: 30, w: 58, rot: 0, color: "#e8d8be", op: 0.75, d: 1.2, t: 4.8 },
  { El: IconPriceTag, x: 97, y: 20, w: 40, rot: 10, color: "#2097A9", op: 0.82, d: 0.4, t: 4.2 },
  { El: IconCheck, x: 95, y: 12, w: 24, rot: 0, color: "#2097A9", op: 0.82, d: 0.9, t: 4.9 },
  { El: IconRoundedSquare, x: 93, y: 2, w: 24, rot: -6, color: "#2097A9", op: 0.8, d: 1.2, t: 4.5 },
  { El: IconSparkle, x: 90, y: 18, w: 20, rot: 0, color: "#f9f8f1", op: 0.9, d: 0.7, t: 5.1 },
  { El: IconRoundedSquare, x: 74, y: 11, w: 22, rot: 8, color: "#2097A9", op: 0.72, d: 0.5, t: 4.0 },
  { El: IconCheck, x: 70, y: 29, w: 22, rot: 0, color: "#2097A9", op: 0.8, d: 1.1, t: 4.6 },

  // floating accents
  { El: IconPriceTag, x: -1, y: 44, w: 58, rot: -14, color: "#2097A9", op: 0.86, d: 0.5, t: 4.4 },
  { El: IconFilledSquare, x: -2, y: 60, w: 30, rot: -8, color: "#2097A9", op: 0.95, d: 0.9, t: 4.5 },
  { El: IconRoundedSquare, x: 70, y: 56, w: 64, rot: -10, color: "#2097A9", op: 0.82, d: 0.6, t: 4.2 },
  { El: IconFilledSquare, x: 81, y: 74, w: 38, rot: -12, color: "#2097A9", op: 0.86, d: 0.4, t: 4.9 },
  { El: IconSparkle, x: 98, y: 80, w: 52, rot: 0, color: "#fff7e6", op: 0.95, d: 0.3, t: 4.6 },
  { El: IconSparkle, x: 98, y: 89, w: 52, rot: 0, color: "#fff7e6", op: 0.95, d: 0.8, t: 5.0 },
  { El: IconPriceTag, x: 58, y: 8, w: 44, rot: -12, color: "#2097A9", op: 0.64, d: 0.6, t: 4.8 },
  { El: IconArrowUpRight, x: 60, y: 50, w: 28, rot: 8, color: "#2097A9", op: 0.62, d: 0.9, t: 4.3 },
  { El: IconSparkle, x: 54, y: 30, w: 20, rot: 0, color: "#f5fafb", op: 0.82, d: 1.0, t: 5.0 },
];

function pseudoRandom(index) {
  const x = Math.sin((index + 1) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function HeroBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-[#E0F0F7] via-[#eff8fb] to-[#FDF5E6]" />

      {ITEMS.map(({ El, x, y, w, rot, color, op }, i) => {
        const p1 = pseudoRandom(i);
        const p2 = pseudoRandom(i + 73);
        const duration = 3.8 + p1 * 1.9; // 3.8s - 5.7s
        const delay = -(p2 * 2.6); // negativo: evita arranque "trabado"

        return (
          <div
            key={`${i}-${x}-${y}`}
            className="absolute pointer-events-auto"
            style={{
              top: `${y}%`,
              left: `${x}%`,
              width: `${w}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="[will-change:transform] transform-gpu"
              style={{
                animation: `float ${duration.toFixed(2)}s ease-in-out infinite`,
                animationDelay: `${delay.toFixed(2)}s`,
              }}
            >
              <div
                className="h-full w-full transition-all duration-300 ease-out hover:scale-105"
                style={{
                  color,
                  opacity: op,
                  transform: `rotate(${rot}deg)`,
                }}
              >
                <El className="h-full w-full" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
