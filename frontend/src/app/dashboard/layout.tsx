"use client";

import { type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/40">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center gap-3 px-4 md:px-6 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search QR codes, analytics…"
                  className="pl-9 h-9 bg-secondary/60 border-transparent focus-visible:bg-card"
                />
              </div>
            </div>
            <button className="ml-auto relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
            </button>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
