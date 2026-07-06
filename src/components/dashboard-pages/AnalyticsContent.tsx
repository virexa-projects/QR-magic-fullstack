import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { scansTrend, deviceBreakdown, locationBreakdown, hourlyHeatmap, summaryStats, mockQRs } from "@/lib/mockData";
import { TrendingUp, MapPin, Clock, Smartphone, ChevronDown, Check, QrCode, Link as LinkIcon, CreditCard, MessageSquare, Wifi, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import WorldMap from "@/components/dashboard/WorldMap";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const typeIcons: Record<string, React.ElementType> = {
  url: LinkIcon, upi: CreditCard, whatsapp: MessageSquare, wifi: Wifi, vcard: User,
};

const ALL_OPTION = { id: "all", name: "All QR codes", scans: summaryStats.totalScans };

function AnalyticsInner() {
  const [selectedId, setSelectedId] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    if (selectedId === "all") return null;
    return mockQRs.find((q) => q.id === selectedId) ?? null;
  }, [selectedId]);

  // Scale data for selected QR (simple proportion of total scans)
  const ratio = selected ? selected.scans / summaryStats.totalScans : 1;
  const trend = useMemo(() => scansTrend.map((d) => ({
    ...d,
    scans: Math.max(1, Math.round(d.scans * ratio)),
    unique: Math.max(1, Math.round(d.unique * ratio)),
  })), [ratio]);
  const hourly = useMemo(() => hourlyHeatmap.map((h) => ({ ...h, scans: Math.max(1, Math.round(h.scans * ratio)) })), [ratio]);
  const cities = useMemo(() => locationBreakdown.map((c) => ({ ...c, scans: Math.max(1, Math.round(c.scans * ratio)) })), [ratio]);

  const stats = selected
    ? {
        totalScans: selected.scans,
        scansToday: selected.scansToday,
        topCity: cities[0].city,
        peakHour: "7 PM",
      }
    : {
        totalScans: summaryStats.totalScans,
        scansToday: summaryStats.scansToday,
        topCity: "Mumbai",
        peakHour: "7 PM",
      };

  const SelectedIcon = selected ? (typeIcons[selected.type] ?? QrCode) : QrCode;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Header + QR selector */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">Analytics</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {selected ? `Performance for "${selected.name}"` : `All scans across ${summaryStats.totalQRs} QR codes`} · last 30 days
          </p>
        </div>

        {/* QR dropdown selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 h-10 pl-2 pr-3 rounded-lg border border-border bg-card hover:border-foreground/30 transition min-w-[260px]">
              <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center shrink-0">
                <SelectedIcon className="w-3.5 h-3.5 text-foreground" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs text-muted-foreground leading-none mb-0.5">Viewing</div>
                <div className="text-sm font-semibold text-foreground truncate">
                  {selected ? selected.name : ALL_OPTION.name}
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
              {mockQRs.map((q) => {
                const Icon = typeIcons[q.type] ?? QrCode;
                const sel = selectedId === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => { setSelectedId(q.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left hover:bg-secondary ${sel ? "bg-secondary" : ""}`}
                  >
                    <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{q.name}</div>
                      <div className="text-[11px] text-muted-foreground">{q.scans.toLocaleString("en-IN")} scans</div>
                    </div>
                    {sel && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total scans", value: stats.totalScans.toLocaleString("en-IN"), sub: `+${summaryStats.weekChange}% WoW`, icon: TrendingUp, accent: true },
          { label: "Scans today", value: stats.scansToday.toLocaleString("en-IN"), sub: "vs avg 412", icon: Smartphone },
          { label: "Top city", value: stats.topCity, sub: `${cities[0].pct}% of scans`, icon: MapPin },
          { label: "Peak hour", value: stats.peakHour, sub: "Mon–Fri", icon: Clock },
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
            <div className="text-xl md:text-2xl font-bold font-heading text-foreground">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Scans vs unique visitors</h3>
            <p className="text-[11px] text-muted-foreground">Last 30 days</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
              <Area type="monotone" name="Unique" dataKey="unique" stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
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
              <p className="text-[11px] text-muted-foreground">Top {cities.length} cities worldwide · pulsing dots show activity</p>
            </div>
          </div>
          <WorldMap data={cities} />
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Devices</h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceBreakdown} dataKey="value" innerRadius={40} outerRadius={62} paddingAngle={3}>
                  {deviceBreakdown.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {deviceBreakdown.map((d) => (
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

      {/* Hourly + Top cities list */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-1">Scans by hour</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Peak between 6–9 PM</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
          <div className="space-y-3">
            {cities.map((l) => (
              <div key={l.city}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{l.city}</span>
                  <span className="text-muted-foreground"><span className="font-semibold text-foreground">{l.pct}%</span></span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${l.pct * 3}%` }} transition={{ duration: 0.7 }} className="h-full bg-primary rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
