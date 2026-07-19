// components/dashboard-pages/create/components/Skeletons.tsx
"use client";

export function Step3Skeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4 animate-pulse">
      <div className="h-4 w-32 bg-secondary rounded" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-secondary" />
        ))}
      </div>
      <div className="h-24 bg-secondary rounded-lg" />
      <div className="h-10 w-full bg-secondary rounded-lg" />
    </div>
  );
}

export function QrPreviewSkeleton() {
  return <div className="w-[200px] h-[200px] rounded-lg bg-secondary animate-pulse" />;
}

export function PhoneFrameSkeleton() {
  return <div className="w-[228px] h-[420px] rounded-[2rem] bg-secondary animate-pulse" />;
}

export function TypeGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-pulse">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-secondary" />
      ))}
    </div>
  );
}