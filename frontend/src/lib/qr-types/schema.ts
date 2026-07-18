// lib/qr-types/schema.ts
//
// Single source of truth for every QR type's SHAPE (zod schema -> TS type)
// and VALIDATION. Every form in components/qr-builder/forms/types/* is
// backed by one of the schemas below. `validateQrValue()` is what
// CreateContent.tsx calls before letting the user move from step 2 -> 3.

import { z } from "zod";
import type { VCardTheme } from "./vcard-theme";

// ----------------------------------------------------------------------
// Shared fragments
// ----------------------------------------------------------------------
const labeledValue = z.object({
  label: z.string(),
  value: z.string().trim().min(1, "Required"),
});

const labeledEmail = z.object({
  label: z.string(),
  value: z.string().trim().min(1, "Required").email("Enter a valid email"),
});

// ----------------------------------------------------------------------
// Classic types
// ----------------------------------------------------------------------
export const urlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .url("Enter a valid URL, e.g. https://example.com"),
});
export type UrlValue = z.infer<typeof urlSchema>;

export const textSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Text is required")
    .max(2000, "Keep it under 2000 characters"),
});
export type TextValue = z.infer<typeof textSchema>;

export const whatsappSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number with country code")
    .regex(/^\+?[0-9\s-]{6,20}$/, "Digits only, include the country code"),
  message: z.string().max(500, "Keep the message under 500 characters").optional().default(""),
});
export type WhatsappValue = z.infer<typeof whatsappSchema>;

export const wifiSchema = z
  .object({
    ssid: z.string().trim().min(1, "Network name is required"),
    password: z.string().optional().default(""),
    encryption: z.enum(["WPA", "WEP", "nopass"]).default("WPA"),
  })
  .refine((d) => d.encryption === "nopass" || d.password.length > 0, {
    message: "Password is required unless encryption is None",
    path: ["password"],
  });
export type WifiValue = z.infer<typeof wifiSchema>;

export const emailSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  subject: z.string().optional().default(""),
  body: z.string().optional().default(""),
});
export type EmailValue = z.infer<typeof emailSchema>;

export const phoneSchema = z.object({
  phone: z.string().trim().min(6, "Enter a valid phone number"),
});
export type PhoneValue = z.infer<typeof phoneSchema>;

export const smsSchema = z.object({
  phone: z.string().trim().min(6, "Enter a valid phone number"),
  message: z.string().optional().default(""),
});
export type SmsValue = z.infer<typeof smsSchema>;

// Location can be entered either as raw lat/long coordinates, or as a
// pasted Google Maps share URL — the user picks which mode they want.
export const locationSchema = z
  .object({
    mode: z.enum(["coords", "url"]).default("coords"),
    latitude: z.string().trim().optional().default(""),
    longitude: z.string().trim().optional().default(""),
    mapsUrl: z.string().trim().optional().default(""),
  })
  .superRefine((d, ctx) => {
    if (d.mode === "coords") {
      if (!d.latitude.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Latitude is required", path: ["latitude"] });
      } else if (isNaN(Number(d.latitude)) || Number(d.latitude) < -90 || Number(d.latitude) > 90) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be between -90 and 90", path: ["latitude"] });
      }
      if (!d.longitude.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Longitude is required", path: ["longitude"] });
      } else if (isNaN(Number(d.longitude)) || Number(d.longitude) < -180 || Number(d.longitude) > 180) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be between -180 and 180", path: ["longitude"] });
      }
    } else {
      if (!d.mapsUrl.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Google Maps link is required", path: ["mapsUrl"] });
      } else if (!/^https?:\/\//i.test(d.mapsUrl.trim())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid URL starting with https://", path: ["mapsUrl"] });
      }
    }
  });
export type LocationValue = z.infer<typeof locationSchema>;
export const defaultLocationValue: LocationValue = { mode: "coords", latitude: "", longitude: "", mapsUrl: "" };

// ----------------------------------------------------------------------
// vCard
// ----------------------------------------------------------------------
export const vcardSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required"),
    role: z.string().optional().default(""),
    company: z.string().optional().default(""),
    bio: z.string().max(280, "Keep bio under 280 characters").optional().default(""),
    avatarUrl: z.string().optional(),
    phones: z.array(labeledValue).default([]),
    emails: z.array(labeledEmail).default([]),
    socials: z.array(labeledValue).default([]),
    theme: z.custom<VCardTheme>(),
    showAddToContacts: z.boolean().default(true),
  })
  .refine((d) => d.phones.length > 0 || d.emails.length > 0, {
    message: "Add at least one phone number or email",
    path: ["phones"],
  });
export type VCardValue = z.infer<typeof vcardSchema>;

export const defaultVCardValue: VCardValue = {
  fullName: "",
  role: "",
  company: "",
  bio: "",
  phones: [],
  emails: [],
  socials: [],
  theme: {
    themeId: "indigo",
    bannerColor: "#000099",
    accentColor: "#000099",
    textColor: "#1a1a2e",
    fontPair: "inter-inter",
    iconStyle: "filled",
    avatarShape: "circle",
    layout: "classic",
  },
  showAddToContacts: true,
};

// ----------------------------------------------------------------------
// Rich / media types
// ----------------------------------------------------------------------
export const imageSchema = z.object({
  images: z
    .array(z.object({ url: z.string().min(1, "Image is required"), caption: z.string().optional() }))
    .min(1, "Add at least one image"),
  title: z.string().optional().default(""),
  layout: z.enum(["grid", "carousel", "stack"]).default("grid"),
});
export type ImageValue = z.infer<typeof imageSchema>;

export const videoSchema = z
  .object({
    source: z.enum(["youtube", "vimeo", "upload"]),
    videoUrl: z.string().trim().min(1, "Add a video URL or upload a file"),
    title: z.string().optional().default(""),
    autoplay: z.boolean().default(false),
    showControls: z.boolean().default(true),
  })
  .refine((d) => d.source === "upload" || /^https?:\/\//i.test(d.videoUrl), {
    message: "Enter a valid URL starting with https://",
    path: ["videoUrl"],
  });
export type VideoValue = z.infer<typeof videoSchema>;

export const audioSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  artist: z.string().optional().default(""),
  audioUrl: z.string().trim().min(1, "Upload an audio file"),
  coverImage: z.string().optional(),
  autoplay: z.boolean().default(false),
});
export type AudioValue = z.infer<typeof audioSchema>;

export const socialProfileSchema = z.object({
  platform: z.string(),
  handle: z.string().optional().default(""),
  url: z.string().trim().min(1, "Enter a URL").url("Enter a valid URL"),
});
export const socialSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required"),
  bio: z.string().max(280, "Keep bio under 280 characters").optional().default(""),
  avatarUrl: z.string().optional(),
  profiles: z.array(socialProfileSchema).min(1, "Add at least one social link"),
  theme: z.enum(["light", "dark", "gradient"]).default("light"),
});
export type SocialValue = z.infer<typeof socialSchema>;
export type SocialProfile = z.infer<typeof socialProfileSchema>;

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Event title is required"),
    location: z.string().optional().default(""),
    description: z.string().optional().default(""),
    startDate: z.string().trim().min(1, "Start date is required"),
    startTime: z.string().optional().default(""),
    endDate: z.string().trim().min(1, "End date is required"),
    endTime: z.string().optional().default(""),
    allDay: z.boolean().default(false),
    reminder: z.enum(["none", "15min", "1hour", "1day"]).default("none"),
    organizerName: z.string().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || new Date(d.endDate) >= new Date(d.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
export type EventValue = z.infer<typeof eventSchema>;

export const feedbackQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["rating", "text", "yesno"]),
  label: z.string().trim().min(1, "Question text is required"),
  required: z.boolean(),
});
export const feedbackSchema = z.object({
  headline: z.string().trim().min(1, "Headline is required"),
  subheading: z.string().optional().default(""),
  questions: z.array(feedbackQuestionSchema).min(1, "Add at least one question"),
  allowAnonymous: z.boolean().default(true),
  thankYouMessage: z.string().optional().default(""),
});
export type FeedbackValue = z.infer<typeof feedbackSchema>;
export type FeedbackQuestion = z.infer<typeof feedbackQuestionSchema>;

export const menuItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Item name is required"),
  price: z.string().trim().min(1, "Price is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export const menuCategorySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Category name is required"),
  items: z.array(menuItemSchema).min(1, "Add at least one item"),
});
export const menuSchema = z.object({
  restaurantName: z.string().trim().min(1, "Restaurant name is required"),
  logoUrl: z.string().optional(),
  currency: z.string().trim().min(1, "Currency symbol is required"),
  categories: z.array(menuCategorySchema).min(1, "Add at least one category"),
  theme: z.enum(["classic", "modern", "rustic"]).default("classic"),
});
export type MenuValue = z.infer<typeof menuSchema>;
export type MenuCategory = z.infer<typeof menuCategorySchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;

export const playlistSchema = z.object({
  platform: z.enum(["spotify", "apple-music", "youtube", "soundcloud"]),
  playlistUrl: z.string().trim().min(1, "Playlist URL is required").url("Enter a valid URL"),
  title: z.string().optional().default(""),
  coverImage: z.string().optional(),
  trackCount: z.number().optional(),
});
export type PlaylistValue = z.infer<typeof playlistSchema>;

// ----------------------------------------------------------------------
// Registry glue
// ----------------------------------------------------------------------
export type QrTypeId =
  | "url"
  | "text"
  | "vcard"
  | "whatsapp"
  | "wifi"
  | "email"
  | "phone"
  | "sms"
  | "location"
  | "image"
  | "video"
  | "audio"
  | "social"
  | "event"
  | "feedback"
  | "menu"
  | "playlist";

export const QR_SCHEMAS: Record<QrTypeId, z.ZodTypeAny> = {
  url: urlSchema,
  text: textSchema,
  vcard: vcardSchema,
  whatsapp: whatsappSchema,
  wifi: wifiSchema,
  email: emailSchema,
  phone: phoneSchema,
  sms: smsSchema,
  location: locationSchema,
  image: imageSchema,
  video: videoSchema,
  audio: audioSchema,
  social: socialSchema,
  event: eventSchema,
  feedback: feedbackSchema,
  menu: menuSchema,
  playlist: playlistSchema,
};

export interface QrTypeDefinition {
  id: QrTypeId;
  label: string;
  icon: React.ElementType;
  description: string;
  category: "classic" | "media" | "business" | "engagement";
  popular?: boolean;
  FormComponent: React.ComponentType<{ value: any; onChange: (v: any) => void; errors?: Record<string, string> }>;
  PreviewComponent: React.ComponentType<{ value: any }>;
  /** Produces the encoded QR payload (what actually gets embedded in the QR image) */
  encode: (value: any) => string;
  defaultValue: any;
}

/** Result of validating a QR type's form value against its zod schema. */
export interface ValidationResult {
  success: boolean;
  /** Top-level field name -> first error message for that field. */
  errors: Record<string, string>;
}

/**
 * Validates `value` against the schema registered for `typeId`.
 * Errors are collapsed to one message per top-level field (the first
 * issue wins), which is what the form components render inline.
 */
export function validateQrValue(typeId: QrTypeId, value: unknown): ValidationResult {
  const schema = QR_SCHEMAS[typeId];
  const result = schema.safeParse(value);
  if (result.success) return { success: true, errors: {} };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = (issue.path[0] ?? "_root").toString();
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}
