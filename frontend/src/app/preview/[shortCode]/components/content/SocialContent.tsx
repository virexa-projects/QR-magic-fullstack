// components/content/SocialContent.tsx
import { memo } from "react";
import { User, ExternalLink } from "lucide-react";
import { socialMeta } from "../../lib/socialIcons";

function SocialContentBase({ data }: { data: Record<string, any> }) {
  const profiles: { platform: string; handle?: string; url: string }[] = data.profiles || [];
  const displayName = data.displayName || "Your Name";
  const bio = data.bio || "";
  const avatarUrl = data.avatarUrl || "";
  const theme = data.theme || "light";

  const dark = theme === "dark";
  const gradient = theme === "gradient";

  return (
    <div
      className="flex flex-col items-center gap-3 px-6 py-9 text-center sm:px-8 sm:py-11"
      style={{
        background: gradient ? "linear-gradient(135deg,#000099,#7c3aed)" : dark ? "#0f0f1a" : undefined,
        color: dark || gradient ? "#fff" : "#14151A",
      }}
    >
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/15 sm:h-20 sm:w-20">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <User className={`h-7 w-7 ${dark || gradient ? "text-white" : "text-neutral-400"}`} />
        )}
      </div>
      <div>
        <p className="text-base font-bold sm:text-lg">{displayName}</p>
        {bio && <p className={`mt-1 max-w-xs text-[13px] ${dark || gradient ? "text-white/75" : "text-neutral-500"}`}>{bio}</p>}
      </div>

      <div className="mt-2 w-full space-y-2">
        {profiles.map((p, i) => {
          const meta = socialMeta(p.platform);
          return (
            <a
              key={i}
              href={p.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition"
              style={{ backgroundColor: dark || gradient ? "rgba(255,255,255,0.12)" : "#F5F5F4" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: dark || gradient ? "rgba(255,255,255,0.15)" : `${meta.brand}1a` }}
              >
                <meta.icon className="h-3.5 w-3.5" style={{ color: dark || gradient ? "#fff" : meta.brand }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{p.platform}</p>
                {p.handle && <p className={`truncate text-[11px] ${dark || gradient ? "text-white/60" : "text-neutral-400"}`}>{p.handle}</p>}
              </div>
              <ExternalLink className={`h-3.5 w-3.5 shrink-0 ${dark || gradient ? "text-white/50" : "text-neutral-300"}`} />
            </a>
          );
        })}
        {profiles.length === 0 && (
          <p className={`py-4 text-xs ${dark || gradient ? "text-white/60" : "text-neutral-400"}`}>No social links added yet.</p>
        )}
      </div>
    </div>
  );
}

export default memo(SocialContentBase);
