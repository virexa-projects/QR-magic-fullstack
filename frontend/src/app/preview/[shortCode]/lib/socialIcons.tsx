// lib/socialIcons.tsx
import { Globe, Link2, MessageCircle } from "lucide-react";
import { FaLinkedinIn, FaInstagram, FaXTwitter, FaYoutube, FaGithub, FaFacebookF, FaTiktok } from "react-icons/fa6";

export const SOCIAL_ICONS: Record<string, { icon: React.ElementType; brand: string }> = {
  LinkedIn: { icon: FaLinkedinIn, brand: "#0A66C2" },
  Instagram: { icon: FaInstagram, brand: "#E4405F" },
  X: { icon: FaXTwitter, brand: "#000000" },
  YouTube: { icon: FaYoutube, brand: "#FF0000" },
  Facebook: { icon: FaFacebookF, brand: "#1877F2" },
  TikTok: { icon: FaTiktok, brand: "#000000" },
  GitHub: { icon: FaGithub, brand: "#181717" },
  WhatsApp: { icon: MessageCircle, brand: "#25D366" },
  Website: { icon: Globe, brand: "#1a1a2e" },
  Custom: { icon: Link2, brand: "#475569" },
};

export function socialMeta(label: string) {
  return SOCIAL_ICONS[label] || SOCIAL_ICONS.Custom;
}
