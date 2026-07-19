// components/content/PlaylistContent.tsx
import { memo } from "react";

type Track = { title: string; artist?: string; url?: string };

function PlaylistContentBase({ data }: { data: Record<string, any> }) {
  const tracks: Track[] = data.tracks || [];

  return (
    <div className="p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-neutral-900">{data.title || "Playlist"}</h2>
      <div className="space-y-2">
        {tracks.map((track, index) => (
          <a
            key={index}
            href={track.url || "#"}
            target={track.url ? "_blank" : undefined}
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 hover:bg-neutral-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
              <span className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>{index + 1}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-neutral-800">{track.title}</p>
              {track.artist && <p className="truncate text-[11px] text-neutral-500">{track.artist}</p>}
            </div>
          </a>
        ))}
        {tracks.length === 0 && <p className="text-sm text-neutral-400">No tracks found.</p>}
      </div>
    </div>
  );
}

export default memo(PlaylistContentBase);
