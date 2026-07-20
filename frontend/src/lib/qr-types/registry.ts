// lib/qr-types/registry.ts
import {
  Link as LinkIcon, User, Image as ImageIconLucide, Video, Music, Share2, CalendarDays,
  MessageSquareHeart, UtensilsCrossed, ListMusic, FileText, MessageSquare, Wifi, Mail, Phone, MapPin,
} from "lucide-react";

import UrlForm, { UrlPreview } from "@/components/qr-builder/forms/types/UrlForm";
import VCardForm, { VCardPreview } from "@/components/qr-builder/forms/types/VCardForm";
import ImageForm, { ImagePreview } from "@/components/qr-builder/forms/types/ImageForm";
import VideoForm, { VideoPreview } from "@/components/qr-builder/forms/types/VideoForm";
import AudioForm, { AudioPreview } from "@/components/qr-builder/forms/types/AudioForm";
import SocialForm, { SocialPreview } from "@/components/qr-builder/forms/types/SocialForm";
import EventForm, { EventPreview } from "@/components/qr-builder/forms/types/EventForm";
import FeedbackForm, { FeedbackPreview } from "@/components/qr-builder/forms/types/FeedbackForm";
import MenuForm, { MenuPreview } from "@/components/qr-builder/forms/types/MenuForm";
import PlaylistForm, { PlaylistPreview } from "@/components/qr-builder/forms/types/PlaylistForm";
import {
  TextForm, TextPreview, WhatsappForm, WhatsappPreview, WifiForm, WifiPreview,
  EmailForm, EmailPreview, PhoneCallForm, PhoneCallPreview, SmsForm, SmsPreview,
  LocationForm, LocationPreview,
} from "@/components/qr-builder/forms/types/ClassicForms";

import { encodeVCard } from "./encoders/vcard";
import { encodeICS } from "./encoders/ics";
import { QrTypeDefinition, QrTypeId, defaultVCardValue, defaultLocationValue, defaultSocialValue } from "./schema";

export const QR_TYPE_REGISTRY: Record<QrTypeId, QrTypeDefinition> = {
  url: {
    id: "url", label: "Website", icon: LinkIcon, description: "Link to any URL",
    category: "classic", popular: true,
    FormComponent: UrlForm,
    PreviewComponent: UrlPreview,
    encode: (v) => v.url || "https://example.com",
    defaultValue: { url: "" },
  },
  text: {
    id: "text", label: "Text", icon: FileText, description: "Plain text",
    category: "classic",
    FormComponent: TextForm,
    PreviewComponent: TextPreview,
    encode: (v) => v.text || "Hello World",
    defaultValue: { text: "" },
  },
  vcard: {
    id: "vcard", label: "vCard", icon: User, description: "Digital business card",
    category: "business", popular: true,
    FormComponent: VCardForm,
    PreviewComponent: VCardPreview,
    encode: encodeVCard,
    defaultValue: defaultVCardValue,
  },
  whatsapp: {
    id: "whatsapp", label: "WhatsApp", icon: MessageSquare, description: "Open chat instantly",
    category: "classic", popular: true,
    FormComponent: WhatsappForm,
    PreviewComponent: WhatsappPreview,
    encode: (v) => {
      const phone = (v.phone || "").replace(/\D/g, "");
      const msg = v.message ? `?text=${encodeURIComponent(v.message)}` : "";
      return `https://wa.me/${phone}${msg}`;
    },
    defaultValue: { phone: "", message: "" },
  },
  wifi: {
    id: "wifi", label: "Wi-Fi", icon: Wifi, description: "One-tap connect",
    category: "classic",
    FormComponent: WifiForm,
    PreviewComponent: WifiPreview,
    encode: (v) => `WIFI:T:${v.encryption || "WPA"};S:${v.ssid || ""};P:${v.password || ""};;`,
    defaultValue: { ssid: "", password: "", encryption: "WPA" },
  },
  email: {
    id: "email", label: "Email", icon: Mail, description: "Pre-filled message",
    category: "classic",
    FormComponent: EmailForm,
    PreviewComponent: EmailPreview,
    encode: (v) => `mailto:${v.email || ""}?subject=${encodeURIComponent(v.subject || "")}&body=${encodeURIComponent(v.body || "")}`,
    defaultValue: { email: "", subject: "", body: "" },
  },
  phone: {
    id: "phone", label: "Phone", icon: Phone, description: "Tap to call",
    category: "classic",
    FormComponent: PhoneCallForm,
    PreviewComponent: PhoneCallPreview,
    encode: (v) => `tel:${v.phone || ""}`,
    defaultValue: { phone: "" },
  },
  sms: {
    id: "sms", label: "SMS", icon: MessageSquare, description: "Pre-filled SMS",
    category: "classic",
    FormComponent: SmsForm,
    PreviewComponent: SmsPreview,
    encode: (v) => `sms:${v.phone || ""}?body=${encodeURIComponent(v.message || "")}`,
    defaultValue: { phone: "", message: "" },
  },
  location: {
    id: "location", label: "Location", icon: MapPin, description: "GPS coordinates or a Maps link",
    category: "classic",
    FormComponent: LocationForm,
    PreviewComponent: LocationPreview,
    encode: (v) => (v.mode === "url" ? v.mapsUrl || "https://maps.google.com" : `geo:${v.latitude || "0"},${v.longitude || "0"}`),
    defaultValue: defaultLocationValue,
  },
  image: {
    id: "image", label: "Image", icon: ImageIconLucide, description: "Photo or gallery landing page",
    category: "media",
    FormComponent: ImageForm,
    PreviewComponent: ImagePreview,
    // Media types are dynamic — the real destination is the hosted landing
    // page URL assigned by the backend after save, not the raw file data.
    encode: (v) => v.images?.[0]?.url ?? "",
    // NOTE: no top-level `caption` here — ImageForm/imageSchema only ever
    // use per-image `caption` inside each entry of `images[]`. A stray
    // top-level `caption` field was dead weight and never read anywhere.
    defaultValue: { images: [], title: "", layout: "grid" },
  },
  video: {
    id: "video", label: "Video", icon: Video, description: "YouTube, Vimeo, or uploaded video",
    category: "media",
    FormComponent: VideoForm,
    PreviewComponent: VideoPreview,
    encode: (v) => v.videoUrl || "",
    defaultValue: { source: "youtube", videoUrl: "", title: "", autoplay: false, showControls: true },
  },
  audio: {
    id: "audio", label: "MP3 / Audio", icon: Music, description: "Music or voice message",
    category: "media",
    FormComponent: AudioForm,
    PreviewComponent: AudioPreview,
    encode: (v) => v.audioUrl || "",
    defaultValue: { title: "", artist: "", audioUrl: "", coverImage: "", autoplay: false },
  },
  social: {
    id: "social", label: "Social Media", icon: Share2, description: "All your profiles, one link",
    category: "business",
    FormComponent: SocialForm,
    PreviewComponent: SocialPreview,
    // Dynamic landing-page destination, assigned on save.
    encode: (v) => v.profiles?.[0]?.url ?? "",
    defaultValue: defaultSocialValue,
  },
  event: {
    id: "event", label: "Event", icon: CalendarDays, description: "Add-to-calendar invite",
    category: "engagement",
    FormComponent: EventForm,
    PreviewComponent: EventPreview,
    encode: encodeICS,
    // FIX: `location` was missing here even though EventForm reads/writes
    // value.location and eventSchema declares it — this left value.location
    // as `undefined` on first render, making the <Input> start uncontrolled
    // and then flip to controlled on the first keystroke (React warning +
    // flaky first-type behavior). Also added `organizerName` since the
    // schema declares it too, even though no form field uses it yet.
    defaultValue: {
      title: "",
      description: "",
      location: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      allDay: false,
      reminder: "none",
      organizerName: "",
    },
  },
  feedback: {
    id: "feedback", label: "Feedback / Review", icon: MessageSquareHeart, description: "Star rating + comments form",
    category: "engagement",
    FormComponent: FeedbackForm,
    PreviewComponent: FeedbackPreview,
    // Dynamic landing-page destination, assigned on save.
    encode: () => "",
    defaultValue: { headline: "", subheading: "", questions: [], allowAnonymous: true, thankYouMessage: "Thanks for your feedback!" },
  },
  menu: {
    id: "menu", label: "Restaurant Menu", icon: UtensilsCrossed, description: "Digital menu with categories",
    category: "business",
    FormComponent: MenuForm,
    PreviewComponent: MenuPreview,
    encode: () => "",
    defaultValue: { restaurantName: "", currency: "₹", categories: [], theme: "classic" },
  },
  playlist: {
    id: "playlist", label: "Playlist", icon: ListMusic, description: "Spotify / Apple Music / YouTube playlist",
    category: "media",
    FormComponent: PlaylistForm,
    PreviewComponent: PlaylistPreview,
    encode: (v) => v.playlistUrl || "",
    defaultValue: { platform: "spotify", playlistUrl: "", title: "" },
  },
};

export const QR_TYPE_LIST = Object.values(QR_TYPE_REGISTRY);