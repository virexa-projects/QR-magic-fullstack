"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, LayoutDashboard, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

// Deterministic pseudo-random module fill so the "data" modules look
// like real QR noise but never shift between server/client renders.
function moduleOn(row: number, col: number) {
  const n = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
  return n - Math.floor(n) > 0.52;
}

const GRID = 21; // classic QR module count
const CELL = 8;
const SIZE = GRID * CELL;

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={CELL * 7} height={CELL * 7} fill="none" stroke="hsl(var(--primary))" strokeWidth={CELL} />
      <rect x={CELL * 2} y={CELL * 2} width={CELL * 3} height={CELL * 3} fill="hsl(var(--primary))" />
    </g>
  );
}

// The bottom-right finder pattern — the one a scanner needs to get its
// bearings — rendered as loose shards instead of a solid square.
function BrokenFinder({ x, y }: { x: number; y: number }) {
  const pieces = [
    { dx: -6, dy: -4, r: -18 },
    { dx: 10, dy: -8, r: 24 },
    { dx: -10, dy: 10, r: 12 },
    { dx: 8, dy: 12, r: -22 },
    { dx: 0, dy: -14, r: 6 },
  ];
  return (
    <g transform={`translate(${x}, ${y})`}>
      {pieces.map((p, i) => (
        <motion.rect
          key={i}
          width={CELL * 2}
          height={CELL * 2}
          fill="hsl(var(--primary))"
          opacity={0.5}
          x={CELL * 2.5 + p.dx}
          y={CELL * 2.5 + p.dy}
          initial={{ rotate: 0 }}
          animate={{
            rotate: [0, p.r, 0],
            opacity: [0.5, 0.22, 0.5],
          }}
          transition={{
            duration: 3.2 + i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
          style={{ transformOrigin: `${CELL * 3.5 + p.dx}px ${CELL * 3.5 + p.dy}px` }}
        />
      ))}
    </g>
  );
}

function GlitchCode() {
  const cells = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const inTopLeft = r < 7 && c < 7;
      const inTopRight = r < 7 && c >= GRID - 7;
      const inBottomLeft = r >= GRID - 7 && c < 7;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      if (!moduleOn(r, c)) continue;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={c * CELL}
          y={r * CELL}
          width={CELL - 1.5}
          height={CELL - 1.5}
          className="fill-foreground/70"
        />
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label="A QR code with its bottom-right locator pattern broken apart, unable to be scanned">
      {cells}
      <Finder x={0} y={0} />
      <Finder x={CELL * (GRID - 7)} y={0} />
      <BrokenFinder x={0} y={CELL * (GRID - 7)} />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-card rounded-2xl border border-border/60 shadow-card p-6 mx-auto inline-flex"
        >
          <GlitchCode />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-8"
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Error 404
          </span>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
            This code doesn't scan
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            The page or QR code you're looking for might have been deleted, renamed,
            or never existed. Its locator pattern is broken — even a scanner couldn't find it.
          </p>

          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-blue">
              <Link href="/dashboard">
                <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Back to dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/">
                <Home className="w-3.5 h-3.5 mr-1.5" /> Go home
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/dashboard/codes">
                <ScanLine className="w-3.5 h-3.5 mr-1.5" /> View my QR codes
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}