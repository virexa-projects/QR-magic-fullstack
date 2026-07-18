"use client";

import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { QRDesign } from "@/lib/mockData";
import FramedPreview from "@/components/qr/FramedPreview";

interface Props {
  value: string;
  design: QRDesign;
  size?: number;
}

export default function StyledQrPreview({
  value,
  design,
  size = 64,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = "";

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: "svg", // explicit, matches Step3Qr's own preview instance
      data: value,
      image: design.logo || undefined,
      qrOptions: {
        errorCorrectionLevel: design.errorCorrectionLevel || "Q",
      },
      dotsOptions: {
        color: design.fgColor,
        type: design.dotStyle as any,
        gradient: design.useGradient
          ? {
              type: design.gradientType || "linear",
              rotation: ((design.gradientRotation || 0) * Math.PI) / 180,
              colorStops:
                design.gradientColors?.map((c, index) => ({
                  offset: index / ((design.gradientColors?.length || 2) - 1),
                  color: c,
                })) || [],
            }
          : undefined,
      },
      cornersSquareOptions: {
        type: design.cornersSquareStyle as any,
        color: design.eyeColor || design.fgColor,
      },
      cornersDotOptions: {
        type: design.cornersDotStyle as any,
        color: design.eyeColor || design.fgColor,
      },
      backgroundOptions: {
        color: design.bgColor || "#FFFFFF",
      },
      imageOptions: {
        hideBackgroundDots: design.hideBackgroundDots ?? true,
        imageSize: design.logoSize || 0.25,
        margin: 2,
      },
    });

    qr.append(ref.current);
  }, [value, design, size]);

  return (
    <FramedPreview
      frame={design.frame ?? "none"}
      frameColor={design.frameColor || design.fgColor}
      frameText={design.frameText ?? "SCAN ME"}
      bgColor={design.bgColor || "#FFFFFF"}
    >
      <div ref={ref} style={{ width: size, height: size }} />
    </FramedPreview>
  );
}