"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { useT } from "@/i18n";

/**
 * A vendor's photos, one at a time, over the page. A native modal dialog, so focus stays inside and Escape closes it.
 * Arrow keys move between photos.
 */
export default function PhotoViewer({ urls, index, name, onIndex, onClose }: {
  urls: string[]; index: number | null; name: string; onIndex: (index: number) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const t = useT();
  const open = index !== null;
  const count = urls.length;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const step = (by: number) => { if (index !== null) onIndex((index + by + count) % count); };

  return <dialog ref={dialog} aria-label={name} onClose={onClose}
    onKeyDown={(event) => { if (event.key === "ArrowLeft") step(-1); if (event.key === "ArrowRight") step(1); }}
    onClick={(event) => { if (event.target === dialog.current) onClose(); }}
    className="m-auto h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/85">
    {open && <div className="flex h-full flex-col p-3 text-white sm:p-6" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-white/80">{t.vendor.photoOf(index + 1, count)}</p>
        <button type="button" onClick={onClose} aria-label={t.vendor.closePhotos} autoFocus
          className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">
          <FiX aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="relative mt-3 min-h-0 flex-1">
        <Image src={urls[index]} alt="" fill unoptimized sizes="100vw" className="object-contain" />
      </div>
      {count > 1 && <div className="mt-3 flex justify-center gap-3">
        <button type="button" onClick={() => step(-1)} aria-label={t.vendor.previousPhoto}
          className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">
          <FiChevronLeft aria-hidden="true" className="size-6" />
        </button>
        <button type="button" onClick={() => step(1)} aria-label={t.vendor.nextPhoto}
          className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">
          <FiChevronRight aria-hidden="true" className="size-6" />
        </button>
      </div>}
    </div>}
  </dialog>;
}
