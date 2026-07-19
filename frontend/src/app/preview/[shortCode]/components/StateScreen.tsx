// components/StateScreen.tsx
import { memo } from "react";

function StateScreenBase({ kind, message }: { kind: "loading" | "error" | "missing"; message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-6">
      <div className="text-center">
        {kind === "loading" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Loading…</p>
          </>
        )}
        {kind === "error" && (
          <>
            <p className="text-sm font-semibold text-neutral-800">Something went wrong</p>
            <p className="mt-1 text-xs text-neutral-500">{message}</p>
          </>
        )}
        {kind === "missing" && (
          <>
            <p className="text-sm font-semibold text-neutral-800">This code isn't available</p>
            <p className="mt-1 text-xs text-neutral-500">It may have expired or been removed.</p>
          </>
        )}
      </div>
    </div>
  );
}

export const StateScreen = memo(StateScreenBase);
