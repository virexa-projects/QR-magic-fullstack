"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Plus, QrCode, BarChart3, CreditCard, LogOut, Sparkles } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutUser, UserRole } from "@/store/slices/authSlice";
import { toast } from "sonner";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  end?: boolean;
  allowedRoles?: UserRole[];
}

const items: SidebarItem[] = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, end: true, allowedRoles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
  { title: "Create QR", url: "/dashboard/create", icon: Plus, allowedRoles: [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.USER] },
  { title: "My QR Codes", url: "/dashboard/codes", icon: QrCode, allowedRoles: [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.USER] },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, allowedRoles: [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.USER] },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard, allowedRoles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push("/login");
  };

  // Filter items based on user role
  const visibleItems = items.filter(item => {
    if (!user) return false;
    if (item.allowedRoles && !item.allowedRoles.includes(user.role)) {
      return false;
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:px-1.5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-blue flex items-center justify-center shadow-blue">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold font-heading text-sidebar-foreground">QRBharat</div>
              <div className="text-[10px] text-muted-foreground">Free plan</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const active = item.end ? pathname === item.url : (pathname ?? "").startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        href={item.url}
                        className={`flex items-center gap-3 rounded-lg ${
                          active ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "hover:bg-sidebar-accent/50"
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mx-2 mt-6 rounded-2xl bg-gradient-blue p-4 text-primary-foreground">
            <Sparkles className="w-5 h-5 mb-2" />
            <div className="text-sm font-semibold mb-1">Upgrade to Pro</div>
            <div className="text-xs text-primary-foreground/80 mb-3">Unlock dynamic QRs & analytics</div>
            <Button size="sm" onClick={() => router.push("/dashboard/billing")} className="w-full h-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-xs font-semibold">
              See plans
            </Button>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.[0] || "U"}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
              </div>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-secondary">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
