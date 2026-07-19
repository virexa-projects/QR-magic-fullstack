// components/ContentRouter.tsx
"use client";
import dynamic from "next/dynamic";
import type { QRType, QrDesign } from "../types";

/**
 * Every content component is code-split — a single scan only ever needs
 * ONE of these 15+ renderers, so there's no reason to ship the whole
 * set (feedback form state, ICS/vCard-adjacent imports, icon sets,
 * etc.) in the initial preview-page bundle. next/dynamic gives each its
 * own chunk, fetched only when that QR type is actually being viewed.
 */
const URLContent = dynamic(() => import("./content/URLContent"), { ssr: true });
const VCardContent = dynamic(() => import("./content/VCardContent"), { ssr: true });
const UPIContent = dynamic(() => import("./content/UPIContent"), { ssr: true });
const WhatsAppContent = dynamic(() => import("./content/WhatsAppContent"), { ssr: true });
const WifiContent = dynamic(() => import("./content/WifiContent"), { ssr: true });
const EmailContent = dynamic(() => import("./content/EmailContent"), { ssr: true });
const PhoneCallContent = dynamic(() => import("./content/PhoneSmsContent"), { ssr: true });
const LocationContent = dynamic(() => import("./content/LocationContent"), { ssr: true });
const SMSContent = dynamic(() => import("./content/PhoneSmsContent").then((m) => m.SMSContent), { ssr: true });
const TextContent = dynamic(() => import("./content/TextContent"), { ssr: true });
const ImageContent = dynamic(() => import("./content/MediaContent"), { ssr: true });
const VideoContent = dynamic(() => import("./content/MediaContent").then((m) => m.VideoContent), { ssr: true });
const AudioContent = dynamic(() => import("./content/MediaContent").then((m) => m.AudioContent), { ssr: true });
const SocialContent = dynamic(() => import("./content/SocialContent"), { ssr: true });
const EventContent = dynamic(() => import("./content/EventContent"), { ssr: true });
const FeedbackContent = dynamic(() => import("./content/FeedbackContent"), { ssr: false }); // has client-only form state
const MenuContent = dynamic(() => import("./content/MenuContent"), { ssr: true });
const PlaylistContent = dynamic(() => import("./content/PlaylistContent"), { ssr: true });

interface Props {
  type: QRType;
  data: Record<string, any>;
  design: QrDesign;
  shortCode: string;
}

export function ContentRouter({ type, data, design, shortCode }: Props) {
  switch (type) {
    case "url":
      return <URLContent data={data} shortCode={shortCode} />;
    case "vcard":
      return <VCardContent data={data} design={design} shortCode={shortCode} />;
    case "upi":
      return <UPIContent data={data} shortCode={shortCode} />;
    case "whatsapp":
      return <WhatsAppContent data={data} shortCode={shortCode} />;
    case "wifi":
      return <WifiContent data={data} shortCode={shortCode} />;
    case "email":
      return <EmailContent data={data} shortCode={shortCode} />;
    case "phone":
      return <PhoneCallContent data={data} shortCode={shortCode} />;
    case "sms":
      return <SMSContent data={data} shortCode={shortCode} />;
    case "location":
      return <LocationContent data={data} shortCode={shortCode} />;
    case "text":
      return <TextContent data={data} />;
    case "image":
      return <ImageContent data={data} />;
    case "video":
      return <VideoContent data={data} />;
    case "audio":
      return <AudioContent data={data} />;
    case "social":
      return <SocialContent data={data} />;
    case "event":
      return <EventContent data={data} shortCode={shortCode} />;
    case "feedback":
      return <FeedbackContent data={data} shortCode={shortCode} />;
    case "menu":
      return <MenuContent data={data} />;
    case "playlist":
      return <PlaylistContent data={data} />;
    default:
      return <div className="p-10 text-center">Unsupported QR Type</div>;
  }
}
