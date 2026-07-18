"use client";

// Extracted from QRDesignDialog so StyledQrPreview and DownloadPopover
// can render the exact same frame markup used in the design dialog.
export default function FramedPreview({
  frame, frameColor, frameText, bgColor, children,
}: { frame: string; frameColor: string; frameText: string; bgColor: string; children: React.ReactNode }) {
  const showTopBar = frame === "browser";
  const showBottomLabel = frame === "scan-me" || frame === "pill-bottom" || frame === "polaroid";
  const showBadgeLabel = frame === "badge";
  const showRibbon = frame === "ribbon";
  const showTicketStub = frame === "ticket";

  const outerClass =
    frame === "none" ? "inline-flex flex-col items-center" :
    frame === "polaroid" ? "inline-flex flex-col items-center bg-white p-3 pb-6 shadow-lg rotate-[-1deg]" :
    frame === "neon-glow" ? "inline-flex flex-col items-center rounded-2xl" :
    frame === "badge" ? "inline-flex flex-col items-center gap-2 p-4 rounded-3xl border-4" :
    "inline-flex flex-col items-center rounded-2xl overflow-hidden border-2";

  const outerStyle: React.CSSProperties =
    frame === "none" ? {} :
    frame === "polaroid" ? { boxShadow: "0 8px 20px rgba(0,0,0,0.15)" } :
    frame === "neon-glow" ? {
      border: `2px solid ${frameColor}`,
      boxShadow: `0 0 12px ${frameColor}99, 0 0 28px ${frameColor}55, inset 0 0 10px ${frameColor}33`,
    } :
    { borderColor: frameColor };

 const qrSlotClass =
  frame === "polaroid"
    ? "p-0"
    : frame === "ticket"
    ? "relative flex items-stretch border-2 border-dashed rounded-xl overflow-hidden"
    : frame === "ribbon"
    ? "relative p-0 rounded-xl border"
    : frame === "rounded"
    ? "p-0 rounded-2xl border-2"
    : "p-0";

  const qrSlotStyle: React.CSSProperties =
    frame === "ticket" || frame === "ribbon" || frame === "rounded"
      ? { borderColor: frameColor, backgroundColor: bgColor }
      : { backgroundColor: bgColor };

  return (
    <div className={outerClass} style={outerStyle}>
      {showTopBar && (
        <div className="w-full flex items-center gap-1.5 px-3 py-2" style={{ backgroundColor: frameColor }}>
          <span className="w-2.5 h-2.5 rounded-full bg-white/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/60" />
          <div className="ml-2 flex-1 h-4 rounded bg-white/25 text-[9px] text-white/90 flex items-center px-2 truncate">
            {frameText.toLowerCase()}
          </div>
        </div>
      )}

      <div className={qrSlotClass} style={qrSlotStyle}>
        {children}

        {showRibbon && (
          <div className="absolute -top-2 -right-2 px-3 py-1 text-[10px] font-bold text-white rounded-md shadow-md rotate-3" style={{ backgroundColor: frameColor }}>
            {frameText}
          </div>
        )}

        {showTicketStub && (
          <>
            <div className="flex items-center justify-center px-2 text-[10px] font-bold text-white tracking-widest" style={{ backgroundColor: frameColor, writingMode: "vertical-rl" }}>
              {frameText}
            </div>
            <div className="absolute left-[calc(100%-2.25rem)] top-0 bottom-0 flex flex-col justify-between py-1 pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-background -ml-[3px]" />
              ))}
            </div>
          </>
        )}
      </div>

      {showBottomLabel && (
        <div
          className={frame === "polaroid" ? "mt-2 text-[11px] font-medium text-gray-700" : "w-full py-2 text-center text-[11px] font-bold tracking-widest uppercase"}
          style={frame === "polaroid" ? { fontFamily: "cursive" } : { backgroundColor: frameColor, color: "#fff" }}
        >
          {frameText}
        </div>
      )}

      {showBadgeLabel && (
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: frameColor }}>{frameText}</span>
      )}
    </div>
  );
}