"use client";

import { Users, UserCheck, UserX, Shield } from "lucide-react";

// Placeholder — replace with your actual UsersContent component when ready
export default function DashboardUsersPage() {
  const stats = [
    { label: "Total Users", value: "1,284", icon: Users, color: "text-primary" },
    { label: "Active Users", value: "1,102", icon: UserCheck, color: "text-success" },
    { label: "Inactive Users", value: "182", icon: UserX, color: "text-muted-foreground" },
    { label: "Admins", value: "3", icon: Shield, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and monitor all platform users.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </div>
            <div className="text-2xl font-bold font-heading text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <p className="text-sm text-muted-foreground text-center py-8">
          Users table will be displayed here.
        </p>
      </div>
    </div>
  );
}
