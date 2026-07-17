"use client";

import { memo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { Plus, Minus, RotateCcw, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
// Bundled at build time — no runtime fetch to a tile/geometry CDN,
// which keeps this fast and avoids a blank map if that CDN is ever down.
// npm install react-simple-maps world-atlas
import worldTopology from "world-atlas/countries-110m.json";

export interface WorldMapCity {
  city: string;
  country?: string;
  scans: number;
  pct: number;
  lat?: number | null;
  lng?: number | null;
}

interface WorldMapProps {
  data: WorldMapCity[];
}

type GeoPoint = WorldMapCity & { lat: number; lng: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const DEFAULT_CENTER: [number, number] = [0, 20];
const DEFAULT_ZOOM = 1;

function WorldMap({ data = [] }: WorldMapProps) {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const points: GeoPoint[] = data.filter(
    (d): d is GeoPoint => typeof d.lat === "number" && typeof d.lng === "number"
  );

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg bg-secondary/30 text-xs text-muted-foreground">
        No geolocated scans yet.
      </div>
    );
  }

  const maxScans = Math.max(...points.map((p) => p.scans), 1);
  // Radius scales with relative scan volume, clamped so one big city
  // doesn't dwarf everything and small ones stay clickable.
  const radiusFor = (scans: number) => (3 + (scans / maxScans) * 7) / zoom;

  const zoomIn = () => setZoom((z) => Math.min(z * 1.5, MAX_ZOOM));
  const zoomOut = () => setZoom((z) => Math.max(z / 1.5, MIN_ZOOM));
  const reset = () => {
    setZoom(DEFAULT_ZOOM);
    setCenter(DEFAULT_CENTER);
  };
  // Pan step shrinks as you zoom in, so nudges stay proportional to what's on screen.
  const pan = (dx: number, dy: number) => {
    setCenter(([lng, lat]) => {
      const step = 20 / zoom;
      const nextLat = Math.max(-85, Math.min(85, lat + dy * step));
      return [lng + dx * step, nextLat];
    });
  };

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden bg-secondary/30">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 255 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onMoveEnd={({ coordinates, zoom: z }) => {
            setCenter(coordinates as [number, number]);
            setZoom(z);
          }}
        >
          <Geographies geography={worldTopology}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography

                  key={geo.rsmKey}
                  geography={geo}
                  fill="#dbeafe"
                  stroke="#60a5fa"
                  strokeWidth={0.5 / zoom}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "hsl(var(--secondary))" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {points.map((p, i) => (
            <Marker key={`${p.city}-${i}`} coordinates={[p.lng, p.lat]}>
              <title>
                {`${p.city}${p.country ? `, ${p.country}` : ""} — ${p.scans.toLocaleString("en-IN")} scans (${p.pct}%)`}
              </title>
              <circle
                r={radiusFor(p.scans)}
                fill="#22c55e"
                stroke="#16a34a"
                fillOpacity={0.3}

                strokeWidth={1 / zoom}
              />
              <circle r={2 / zoom} fill="hsl(var(--primary))" />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-card border border-border text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-card border border-border text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="Reset view"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-card border border-border text-foreground hover:bg-secondary transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Pan controls — left/right/up/down nudge, drag also works directly on the map */}
      <div className="absolute bottom-2 right-2 grid grid-cols-3 grid-rows-2 gap-1 w-[92px]">
        <div />
        <button
          type="button"
          onClick={() => pan(0, -1)}
          aria-label="Pan up"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-card border border-border text-foreground hover:bg-secondary transition"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <div />
        <button
          type="button"
          onClick={() => pan(-1, 0)}
          aria-label="Pan left"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-card border border-border text-foreground hover:bg-secondary transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => pan(0, 1)}
          aria-label="Pan down"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-card border border-border text-foreground hover:bg-secondary transition"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => pan(1, 0)}
          aria-label="Pan right"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-card border border-border text-foreground hover:bg-secondary transition"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default memo(WorldMap);