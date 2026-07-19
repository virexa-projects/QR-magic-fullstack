"use client";

import { type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {

  return (

    <div className="min-h-screen flex w-full bg-secondary/40">
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
        {children}
      </main>

    </div>

  );
}
