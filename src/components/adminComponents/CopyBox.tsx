"use client";

import { useId, useRef, useState } from "react";
import MainButton from "@/components/commonComponents/MainButton";

/** Read-only text (a link or a message to send) with a Copy button. */
export default function CopyBox({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const [copied, setCopied] = useState<"yes" | "failed" | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied("yes");
    } catch {
      // Clipboard access can be blocked; select the text so it can be copied by hand.
      field.current?.select();
      setCopied("failed");
    }
  }

  const className = "w-full rounded-lg border border-(--tertiary) bg-(--background) p-2 text-sm";
  return <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-xs font-medium">{label}</label>
      <MainButton size="small" variant="secondary" onClick={copy}>{copied === "yes" ? "Copied" : "Copy"}</MainButton>
    </div>
    {multiline
      ? <textarea id={id} ref={field} readOnly value={value} rows={Math.min(12, value.split("\n").length + 1)} className={`${className} whitespace-pre-wrap`} onFocus={(event) => event.target.select()} />
      : <input id={id} ref={field} readOnly value={value} className={`${className} font-mono text-xs`} onFocus={(event) => event.target.select()} />}
    <p aria-live="polite" className="text-xs text-foreground/60">{copied === "failed" ? "Couldn't copy automatically. The text is selected: press Ctrl+C (or ⌘C)." : ""}</p>
  </div>;
}
