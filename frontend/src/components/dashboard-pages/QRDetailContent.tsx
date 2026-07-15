"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft, TrendingUp, MapPin, Clock, Smartphone, Download, Copy,
  Edit3, ExternalLink, Share2, MousePointerClick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchQrById } from "@/store/slices/qrSlice";
import { fetchQrAnalytics, fetchQrLocations, fetchQrRecentScans, clearQrAnalytics } from "@/store/slices/analyticsSlice";

const typeColors: Record<string, string> = {
  url: "bg-primary-soft text-primary",
  upi: "bg-success/10 text-success",
  whatsapp: "bg-success/10 text-success",
  wifi: "bg-warning/10 text-warning",
  vcard: "bg-accent text-accent-foreground",
};

const DEVICE_COLORS: Record<string, string> = {
  Android: "#22c55e",
  iOS: "#3b82f6",
  Desktop: "#a855f7",
  Other: "#94a3b8",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day ago`;
}

function QRDetailInner() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;

  const { currentQr: qr, loading: qrLoading, error: qrError } = useSelector((s: RootState) => s.qr);
  const { dailyRows, locations, recentScans, loading: analyticsLoading } = useSelector(
    (s: RootState) => s.analytics
  );

  useEffect(() => {
    if (!id) return;
    dispatch(fetchQrById(id));
    dispatch(fetchQrAnalytics({ id, days: 30 }));
    dispatch(fetchQrLocations({ id, limit: 6 }));
    dispatch(fetchQrRecentScans({ id, limit: 6 }));
    return () => {
      dispatch(clearQrAnalytics());
    };
  }, [dispatch, id]);

  const data = useMemo(() => {
    if (!qr || dailyRows.length === 0) return null;

    const trend = dailyRows.map((r) => ({
      date: r.label,
      scans: r.scans,
      clicks: r.clicks,
    }));

    const hourlyTotals = new Array(24).fill(0);
    const deviceTotals: Record<string, number> = {};
    for (const row of dailyRows) {
      row.hourlyBreakdown.forEach((v, i) => (hourlyTotals[i] += v));
      for (const [device, count] of Object.entries(row.deviceBreakdown)) {
        deviceTotals[device] = (deviceTotals[device] || 0) + count;
      }
    }
    const hourly = hourlyTotals.map((scans, h) => ({ hour: h.toString().padStart(2, "0"), scans }));

    const deviceTotalSum = Object.values(deviceTotals).reduce((a, b) => a + b, 0) || 1;
    const devices = Object.entries(deviceTotals).map(([name, value]) => ({
      name,
      value: Math.round((value / deviceTotalSum) * 100),
      color: DEVICE_COLORS[name] || DEVICE_COLORS.Other,
    }));

    const peakHour = hourly.reduce((m, h) => (h.scans > m.scans ? h : m), hourly[0]);
    const yesterday = trend[trend.length - 2]?.scans ?? 0;
    const today = trend[trend.length - 1]?.scans ?? 0;
    const dod = yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : 0;

    return { trend, hourly, devices, peakHour, dod };
  }, [qr, dailyRows]);

  if (qrLoading && !qr) {
    return <div className="max-w-2xl mx-auto text-center py-20 text-sm text-muted-foreground">Loading QR details…</div>;
  }

  if (qrError || !qr) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold font-heading mb-2">QR code not found</h2>
        <Button asChild variant="outline"><Link href="/dashboard/codes">Back to My QR Codes</Link></Button>
      </div>
    );
  }

  const topCity = locations[0];
  const clickRate = qr.scansTotal > 0 ? Math.round(((qr as any).clicksTotal / qr.scansTotal) * 100) : 0;

  const stats = [
    { label: "Total Scans", value: qr.scansTotal.toLocaleString("en-IN"), sub: data ? `${data.dod >= 0 ? "+" : ""}${data.dod}% vs yesterday` : "—", icon: TrendingUp },
    { label: "Click-through", value: `${(qr as any).clicksTotal?.toLocaleString("en-IN") ?? 0}`, sub: `${clickRate}% of scans clicked`, icon: MousePointerClick },
    { label: "Top City", value: topCity?.city || "No data yet", sub: topCity ? `${topCity.pct}% of scans` : "", icon: MapPin },
    { label: "Peak Hour", value: data ? `${data.peakHour.hour}:00` : "—", sub: "Last 30 days", icon: Clock },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb / back */}
      <div>
        <button
          onClick={() => router.push("/dashboard/codes")}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My QR Codes
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="bg-card rounded-2xl p-3 border border-border/60 shadow-card shrink-0">
              <QRCodeCanvas value={qr.destination} size={72} bgColor="#ffffff" fgColor="#000099" level="H" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <Badge className={`${typeColors[qr.type] ?? "bg-secondary text-foreground"} border-0 font-semibold uppercase text-[10px]`}>{qr.type}</Badge>
                {qr.isDynamic && (
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">DYNAMIC</Badge>
                )}
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  qr.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${qr.status === "active" ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                  {qr.status}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground truncate">{qr.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="font-mono truncate max-w-md">{qr.destination}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(qr.destination); toast.success("Copied"); }}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {qr.type === "url" && (
                  <a href={qr.destination} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-secondary">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Created {new Date(qr.createdAt).toLocaleDateString("en-IN")} · ID {qr._id}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-full">
              <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download
            </Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-blue">
              <Link href="/dashboard/codes"><Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl p-4 md:p-5 border border-border/60 shadow-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{s.sub}</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold font-heading text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {!data && !analyticsLoading && (
        <div className="bg-card rounded-2xl p-8 border border-border/60 shadow-card text-center text-sm text-muted-foreground">
          No scans recorded yet for this QR — charts will populate once it's scanned.
        </div>
      )}

      {data && (
        <>
          {/* Trend */}
          <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold font-heading text-foreground">Scan trend</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Last 30 days · scans vs click-throughs</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="d1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="d2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary-glow))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary-glow))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" name="Scans" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#d1)" />
                  <Area type="monotone" name="Clicks" dataKey="clicks" stroke="hsl(var(--primary-glow))" strokeWidth={2} fill="url(#d2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly + Devices */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
              <h3 className="text-base font-semibold font-heading mb-1 text-foreground">Scans by hour</h3>
              <p className="text-xs text-muted-foreground mb-4">When people scan this QR — peak at {data.peakHour.hour}:00.</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
              <h3 className="text-base font-semibold font-heading mb-4 text-foreground">Devices</h3>
              {data.devices.length === 0 ? (
                <p className="text-xs text-muted-foreground py-10 text-center">No device data yet.</p>
              ) : (
                <>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.devices} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                          {data.devices.map((d) => <Cell key={d.name} fill={d.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.devices.map((d) => (
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
        </>
      )}

      {/* Cities + Recent scans */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
          <h3 className="text-base font-semibold font-heading mb-4 text-foreground">Top cities</h3>
          {locations.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No location data yet.</p>
          ) : (
            <div className="space-y-3">
              {locations.map((l) => (
                <div key={l.city}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-foreground">{l.city}</span>
                    <span className="text-muted-foreground">
                      {l.scans.toLocaleString("en-IN")}{" "}
                      <span className="font-semibold text-foreground ml-1">{l.pct}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${l.pct}%` }}
                      transition={{ duration: 0.7 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
          <h3 className="text-base font-semibold font-heading mb-4 text-foreground">Recent scans</h3>
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
                  <div className="text-[11px] text-muted-foreground">{timeAgo(s.scannedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QRDetailContent() {
  return <QRDetailInner />;
}