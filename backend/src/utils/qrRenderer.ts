import QRCodeLib from "qrcode";
import { IQRDesign } from "@models/QRCode.model";

export async function renderQrPngDataUrl(content: string, design?: Partial<IQRDesign>): Promise<string> {
  return QRCodeLib.toDataURL(content, {
    margin: 2,
    width: 512,
    color: {
      dark: design?.fgColor || "#000000",
      light: design?.bgColor || "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

export async function renderQrSvg(content: string, design?: Partial<IQRDesign>): Promise<string> {
  return QRCodeLib.toString(content, {
    type: "svg",
    margin: 2,
    color: {
      dark: design?.fgColor || "#000000",
      light: design?.bgColor || "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Builds the raw payload encoded into the QR image based on type.
 * For dynamic QRs this is always the short redirect URL (so destination can change without reprinting).
 */
export function buildQrPayload(params: {
  isDynamic: boolean;
  shortUrl: string;
  type: string;
  destination: string;
}): string {
  if (params.isDynamic) return params.shortUrl;

  switch (params.type) {
    case "whatsapp":
      return `https://wa.me/${params.destination.replace(/\D/g, "")}`;
    case "phone":
      return `tel:${params.destination}`;
    case "sms":
      return `sms:${params.destination}`;
    case "email":
      return `mailto:${params.destination}`;
    default:
      return params.destination;
  }
}
