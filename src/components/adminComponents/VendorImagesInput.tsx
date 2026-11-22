"use client";

import { useEffect, useRef, useState } from "react";
import MainButton from "@/components/commonComponents/MainButton";
import { MAX_VENDOR_IMAGES, MAX_VENDOR_IMAGE_BYTES } from "@/config/vendorImages";

function ImagePreview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  // Blob previews do not need Next.js image optimization.
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={imageRef} alt={file.name} className="h-24 w-full rounded-lg object-cover" />;
}

export default function VendorImagesInput({ files, onChange, existing = [], onRemoveExisting }: {
  files: File[];
  onChange: (files: File[]) => void;
  /** Saved images when editing; removing one deletes it when the vendor is saved. */
  existing?: { path: string; url: string | null }[];
  onRemoveExisting?: (path: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const room = MAX_VENDOR_IMAGES - existing.length;
  return (
    <div>
      <label htmlFor="vendor-images" className="mb-2 block text-sm">Vendor images (optional)</label>
      <p id="vendor-images-help" className="mb-3 text-xs font-normal text-foreground/60">
        Up to {MAX_VENDOR_IMAGES} JPEG, PNG or WebP images, 5 MB each. These appear on vendor cards. Keep all vendor and package uploads under 25 MB combined.
      </p>
      <input
        id="vendor-images" type="file" multiple accept="image/jpeg,image/png,image/webp"
        aria-describedby="vendor-images-help vendor-images-error" aria-invalid={!!error}
        className="w-full rounded-lg border border-(--tertiary) text-sm"
        onChange={(event) => {
          const added = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length + added.length > room) {
            setError(existing.length ? `A vendor can have at most ${MAX_VENDOR_IMAGES} images. Remove a saved image to add more.` : `Choose at most ${MAX_VENDOR_IMAGES} images.`);
          } else if (added.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > MAX_VENDOR_IMAGE_BYTES)) {
            setError("Choose JPEG, PNG or WebP images up to 5 MB each.");
          } else {
            setError(null);
            onChange([...files, ...added]);
          }
        }}
      />
      <p id="vendor-images-error" role={error ? "alert" : undefined} className="mt-2 text-sm text-red-600">{error}</p>
      {existing.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-foreground/60">Saved images ({existing.length} of {MAX_VENDOR_IMAGES})</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {existing.map((image, index) => (
              <div key={image.path} className="min-w-0">
                {image.url
                  // Signed Storage links are already sized for cards; no Next.js optimization needed.
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={image.url} alt={`Saved image ${index + 1}`} className="h-24 w-full rounded-lg object-cover" />
                  : <div className="flex h-24 items-center justify-center rounded-lg bg-(--secondary) text-xs">Preview unavailable</div>}
                <MainButton variant="ghost" size="small" className="mt-1 w-full text-xs" aria-label={`Remove saved image ${index + 1}`}
                  onClick={() => { onRemoveExisting?.(image.path); setError(null); }}>
                  Remove
                </MainButton>
              </div>
            ))}
          </div>
        </div>
      )}
      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((file, index) => (
            <div key={index} className="min-w-0">
              <ImagePreview file={file} />
              <MainButton variant="ghost" size="small" className="mt-1 w-full text-xs"
                aria-label={`Remove image ${index + 1}: ${file.name}`}
                onClick={() => { onChange(files.filter((_, i) => i !== index)); setError(null); }}>
                Remove
              </MainButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
