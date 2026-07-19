// components/content/MediaContent.tsx
import { memo } from "react";
import { MessageSquare } from "lucide-react";

interface GalleryImage {
  url: string;
  caption?: string;
}

export const ImageContent = memo(function ImageContentBase({ data }: { data: Record<string, any> }) {
  const images: GalleryImage[] = Array.isArray(data.images) ? data.images : [];
  const title = data.title || "";
  const layout = data.layout || "grid";

  // Legacy single-image shape (older QR codes saved before the gallery format)
  const legacyImage = data.image || data.imageUrl || data.url || "";
  const legacyCaption = data.caption || "";

  if (images.length === 0 && !legacyImage) {
    return (
      <div className="p-5 sm:p-6">
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-400">
          No image available.
        </div>
      </div>
    );
  }

  if (images.length === 0 && legacyImage) {
    return (
      <div className="p-5 sm:p-6">
        <img src={legacyImage} alt={legacyCaption || "QR Image"} className="w-full rounded-xl border border-neutral-100 object-cover" />
        {legacyCaption && <p className="mt-3 text-center text-sm font-medium text-neutral-700">{legacyCaption}</p>}
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6">
      {title && <p className="mb-3 text-center text-sm font-semibold text-neutral-800">{title}</p>}

      {layout === "grid" && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((img, i) => (
            <GalleryItem key={i} img={img} />
          ))}
        </div>
      )}

      {layout === "stack" && (
        <div className="flex flex-col gap-3">
          {images.map((img, i) => (
            <GalleryItem key={i} img={img} />
          ))}
        </div>
      )}

      {layout === "carousel" && (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {images.map((img, i) => (
            <div key={i} className="min-w-[75%] shrink-0 snap-center">
              <GalleryItem img={img} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function GalleryItem({ img }: { img: GalleryImage }) {
  return (
    <div>
      <img
        src={img.url}
        alt={img.caption || "QR Image"}
        className="w-full rounded-xl border border-neutral-100 object-cover"
        loading="lazy"
      />
      {img.caption && <p className="mt-1 text-center text-xs text-neutral-600">{img.caption}</p>}
    </div>
  );
}

export const VideoContent = memo(function VideoContentBase({ data }: { data: Record<string, any> }) {
  const video = data.video || data.videoUrl || data.url || "";
  const caption = data.caption || data.title || "";
  return (
    <div className="p-5 sm:p-6">
      {video ? (
        <video controls className="w-full rounded-xl border border-neutral-100">
          <source src={video} />
        </video>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-400">
          No video available.
        </div>
      )}
      {caption && <p className="mt-3 text-center text-sm font-medium text-neutral-700">{caption}</p>}
    </div>
  );
});

export const AudioContent = memo(function AudioContentBase({ data }: { data: Record<string, any> }) {
  const audio = data.audio || data.audioUrl || data.url || "";
  const caption = data.caption || data.title || "";
  return (
    <div className="p-5 sm:p-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <MessageSquare className="h-7 w-7" style={{ color: "var(--accent)" }} />
      </div>
      {caption && <p className="mb-3 text-sm font-medium text-neutral-700">{caption}</p>}
      {audio ? (
        <audio controls className="w-full">
          <source src={audio} />
        </audio>
      ) : (
        <p className="text-sm text-neutral-400">No audio available.</p>
      )}
    </div>
  );
});

export default ImageContent;