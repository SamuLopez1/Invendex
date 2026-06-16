import { ImageIcon } from "lucide-react";
import { DEFAULT_PRODUCT_IMAGE, cn } from "@/lib/format";

export function ProductImage({
  src,
  alt,
  className,
  fallbackClassName
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const imageSrc = src || DEFAULT_PRODUCT_IMAGE;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/5 bg-black/40",
        className
      )}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={cn(
          "h-full w-full object-cover",
          !src && "opacity-45 grayscale",
          fallbackClassName
        )}
        referrerPolicy="no-referrer"
      />
      {!src ? (
        <div className="absolute inset-0 grid place-items-center bg-black/15">
          <ImageIcon className="h-5 w-5 text-zinc-500" />
        </div>
      ) : null}
    </div>
  );
}
