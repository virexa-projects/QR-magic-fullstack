"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Provider } from "react-redux";
import { store, useAppDispatch } from "@/store";
import { fetchCurrentUser } from "@/store/slices/authSlice";
import { RouteGuard } from "@/components/auth/RouteGuard";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
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
  );
}
