import { motion } from "framer-motion";

// Major Indian cities — approximate normalized coords (x, y) in 0–100 SVG viewBox space
// Tuned to match a stylized rectangular India outline (viewBox 0 0 100 110).
const cityCoords: Record<string, { x: number; y: number }> = {
  "Mumbai": { x: 28, y: 60 },
  "Delhi NCR": { x: 42, y: 28 },
  "Bengaluru": { x: 42, y: 82 },
  "Hyderabad": { x: 46, y: 68 },
  "Pune": { x: 32, y: 62 },
  "Chennai": { x: 50, y: 86 },
  "Kolkata": { x: 70, y: 48 },
  "Ahmedabad": { x: 26, y: 48 },
  "Jaipur": { x: 36, y: 36 },
  "Lucknow": { x: 52, y: 36 },
  "Other": { x: 60, y: 60 },
};

interface CityScan {
  city: string;
  scans: number;
  pct: number;
}

interface Props {
  data: CityScan[];
}

export default function IndiaMap({ data }: Props) {
  const maxPct = Math.max(...data.map((d) => d.pct), 1);

  return (
    <div className="relative w-full">
      <svg viewBox="0 0 100 110" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="indiaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary-soft))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.8" />
          </linearGradient>
          <filter id="cityGlow">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Stylized India outline (simplified silhouette) */}
        <path
          d="M30,12 L40,10 L48,14 L56,12 L62,18 L70,20 L74,28 L78,34 L74,40 L78,46 L74,52 L72,58 L74,66 L68,72 L60,76 L54,82 L52,92 L48,100 L42,96 L40,88 L34,82 L30,74 L26,68 L24,60 L22,52 L20,44 L22,36 L26,28 L28,20 Z"
          fill="url(#indiaFill)"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
        />

        {/* City dots */}
        {data.map((c, i) => {
          const coord = cityCoords[c.city] ?? cityCoords["Other"];
          const r = 1.2 + (c.pct / maxPct) * 3.2;
          return (
            <g key={c.city}>
              {/* Pulse ring */}
              <motion.circle
                cx={coord.x}
                cy={coord.y}
                r={r}
                fill="hsl(var(--primary))"
                opacity={0.25}
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
                style={{ transformOrigin: `${coord.x}px ${coord.y}px` }}
              />
              {/* Solid dot */}
              <motion.circle
                cx={coord.x}
                cy={coord.y}
                r={r}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--card))"
                strokeWidth="0.4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
                style={{ transformOrigin: `${coord.x}px ${coord.y}px` }}
              />
              {/* Label */}
              <text
                x={coord.x + r + 1}
                y={coord.y + 1}
                fontSize="2.6"
                fill="hsl(var(--foreground))"
                fontWeight="600"
                fontFamily="DM Sans, sans-serif"
              >
                {c.city}
              </text>
              <text
                x={coord.x + r + 1}
                y={coord.y + 4.4}
                fontSize="2.2"
                fill="hsl(var(--muted-foreground))"
                fontFamily="DM Sans, sans-serif"
              >
                {c.pct}% · {c.scans.toLocaleString("en-IN")}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border mt-2">
        <span>Scan density across India</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Low</span>
          <span className="w-2.5 h-2.5 rounded-full bg-primary ml-2" />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
