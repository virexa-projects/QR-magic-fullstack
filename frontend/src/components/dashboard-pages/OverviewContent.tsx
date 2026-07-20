import { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { QrCode, Eye, TrendingUp, Activity, Plus, ArrowUpRight, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart, PieChart, Pie, Cell } from "recharts";
import { useAppSelector, useAppDispatch } from "@/store";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { fetchSummary, fetchTrend, fetchDevices, fetchTopQrs } from "@/store/slices/analyticsSlice";
import { usePageRefresh } from "../Context/RefreshContext";

// Colors for the devices pie chart, keyed by the device string your
// Scan/AnalyticsDaily documents actually store (lowercase).
const DEVICE_COLORS: Record<string, string> = {
  android: "#22C55E",
  ios: "#3B82F6",
  desktop: "#A855F7",
  other: "#94A3B8",
};

function OverviewInner() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { summary, trend, devices, topQrs } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchTrend());
    dispatch(fetchDevices());
    dispatch(fetchTopQrs({ limit: 4 }));
  }, [dispatch]);

  const firstName = user?.name?.split(" ")[0] || "there";
  usePageRefresh(
    useCallback(async () => {
      await Promise.all([
        dispatch(fetchSummary()),
        dispatch(fetchTrend()),
        dispatch(fetchDevices()),
        dispatch(fetchTopQrs({ limit: 4 })),
      ]);
    }, [dispatch]),
    []
  );
  // Backend doesn't return a "vs last week" % directly, so derive it from
  // the trend series: sum of the last 7 days vs the 7 days before that.
  const weekChange = (() => {
    if (trend.length < 14) return 0;
    const last7 = trend.slice(-7).reduce((sum, d) => sum + d.scans, 0);
    const prev7 = trend.slice(-14, -7).reduce((sum, d) => sum + d.scans, 0);
    if (prev7 === 0) return last7 > 0 ? 100 : 0;
    return Math.round(((last7 - prev7) / prev7) * 100);
  })();

  // { android: 412, ios: 190, ... } -> [{ name, value, color }], value as a rounded %
  const deviceBreakdown = (() => {
    const total = Object.values(devices).reduce((sum, v) => sum + v, 0) || 1;
    return Object.entries(devices)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round((count / total) * 100),
        color: DEVICE_COLORS[name.toLowerCase()] ?? DEVICE_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value);
  })();

  const topDevice = deviceBreakdown[0];

  const totalQRs = summary?.totalQRs ?? 0;
  const activeQRs = summary?.activeQRs ?? 0;
  const totalScans = summary?.totalScans ?? 0;
  const scansToday = summary?.scansToday ?? 0;

  const statCards = [
    { label: "Total QR Codes", value: totalQRs, icon: QrCode, change: "+2 this week", color: "text-primary" },
    { label: "Total Scans", value: totalScans.toLocaleString("en-IN"), icon: Eye, change: `+${weekChange}% vs last week`, color: "text-success" },
    { label: "Scans Today", value: scansToday, icon: Activity, change: "Live", color: "text-warning" },
    { label: "Active QRs", value: activeQRs, icon: TrendingUp, change: `${totalQRs - activeQRs} paused`, color: "text-primary" },
  ];

  const top = topQrs.slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Welcome back, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            You've got <span className="font-semibold text-foreground">{scansToday} scans</span> today across {activeQRs} active QRs.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-blue">
          <Link href="/dashboard/create"><Plus className="w-4 h-4 mr-1" /> Create QR Code</Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl p-4 md:p-5 border border-border/60 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.change}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-bold font-heading text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Devices */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold font-heading text-foreground">Scans — last 30 days</h3>
              <p className="text-xs text-muted-foreground">Hover the chart for daily breakdown</p>
            </div>
            <Link href="/dashboard/analytics" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Area type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#scansGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold font-heading text-foreground">Devices</h3>
            <Smartphone className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceBreakdown} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {deviceBreakdown.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold font-heading text-foreground">{topDevice?.value ?? 0}%</div>
              <div className="text-[10px] text-muted-foreground">{topDevice?.name ?? "Android"}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
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

      {/* Top QRs */}
      <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/60 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold font-heading text-foreground">Top performing QRs today</h3>
            <p className="text-xs text-muted-foreground">Sorted by scans in the last 24 hours</p>
          </div>
          <Link href="/dashboard/codes" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            All QRs <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {top.map((q) => (
            <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition">
              <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center font-bold text-xs uppercase">
                {q.type.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{q.name}</div>
                <div className="text-xs text-muted-foreground truncate">{q.destination}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-heading text-foreground">{q.scansToday}</div>
                <div className="text-[10px] text-muted-foreground">today</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold font-heading text-primary">{q.scans.toLocaleString("en-IN")}</div>
                <div className="text-[10px] text-muted-foreground">total</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OverviewContent() {
  return (
    <DashboardLayout>
      <OverviewInner />
    </DashboardLayout>
  );
}