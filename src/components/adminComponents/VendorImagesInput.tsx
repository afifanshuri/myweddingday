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

export default function VendorImagesInput({ files, onChange }: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
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
          if (files.length + added.length > MAX_VENDOR_IMAGES) {
            setError(`Choose at most ${MAX_VENDOR_IMAGES} images.`);
          } else if (added.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > MAX_VENDOR_IMAGE_BYTES)) {
            setError("Choose JPEG, PNG or WebP images up to 5 MB each.");
          } else {
            setError(null);
            onChange([...files, ...added]);
          }
        }}
      />
      <p id="vendor-images-error" role={error ? "alert" : undefined} className="mt-2 text-sm text-red-600">{error}</p>
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
