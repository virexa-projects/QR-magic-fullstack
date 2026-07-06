import { motion } from "framer-motion";

const worldMap = "/world-map.svg";

// Source SVG is Web Mercator, 3852 x 2499
const MAP_W = 3852;
const MAP_H = 2499;

// Web Mercator projection — matches the source SVG
const project = (lat: number, lng: number) => {
  const x = ((lng + 180) / 360) * MAP_W;
  const latRad = (Math.max(Math.min(lat, 85), -85) * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = (MAP_H / 2) - (MAP_W * mercN) / (2 * Math.PI);
  return { x, y };
};

// City coordinates (lat, lng)
const cityLatLng: Record<string, [number, number]> = {
  Mumbai: [19.07, 72.87],
  "Delhi NCR": [28.61, 77.21],
  Bengaluru: [12.97, 77.59],
  Hyderabad: [17.38, 78.48],
  Pune: [18.52, 73.85],
  Chennai: [13.08, 80.27],
  Kolkata: [22.57, 88.36],
  Ahmedabad: [23.02, 72.57],
  Jaipur: [26.91, 75.78],
  Lucknow: [26.84, 80.94],
  Other: [21.0, 78.0],
};

interface CityScan { city: string; scans: number; pct: number; }
interface Props { data: CityScan[]; }

export default function WorldMap({ data }: Props) {
  const maxPct = Math.max(...data.map((d) => d.pct), 1);

  return (
    <div className="relative w-full">
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-muted/40 border border-border">
        {/* Background world map */}
        <img
          src={worldMap}
          alt="World map"
          className="absolute inset-0 w-full h-full object-contain opacity-50 dark:opacity-60"
          style={{ filter: "grayscale(1)" }}
        />

        {/* SVG overlay matching source coordinate system */}
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {data.map((c, i) => {
            const [lat, lng] = cityLatLng[c.city] ?? cityLatLng["Other"];
            const { x, y } = project(lat, lng);
            const intensity = c.pct / maxPct;
            const r = 14 + intensity * 26;
            const isTop = i === 0;
            const accent = isTop ? "hsl(var(--lime))" : "hsl(var(--primary))";

            return (
              <g key={c.city}>
                <motion.circle
                  cx={x} cy={y} r={r} fill={accent} opacity={0.22}
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.18 }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
                <motion.circle
                  cx={x} cy={y} r={r * 0.5}
                  fill={accent}
                  stroke="hsl(var(--card))" strokeWidth={3}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 220 }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* City list under map */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-2 mt-4">
        {data.slice(0, 6).map((c, i) => (
          <div key={c.city} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: i === 0 ? "hsl(var(--lime))" : "hsl(var(--primary))" }}
              />
              <span className="font-medium text-foreground truncate">{c.city}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-muted-foreground tabular-nums">{c.scans.toLocaleString("en-IN")}</span>
              <span className="text-muted-foreground/70 tabular-nums w-9 text-right">{c.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
