"use client";
import { useT } from "@/i18n";

import { BsFileEarmarkPdf } from "react-icons/bs";
import { formatBytes, type AttachmentView } from "@/config/uploads";

/** A package's price lists and details (Plus users only; the server sends none to anyone else). Links last an hour. */
export default function PackageAttachments({ attachments, packageName }: { attachments: AttachmentView[]; packageName: string }) {
  const t = useT();
  const available = attachments.filter((file) => file.url);
  if (!available.length) return null;
  return <div className="mt-2">
    <p className="text-xs font-medium">{t.vendor.attachments}</p>
    <ul className="mt-2 flex flex-wrap gap-2" aria-label={t.vendor.attachmentsAria(packageName)}>
      {available.map((file, index) => <li key={index}>
        <a href={file.url!} target="_blank" rel="noopener noreferrer"
          className="flex max-w-56 items-center gap-2 rounded-lg border border-(--tertiary) bg-white p-1.5 pr-3 text-xs text-foreground hover:bg-(--secondary)"
          aria-label={t.vendor.openFileAria(file.name, file.kind === "pdf")}>
          {file.kind === "image"
            // Signed Storage links don't need Next.js image optimization.
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={file.url!} alt="" className="size-10 shrink-0 rounded object-cover" />
            : <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded bg-(--secondary) text-lg text-(--positive-tertiary)"><BsFileEarmarkPdf /></span>}
          <span className="min-w-0">
            <span className="block truncate font-medium">{file.name}</span>
            <span className="text-foreground/60">{file.kind === "pdf" ? "PDF" : t.vendor.image}{file.size ? ` · ${formatBytes(file.size)}` : ""}</span>
          </span>
        </a>
      </li>)}
    </ul>
  </div>;
}
