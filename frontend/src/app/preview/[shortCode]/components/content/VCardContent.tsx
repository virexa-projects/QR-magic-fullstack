// components/content/VCardContent.tsx
import { memo, useMemo } from "react";
import { User, Mail, Phone } from "lucide-react";
import { trackClickBeacon } from "../../lib/tracking";
import { downloadVCard } from "../../lib/vcard";
import { socialMeta } from "../../lib/socialIcons";
import { ContactRow } from "../ContactRow";
import type { QrDesign } from "../../types";

interface Props {
  data: Record<string, any>;
  design: QrDesign;
  shortCode: string;
}

function VCardContentBase({ data, design, shortCode }: Props) {
  const theme = data.theme || {};
  const layout = theme.layout || "classic";
  // theme.bannerColor can be a solid hex OR a CSS gradient string — always
  // apply it with `background`, never `backgroundColor`.
  const banner = theme.bannerColor || design.bannerColor || "#000099";
  const accent = theme.accentColor || design.accentColor || design.fgColor || "#0d9488";

  const name = data.fullName || "Your Name";
  const role = data.role || (data.company ? "Team Member" : "Your Role");
  const company = data.company || "";
  const bio = data.bio || "";
  const avatarUrl = data.avatarUrl || "";
  const initials = useMemo(
    () => name.split(/\s+/).filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
    [name]
  );

  const phones: { label: string; value: string }[] = data.phones || [];
  const emails: { label: string; value: string }[] = data.emails || [];
  const socials: { label: string; value: string }[] = data.socials || [];
  const showCTA = data.showAddToContacts !== false;
  const hasContactInfo = phones.length > 0 || emails.length > 0 || socials.length > 0;

  const AvatarCircle = ({ size }: { size: number }) => (
    <div className="shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-md" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full" style={{ backgroundColor: `${accent}26` }}>
          <span className="font-bold" style={{ color: accent, fontSize: size * 0.32 }}>{initials}</span>
        </div>
      )}
    </div>
  );

  const SocialStrip = () =>
    socials.length ? (
      <div className="flex flex-wrap justify-center gap-2 px-4">
        {socials.map((s, i) => {
          const meta = socialMeta(s.label);
          return (
            <a
              key={i}
              href={/^https?:\/\//i.test(s.value) ? s.value : `https://${s.value}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClickBeacon(shortCode)}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: `${meta.brand}1a` }}
              title={s.label}
            >
              <meta.icon className="h-3.5 w-3.5" style={{ color: meta.brand }} />
            </a>
          );
        })}
      </div>
    ) : null;

  const ContactRows = () => (
    <div className="space-y-2">
      {phones.map((p, i) => <ContactRow key={`p${i}`} icon={Phone} label={p.label} value={p.value} accent={accent} />)}
      {emails.map((e, i) => <ContactRow key={`e${i}`} icon={Mail} label={e.label} value={e.value} accent={accent} />)}
      {!hasContactInfo && <p className="py-6 text-center text-xs text-neutral-400">No contact details added yet.</p>}
    </div>
  );

  const CTA = () =>
    showCTA ? (
      <div className="px-4 pb-5 sm:px-8">
        <button
          onClick={() => downloadVCard(shortCode, data)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-sm font-semibold text-white"
        >
          <User className="h-4 w-4" /> Add to Contacts
        </button>
        <p className="mt-2 text-center text-[11px] text-neutral-400">Saves directly to your phone — no app needed</p>
      </div>
    ) : null;

  if (layout === "split") {
    return (
      <div className="flex flex-col">
        <div className="h-2.5" style={{ background: banner }} />
        <div className="flex items-center gap-4 px-5 pb-4 pt-5 sm:px-8">
          <AvatarCircle size={64} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold leading-tight text-neutral-900">{name}</h3>
            <p className="truncate text-xs text-neutral-500">{role}{company ? ` · ${company}` : ""}</p>
          </div>
        </div>
        {bio && <p className="px-5 pb-3 text-[13px] leading-relaxed text-neutral-600 sm:px-8">{bio}</p>}
        <div className="pb-3"><SocialStrip /></div>
        <div className="px-4 pb-4 sm:px-8"><ContactRows /></div>
        <CTA />
      </div>
    );
  }

  if (layout === "minimal") {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center px-4 pt-8">
          <AvatarCircle size={84} />
          <h3 className="mt-3 text-lg font-bold leading-tight text-neutral-900">{name}</h3>
          <p className="mt-0.5 text-xs text-neutral-500">{role}</p>
          {company && <p className="text-[11px] text-neutral-400">{company}</p>}
          {bio && <p className="mt-2 max-w-xs text-center text-[13px] leading-relaxed text-neutral-600">{bio}</p>}
        </div>
        <div className="mt-4"><SocialStrip /></div>
        <div className="mx-5 my-4 h-px bg-neutral-100 sm:mx-8" />
        <div className="px-4 pb-4 sm:px-8"><ContactRows /></div>
        <CTA />
      </div>
    );
  }

  if (layout === "banner") {
    return (
      <div className="flex flex-col">
        <div className="flex items-start justify-between px-5 pb-9 pt-6 sm:px-8" style={{ background: banner }}>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold leading-tight text-white">{name}</h3>
            <p className="mt-0.5 truncate text-xs text-white/80">{role}</p>
            {company && <p className="truncate text-[11px] text-white/70">{company}</p>}
          </div>
          <AvatarCircle size={56} />
        </div>
        {bio && <p className="px-5 pt-3 text-[13px] leading-relaxed text-neutral-600 sm:px-8">{bio}</p>}
        <div className="mt-3"><SocialStrip /></div>
        <div className="px-4 pb-4 pt-3 sm:px-8"><ContactRows /></div>
        <CTA />
      </div>
    );
  }

  // Classic layout (default): banner strip + centered avatar overlap
  return (
    <div className="flex flex-col">
      <div className="relative px-5 pb-14 pt-7 sm:px-8" style={{ background: banner }}>
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.25em] sm:text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
          {company || "Digital Card"}
        </p>
      </div>
      <div className="relative -mt-11 flex justify-center sm:-mt-12">
        <AvatarCircle size={80} />
      </div>
      <div className="mt-3 px-4 text-center">
        <h3 className="text-lg font-bold leading-tight text-neutral-900 sm:text-xl">{name}</h3>
        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">{role}</p>
        {bio && <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-neutral-600">{bio}</p>}
      </div>
      <div className="mt-4"><SocialStrip /></div>
      <div className="mt-5 space-y-2 px-4 pb-4 sm:px-8"><ContactRows /></div>
      <CTA />
    </div>
  );
}

export default memo(VCardContentBase);
