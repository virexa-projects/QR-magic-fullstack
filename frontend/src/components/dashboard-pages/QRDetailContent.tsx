"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { QRCodeCanvas } from "qrcode.react";
import { format, subDays } from "date-fns";
import { mockQRs, deviceBreakdown, locationBreakdown } from "@/lib/mockData";
import {
  ArrowLeft, TrendingUp, MapPin, Clock, Smartphone, Download, Copy,
  Pause, Play, Edit3, ExternalLink, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchQrById } from "@/store/slices/qrSlice";
const typeColors: Record<string, string> = {
  url: "bg-primary-soft text-primary",
  upi: "bg-success/10 text-success",
  whatsapp: "bg-success/10 text-success",
  wifi: "bg-warning/10 text-warning",
  vcard: "bg-accent text-accent-foreground",
};

// Deterministic pseudo-random based on QR id so each QR has stable but unique data
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function QRDetailInner() {
  
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;
  const qr = mockQRs.find((q) => q.id === id);

  const data = useMemo(() => {
    if (!qr) return null;
    const seedNum = qr.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = seeded(seedNum);
    const total = qr.scans;

    // 30-day trend that sums roughly to total
    const avg = total / 30;
    const trend = Array.from({ length: 30 }).map((_, i) => {
      const day = subDays(new Date(), 29 - i);
      const variance = 0.6 + rand() * 0.9;
      const weekendBoost = [0, 6].includes(day.getDay()) ? 1.25 : 1;
      const scans = Math.round(avg * variance * weekendBoost);
      return {
        date: format(day, "MMM d"),
        scans,
        unique: Math.round(scans * 0.72),
      };
    });

    // Hourly profile
    const hourly = Array.from({ length: 24 }).map((_, h) => ({
      hour: `${h.toString().padStart(2, "0")}`,
      scans: Math.round(
        (h < 6 ? 8 : h < 11 ? 28 : h < 14 ? 55 : h < 18 ? 70 : h < 22 ? 90 : 30) *
          (0.6 + rand() * 0.9) *
          (avg / 50)
      ),
    }));

    // Slightly perturbed device + city splits per QR
    const devices = deviceBreakdown.map((d) => ({
      ...d,
      value: Math.max(1, Math.round(d.value + (rand() - 0.5) * 8)),
    }));
    const devTotal = devices.reduce((s, d) => s + d.value, 0);
    devices.forEach((d) => (d.value = Math.round((d.value / devTotal) * 100)));

    const cities = locationBreakdown.slice(0, 6).map((c) => ({
      ...c,
      pct: Math.max(2, Math.round(c.pct + (rand() - 0.5) * 6)),
    }));

    const peakHour = hourly.reduce((m, h) => (h.scans > m.scans ? h : m), hourly[0]);
    const topCity = cities.reduce((m, c) => (c.pct > m.pct ? c : m), cities[0]);
    const yesterday = trend[trend.length - 2]?.scans ?? 0;
    const today = trend[trend.length - 1]?.scans ?? 0;
    const dod = yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : 0;

    return { trend, hourly, devices, cities, peakHour, topCity, dod };
  }, [qr]);

  if (!qr || !data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold font-heading mb-2">QR code not found</h2>
        <Button asChild variant="outline"><Link href="/dashboard/codes">Back to My QR Codes</Link></Button>
      </div>
    );
  }

  const stats = [
    { label: "Total Scans", value: qr.scans.toLocaleString("en-IN"), sub: `${data.dod >= 0 ? "+" : ""}${data.dod}% vs yesterday`, icon: TrendingUp },
    { label: "Scans Today", value: qr.scansToday.toLocaleString("en-IN"), sub: qr.status === "active" ? "Live tracking" : "Paused", icon: Smartphone },
    { label: "Top City", value: data.topCity.city, sub: `${data.topCity.pct}% of scans`, icon: MapPin },
    { label: "Peak Hour", value: `${data.peakHour.hour}:00`, sub: "Daily average", icon: Clock },
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
                <Badge className={`${typeColors[qr.type]} border-0 font-semibold uppercase text-[10px]`}>{qr.type}</Badge>
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
              <div className="text-[11px] text-muted-foreground mt-1">Created {qr.createdAt} · ID {qr.id}</div>
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

      {/* Trend */}
      <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold font-heading text-foreground">Scan trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Last 30 days · scans vs unique visitors</p>
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
              <Area type="monotone" name="Unique" dataKey="unique" stroke="hsl(var(--primary-glow))" strokeWidth={2} fill="url(#d2)" />
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
        </div>
      </div>

      {/* Cities + Recent scans */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
          <h3 className="text-base font-semibold font-heading mb-4 text-foreground">Top cities</h3>
          <div className="space-y-3">
            {data.cities.map((l) => (
              <div key={l.city}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">{l.city}</span>
                  <span className="text-muted-foreground">
                    {Math.round((qr.scans * l.pct) / 100).toLocaleString("en-IN")}{" "}
                    <span className="font-semibold text-foreground ml-1">{l.pct}%</span>
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${l.pct * 3}%` }}
                    transition={{ duration: 0.7 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
          <h3 className="text-base font-semibold font-heading mb-4 text-foreground">Recent scans</h3>
          <div className="space-y-2">
            {[
              { city: data.cities[0].city, device: "Android", time: "2 min ago" },
              { city: data.cities[1]?.city ?? "Delhi NCR", device: "iOS", time: "11 min ago" },
              { city: data.cities[0].city, device: "Android", time: "24 min ago" },
              { city: data.cities[2]?.city ?? "Bengaluru", device: "Android", time: "47 min ago" },
              { city: data.cities[1]?.city ?? "Delhi NCR", device: "iOS", time: "1 hr ago" },
              { city: data.cities[3]?.city ?? "Hyderabad", device: "Android", time: "2 hr ago" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 transition">
                <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{s.city}</div>
                  <div className="text-[11px] text-muted-foreground">{s.device}</div>
                </div>
                <div className="text-[11px] text-muted-foreground">{s.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QRDetailContent() {
  return <QRDetailInner />;
}
