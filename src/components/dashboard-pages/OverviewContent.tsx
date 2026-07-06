import { motion } from "framer-motion";
import Link from "next/link";
import { QrCode, Eye, TrendingUp, Activity, Plus, ArrowUpRight, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart, PieChart, Pie, Cell } from "recharts";
import { mockQRs, scansTrend, deviceBreakdown, summaryStats } from "@/lib/mockData";
import { useAppSelector } from "@/store";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const statCards = [
  { label: "Total QR Codes", value: summaryStats.totalQRs, icon: QrCode, change: "+2 this week", color: "text-primary" },
  { label: "Total Scans", value: summaryStats.totalScans.toLocaleString("en-IN"), icon: Eye, change: `+${summaryStats.weekChange}% vs last week`, color: "text-success" },
  { label: "Scans Today", value: summaryStats.scansToday, icon: Activity, change: "Live", color: "text-warning" },
  { label: "Active QRs", value: summaryStats.activeQRs, icon: TrendingUp, change: `${summaryStats.totalQRs - summaryStats.activeQRs} paused`, color: "text-primary" },
];

function OverviewInner() {
  const { user } = useAppSelector((state) => state.auth);
  const firstName = user?.name?.split(" ")[0] || "there";
  const top = [...mockQRs].sort((a, b) => b.scansToday - a.scansToday).slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Welcome back, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            You've got <span className="font-semibold text-foreground">{summaryStats.scansToday} scans</span> today across {summaryStats.activeQRs} active QRs.
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
              <AreaChart data={scansTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
              <div className="text-2xl font-bold font-heading text-foreground">68%</div>
              <div className="text-[10px] text-muted-foreground">Android</div>
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
