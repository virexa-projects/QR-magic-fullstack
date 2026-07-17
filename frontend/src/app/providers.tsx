"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Provider } from "react-redux";
import { store, useAppDispatch } from "@/store";
import { fetchCurrentUser } from "@/store/slices/authSlice";
import { RouteGuard } from "@/components/auth/RouteGuard";

// Keep this in sync with PUBLIC_ROUTE_PREFIXES in RouteGuard.tsx.
// Routes under these prefixes never need a session, so there's no
// reason to fire /auth/me + /auth/refresh (both guaranteed 401s) for
// an anonymous visitor just scanning a QR.
const SKIP_AUTH_CHECK_PREFIXES = ["/preview"];

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const skip = SKIP_AUTH_CHECK_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (skip) return;

    dispatch(fetchCurrentUser());
  }, [dispatch, pathname]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppInitializer>
              <RouteGuard>{children}</RouteGuard>
            </AppInitializer>
          </TooltipProvider>
        </QueryClientProvider>
      </Provider>
    </GoogleOAuthProvider>
  );
}