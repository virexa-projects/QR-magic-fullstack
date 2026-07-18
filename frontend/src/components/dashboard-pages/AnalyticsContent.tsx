"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { format, startOfMonth } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, MapPin, Clock, Smartphone, ChevronDown, Check, QrCode,
  Link as LinkIcon, MessageSquare, Wifi, User, Mail, Phone, MessageCircle, FileText,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { AppDispatch, RootState } from "@/store";
import { fetchQrCodes, QrType } from "@/store/slices/qrSlice";
import {
  fetchSummary, fetchTrend, fetchDevices, fetchAccountLocations, fetchHourly,
  fetchQrAnalytics, fetchQrLocations, fetchQrRecentScans, fetchQrScansToday, clearQrAnalytics,
} from "@/store/slices/analyticsSlice";
import WorldMapCity from "../dashboard/WorldMapCity";

/* ------------------------------------------------------------------ */
/*  Type icon map — matches the real QrType union, not the old mock's  */
/* ------------------------------------------------------------------ */

const typeIcons: Record<QrType, React.ElementType> = {
  url: LinkIcon,
  text: FileText,
  whatsapp: MessageSquare,
  wifi: Wifi,
  vcard: User,
  email: Mail,
  phone: Phone,
  sms: MessageCircle,
  location: MapPin,
};

const DEVICE_COLORS: Record<string, string> = {
  Android: "#22c55e",
  iOS: "#3b82f6",
  Desktop: "#a855f7",
  Other: "#94a3b8",
};

function AnalyticsInner() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedId, setSelectedId] = useState<string>("all");
  const [open, setOpen] = useState(false);

  // Date range — defaults to the current month, matching the backend default.
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { items: qrItems } = useSelector((s: RootState) => s.qr);
  const {
    summary, trend, devices, accountLocations, hourly, summaryLoading,
    dailyRows, locations, recentScans, qrScansToday, loading,
  } = useSelector((s: RootState) => s.analytics);

  // Populate the QR dropdown with the user's real codes
  useEffect(() => {
    dispatch(fetchQrCodes({ limit: 100, sort: "recent" }));
  }, [dispatch]);

  // Load the right dataset whenever the selection or date range changes
  useEffect(() => {
    if (selectedId === "all") {
      dispatch(fetchSummary({ startDate, endDate }));
      dispatch(fetchTrend({ startDate, endDate }));
      dispatch(fetchDevices({ startDate, endDate }));
      dispatch(fetchAccountLocations({ limit: 10 }));
      dispatch(fetchHourly({ startDate, endDate }));
    } else {
      dispatch(fetchQrAnalytics({ id: selectedId, startDate, endDate }));
      dispatch(fetchQrLocations({ id: selectedId, limit: 6 }));
      dispatch(fetchQrRecentScans({ id: selectedId, limit: 8 }));
      dispatch(fetchQrScansToday({ id: selectedId }));
    }
    return () => {
      if (selectedId !== "all") dispatch(clearQrAnalytics());
    };
  }, [dispatch, selectedId, startDate, endDate]);

  const selected = useMemo(
    () => (selectedId === "all" ? null : qrItems.find((q) => q._id === selectedId) ?? null),
    [selectedId, qrItems]
  );

  const SelectedIcon = selected ? typeIcons[selected.type] ?? QrCode : QrCode;

  /* ---------------- Derived data — branches on all vs single QR ---------------- */

  // Trend chart data
  const trendData = useMemo(() => {
    if (selected) {
      return dailyRows.map((r) => ({ date: r.label, scans: r.scans, clicks: r.clicks }));
    }
    return trend.map((t) => ({ date: t.date, scans: t.scans }));
  }, [selected, dailyRows, trend]);

  // Hourly chart data
  const hourlyData = useMemo(() => {
    if (selected) {
      const totals = new Array(24).fill(0);
      dailyRows.forEach((r) => r.hourlyBreakdown.forEach((v, i) => (totals[i] += v)));
      return totals.map((scans, h) => ({ hour: h.toString().padStart(2, "0"), scans }));
    }
    return hourly.map((h) => ({ hour: h.hour.slice(0, 2), scans: h.scans }));
  }, [selected, dailyRows, hourly]);

  // Device pie data
  const deviceData = useMemo(() => {
    const totals: Record<string, number> = selected
      ? dailyRows.reduce((acc, r) => {
          Object.entries(r.deviceBreakdown).forEach(([d, c]) => (acc[d] = (acc[d] || 0) + c));
          return acc;
        }, {} as Record<string, number>)
      : devices;

    const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(totals).map(([name, value]) => ({
      name,
      value: Math.round((value / sum) * 100),
      color: DEVICE_COLORS[name] || DEVICE_COLORS.Other,
    }));
  }, [selected, dailyRows, devices]);

  // Cities list (+ coordinates for WorldMap)
  const cities = selected ? locations : accountLocations;

  const peakHour = useMemo(() => {
    if (hourlyData.length === 0) return "—";
    const peak = hourlyData.reduce((m, h) => (h.scans > m.scans ? h : m), hourlyData[0]);
    return `${peak.hour}:00`;
  }, [hourlyData]);

  const stats = selected
    ? {
        // NOTE: totalScans within the selected range comes from dailyRows,
        // not selected.scansTotal — that field is the QRCode doc's
        // lifetime denormalized counter, not scoped to startDate/endDate.
        totalScans: dailyRows.reduce((sum, r) => sum + r.scans, 0),
        // scansToday comes from the live /qr/:id/today endpoint, not
        // selected.scansToday (a denormalized field on the QRCode doc
        // that drifts if the increment/reset job misses a beat).
        scansToday: qrScansToday,
        topCity: cities[0]?.city || "No data yet",
        topCityPct: cities[0]?.pct,
      }
    : {
        totalScans: summary?.totalScans ?? 0,
        scansToday: summary?.scansToday ?? 0,
        topCity: cities[0]?.city || "No data yet",
        topCityPct: cities[0]?.pct,
      };

  const isLoading = selected ? loading : summaryLoading;

  const rangeLabel = `${format(new Date(startDate), "MMM d")} – ${format(new Date(endDate), "MMM d")}`;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Header + date range + QR selector */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">Analytics</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {selected ? `Performance for "${selected.name}"` : `All scans across ${summary?.totalQRs ?? 0} QR codes`} · {rangeLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range inputs — default to current month */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 px-2 rounded-lg border border-border bg-card text-sm text-foreground"
              aria-label="Start date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 px-2 rounded-lg border border-border bg-card text-sm text-foreground"
              aria-label="End date"
            />
          </div>

          {/* QR dropdown selector */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 h-10 pl-2 pr-3 rounded-lg border border-border bg-card hover:border-foreground/30 transition min-w-[260px]">
                <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center shrink-0">
                  <SelectedIcon className="w-3.5 h-3.5 text-foreground" />
                </div>
                <div className="flex-1 text-left min-w-0">
            
                  <div className="text-sm font-semibold text-foreground truncate">
                    {selected ? selected.name : "All QR codes"}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[320px] p-1">
              <div className="max-h-[360px] overflow-y-auto">
                <button
                  onClick={() => { setSelectedId("all"); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left hover:bg-secondary ${selectedId === "all" ? "bg-secondary" : ""}`}
                >
                  <div className="w-7 h-7 rounded-md bg-primary-soft flex items-center justify-center shrink-0">
                    <QrCode className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">All QR codes</div>
                    <div className="text-[11px] text-muted-foreground">Combined performance</div>
                  </div>
                  {selectedId === "all" && <Check className="w-4 h-4 text-primary" />}
                </button>
                <div className="h-px bg-border my-1" />
                {qrItems.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">No QR codes yet.</p>
                )}
                {qrItems.map((q) => {
                  const Icon = typeIcons[q.type] ?? QrCode;
                  const sel = selectedId === q._id;
                  return (
                    <button
                      key={q._id}
                      onClick={() => { setSelectedId(q._id); setOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left hover:bg-secondary ${sel ? "bg-secondary" : ""}`}
                    >
                      <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{q.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {q.scansTotal.toLocaleString("en-IN")} scans · {q.type}
                        </div>
                      </div>
                      {sel && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total scans", value: stats.totalScans.toLocaleString("en-IN"), sub: rangeLabel, icon: TrendingUp, accent: true },
          { label: "Scans today", value: stats.scansToday.toLocaleString("en-IN"), sub: "Since midnight", icon: Smartphone },
          { label: "Top city", value: stats.topCity, sub: stats.topCityPct != null ? `${stats.topCityPct}% of scans` : "", icon: MapPin },
          { label: "Peak hour", value: peakHour, sub: rangeLabel, icon: Clock },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.accent ? "bg-lime text-lime-foreground" : "bg-secondary text-foreground"}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{s.sub}</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-heading text-foreground truncate">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {isLoading && trendData.length === 0 && (
        <div className="bg-card rounded-xl p-8 border border-border text-center text-sm text-muted-foreground">
          Loading analytics…
        </div>
      )}

      {!isLoading && trendData.every((d) => d.scans === 0) && (
        <div className="bg-card rounded-xl p-8 border border-border text-center text-sm text-muted-foreground">
          No scans recorded yet — charts will populate once your QR codes get scanned.
        </div>
      )}

      {/* Trend chart */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {selected ? "Scans vs click-throughs" : "Scans over time"}
            </h3>
            <p className="text-[11px] text-muted-foreground">{rangeLabel}</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" name="Scans" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#g1)" />
              {selected && (
                <Area type="monotone" name="Clicks" dataKey="clicks" stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Map + Devices */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Scans by location
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Top {cities.length} cities {selected ? "for this QR" : "worldwide"} · pulsing dots show activity
              </p>
            </div>
          </div>
          {cities.length === 0 ? (
            <p className="text-xs text-muted-foreground py-16 text-center">No location data yet.</p>
          ) : (
            <WorldMapCity data={cities} />
          )}
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Devices</h3>
          {deviceData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-10 text-center">No device data yet.</p>
          ) : (
            <>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deviceData} dataKey="value" innerRadius={40} outerRadius={62} paddingAngle={3}>
                      {deviceData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {deviceData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-foreground">{d.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hourly + Top cities list */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-1">Scans by hour</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Peak at {peakHour}</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Top cities</h3>
          {cities.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No location data yet.</p>
          ) : (
            <div className="space-y-3">
              {cities.map((l) => (
                <div key={l.city}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">{l.city}</span>
                    <span className="text-muted-foreground"><span className="font-semibold text-foreground">{l.pct}%</span></span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${l.pct}%` }} transition={{ duration: 0.7 }} className="h-full bg-primary rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent scans — only meaningful when a single QR is selected */}
      {selected && (
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent scans</h3>
          {recentScans.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No scans recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {recentScans.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 transition">
                  <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                    <Smartphone className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">{s.city}</div>
                    <div className="text-[11px] text-muted-foreground">{s.device}{s.browser ? ` · ${s.browser}` : ""}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{new Date(s.scannedAt).toLocaleString("en-IN")}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsContent() {
  return (
    <DashboardLayout>
      <AnalyticsInner />
    </DashboardLayout>
  );
}