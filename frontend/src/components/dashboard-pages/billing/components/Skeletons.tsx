export function HeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 animate-pulse">
      <div>
        <div className="h-7 w-48 rounded-md bg-secondary" />
        <div className="h-4 w-64 rounded-md bg-secondary mt-2" />
      </div>
      <div className="h-6 w-32 rounded-full bg-secondary" />
    </div>
  );
}

export function PlanCardSkeleton() {
  return (
    <div className="rounded-2xl p-6 border border-border/60 bg-card animate-pulse space-y-4">
      <div className="h-4 w-24 rounded bg-secondary" />
      <div className="h-3 w-32 rounded bg-secondary" />
      <div className="h-8 w-20 rounded bg-secondary" />
      <div className="h-10 w-full rounded-full bg-secondary" />
      <div className="space-y-2 pt-4">
        <div className="h-3 w-full rounded bg-secondary" />
        <div className="h-3 w-5/6 rounded bg-secondary" />
        <div className="h-3 w-2/3 rounded bg-secondary" />
      </div>
    </div>
  );
}

export function UsageSkeleton() {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-7 shadow-card space-y-6 animate-pulse">
      <div className="h-3 w-40 rounded bg-secondary" />
      <div className="h-2 w-full rounded-full bg-secondary" />
      <div className="h-3 w-40 rounded bg-secondary" />
      <div className="h-2 w-full rounded-full bg-secondary" />
    </div>
  );
}

export function SubscriptionSkeleton() {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-7 shadow-card animate-pulse">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded bg-secondary" />
              <div className="h-4 w-24 rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Lightweight fallback shown while a modal chunk (payment result or
// downgrade confirmation) is being fetched by next/dynamic.
export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-pulse space-y-4">
        <div className="w-14 h-14 rounded-full bg-secondary mx-auto" />
        <div className="h-4 w-2/3 rounded bg-secondary mx-auto" />
        <div className="h-3 w-full rounded bg-secondary" />
        <div className="h-10 w-full rounded-full bg-secondary" />
      </div>
    </div>
  );
}

// Fallback shown while the PayPal checkout chunk (and PayPal SDK) loads.
export function PaypalCheckoutModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-pulse space-y-4">
        <div className="h-4 w-1/2 rounded bg-secondary" />
        <div className="h-3 w-3/4 rounded bg-secondary" />
        <div className="h-14 w-full rounded-xl bg-secondary" />
        <div className="h-24 w-full rounded-lg bg-secondary" />
      </div>
    </div>
  );
}
