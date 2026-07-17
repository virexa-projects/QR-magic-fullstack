"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Flag, MapPin } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchQrGeoReport } from "@/store/slices/analyticsSlice";

type Tab = "country" | "region" | "city";

const TABS: { key: Tab; label: string; icon: typeof Globe2 }[] = [
  { key: "country", label: "Country", icon: Flag },
  { key: "region", label: "Region", icon: Globe2 },
  { key: "city", label: "City", icon: MapPin },
];

export default function GeoBreakdown({ qrId }: { qrId: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const { geoReport, geoLoading } = useSelector((s: RootState) => s.analytics);
  const [tab, setTab] = useState<Tab>("country");

  useEffect(() => {
    if (!qrId) return;
    dispatch(fetchQrGeoReport({ id: qrId }));
  }, [dispatch, qrId]);

  const rows =
    tab === "country"
      ? (geoReport?.countries ?? []).map((r) => ({
          key: r.country,
          primary: r.country,
          secondary: null as string | null,
          scans: r.scans,
          pct: r.pct,
        }))
      : tab === "region"
      ? (geoReport?.regions ?? []).map((r) => ({
          key: `${r.country}-${r.region}`,
          primary: r.region,
          secondary: r.country,
          scans: r.scans,
          pct: r.pct,
        }))
      : (geoReport?.cities ?? []).map((r) => ({
          key: `${r.country}-${r.region}-${r.city}`,
          primary: r.city,
          secondary: [r.region, r.country].filter(Boolean).join(", "),
          scans: r.scans,
          pct: r.pct,
        }));

  return (
    <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold font-heading text-foreground">Geography breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Where scans came from, by country, region, and city.</p>
        </div>

        <div className="inline-flex items-center gap-1 bg-secondary rounded-full p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                tab === t.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === t.key && (
                <motion.span
                  layoutId="geo-tab-pill"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <t.icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {geoLoading && !geoReport && (
        <div className="py-10 text-center text-xs text-muted-foreground">Loading geography data…</div>
      )}

      {!geoLoading && rows.length === 0 && (
        <div className="py-10 text-center text-xs text-muted-foreground">
          No {tab} data yet — this fills in as scans come in.
        </div>
      )}

      {rows.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {rows.slice(0, 12).map((r, i) => (
              <div key={r.key}>
                <div className="flex justify-between items-baseline text-xs mb-1.5 gap-2">
                  <div className="min-w-0 flex items-baseline gap-2">
                    <span className="font-medium text-foreground truncate">{r.primary}</span>
                    {r.secondary && (
                      <span className="text-[10px] text-muted-foreground truncate">{r.secondary}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground shrink-0">
                    {r.scans.toLocaleString("en-IN")}{" "}
                    <span className="font-semibold text-foreground ml-1">{r.pct}%</span>
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.pct}%` }}
                    transition={{ duration: 0.5, delay: i * 0.02 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}