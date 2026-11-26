"use client";

import { useId, useState, type ReactNode } from "react";
import { FiChevronDown, FiFileText, FiImage, FiPaperclip } from "react-icons/fi";
import { useT } from "@/i18n";
import { type AttachmentView } from "@/config/uploads";

/**
 * A package card's bottom row: its files folded behind one paperclip button with a count and a chevron (left), and the
 * package's action (right). Opening it lists the files below the row, each opening in a new tab. Files reach Plus users
 * only (the server sends none to anyone else); their links last an hour.
 */
export default function PackageAttachments({ attachments, packageName, chosen, action }: {
  attachments: AttachmentView[]; packageName: string; chosen: boolean; action?: ReactNode;
}) {
  const t = useT();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const files = attachments.filter((file) => file.url);
  if (!files.length && !action) return null;
  const muted = chosen ? "text-white/80" : "text-foreground/55";

  return <div className="mt-4">
    <div className="flex items-center justify-between gap-3">
      {files.length > 0 && <button type="button" aria-expanded={open} aria-controls={listId}
        aria-label={t.vendor.filesToggle(files.length, open)} title={t.vendor.attachments}
        onClick={() => setOpen(!open)}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${chosen
          ? `focus-visible:outline-white ${open ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"}`
          : `focus-visible:outline-(--positive-tertiary) ${open ? "bg-(--secondary) text-(--positive-tertiary)" : `${muted} hover:bg-(--secondary)`}`}`}>
        <FiPaperclip aria-hidden="true" />
        <span>{files.length}</span>
        <FiChevronDown aria-hidden="true" className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
    {open && <ul id={listId} aria-label={t.vendor.attachmentsAria(packageName)}
      className={`mt-2 overflow-hidden rounded-xl border text-sm ${chosen ? "border-white/20" : "border-(--tertiary) bg-white"}`}>
      {files.map((file, index) => {
        const Icon = file.kind === "pdf" ? FiFileText : FiImage;
        return <li key={index} className={index > 0 ? `border-t ${chosen ? "border-white/15" : "border-(--secondary)"}` : ""}>
          <a href={file.url!} target="_blank" rel="noopener noreferrer" aria-label={t.vendor.openFileAria(file.name, file.kind === "pdf")}
            className={`flex items-center gap-2.5 px-3 py-2.5 focus-visible:outline-2 focus-visible:-outline-offset-2 ${chosen
              ? "text-white hover:bg-white/10 focus-visible:outline-white" : "text-(--positive-tertiary) hover:bg-(--secondary)/60 focus-visible:outline-(--positive-tertiary)"}`}>
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
          </a>
        </li>;
      })}
    </ul>}
  </div>;
}
