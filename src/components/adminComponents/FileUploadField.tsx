"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BsFileEarmarkPdf } from "react-icons/bs";
import MainButton from "@/components/commonComponents/MainButton";
import { UPLOAD_KINDS, UPLOAD_TYPES, formatBytes, type UploadKind } from "@/config/uploads";
import { contentTypeOf, uploadFile, type UploadItem } from "@/services/api/uploads";
import { useT, type Messages } from "@/i18n";

type Props = {
  label: string;
  help: string;
  kind: UploadKind;
  max: number;
  items: UploadItem[];
  /** Receives an updater, because uploads finish at different times and must apply to the latest list. */
  onChange: (update: (items: UploadItem[]) => UploadItem[]) => void;
  /** Where to ask for upload links: the admin endpoint, or the vendor's submission link endpoint. */
  endpoint: string;
};

/**
 * Files upload as soon as they're picked, each with its own progress, Remove and Retry. Saved files show with Remove.
 * The form saves only references, so it must wait until every upload is done (see `uploadsBlockingSave`).
 */
export default function FileUploadField({ label, help, kind, max, items, onChange, endpoint }: Props) {
  const id = useId();
  const t = useT();
  const u = t.vendorForm.upload;
  const [error, setError] = useState<string | null>(null);
  const uploads = useRef(new Map<string, AbortController>());
  const rules = UPLOAD_KINDS[kind];
  const accept = rules.types.join(",");

  // Cancel uploads still running when the field goes away.
  useEffect(() => {
    const running = uploads.current;
    return () => running.forEach((controller) => controller.abort());
  }, []);

  const patch = (key: string, change: Partial<UploadItem>) => onChange((list) => list.map((item) => item.key === key ? { ...item, ...change } : item));

  function start(item: UploadItem, file: File) {
    const controller = new AbortController();
    uploads.current.set(item.key, controller);
    uploadFile({ file, kind, endpoint, signal: controller.signal, onProgress: (progress) => patch(item.key, { progress }) })
      .then((uploadId) => patch(item.key, { status: "done", progress: 1, uploadId, error: undefined }))
      .catch((cause: Error) => { if (cause.name !== "AbortError") patch(item.key, { status: "error", error: cause.message }); })
      .finally(() => uploads.current.delete(item.key));
  }

  function add(files: File[]) {
    if (items.length + files.length > max) {
      setError(u.tooMany(max));
      return;
    }
    const wrongType = files.find((file) => { const type = contentTypeOf(file); return !type || !rules.types.includes(type); });
    if (wrongType) {
      setError(u.wrongType(wrongType.name, kind === "vendorImage"));
      return;
    }
    const tooBig = files.find((file) => !file.size || file.size > rules.maxBytes);
    if (tooBig) {
      setError(tooBig.size ? u.tooBig(tooBig.name, rules.maxBytes / 1024 / 1024) : u.empty(tooBig.name));
      return;
    }
    setError(null);
    const added = files.map((file): UploadItem => {
      const type = contentTypeOf(file)!;
      return { key: crypto.randomUUID(), name: file.name, size: file.size, kind: UPLOAD_TYPES[type].kind, status: "uploading", progress: 0,
        file, previewUrl: UPLOAD_TYPES[type].kind === "image" ? URL.createObjectURL(file) : undefined };
    });
    onChange((list) => [...list, ...added]);
    added.forEach((item) => start(item, item.file!));
  }

  function remove(item: UploadItem) {
    uploads.current.get(item.key)?.abort();
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    onChange((list) => list.filter((entry) => entry.key !== item.key));
    setError(null);
  }

  function retry(item: UploadItem) {
    if (!item.file) return;
    patch(item.key, { status: "uploading", progress: 0, error: undefined });
    start(item, item.file);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm">{label}</label>
      <p id={`${id}-help`} className="mb-3 text-xs font-normal text-foreground/60">{help}</p>
      <input id={id} type="file" multiple={max > 1} accept={accept} disabled={items.length >= max}
        aria-describedby={`${id}-help ${id}-error`} aria-invalid={!!error}
        className="w-full cursor-pointer rounded-xl border border-dashed border-(--fourth) bg-(--background) text-sm disabled:cursor-not-allowed disabled:opacity-50"
        onChange={(event) => { add(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      <p id={`${id}-error`} role={error ? "alert" : undefined} className="mt-2 text-sm text-red-600">{error}</p>
      {items.length > 0 && <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const preview = item.previewUrl ?? item.url;
          return <li key={item.key} className={`flex min-w-0 items-center gap-3 rounded-xl border p-2 ${item.status === "error" ? "border-red-200 bg-red-50" : "border-(--tertiary) bg-white"}`}>
            {item.kind === "image" && preview
              // Local previews and signed Storage links don't need Next.js image optimization.
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={preview} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
              : <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-(--secondary) text-2xl text-(--positive-tertiary)">
                {item.kind === "pdf" ? <BsFileEarmarkPdf /> : "?"}
              </span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium" title={item.name}>{item.name}</p>
              <p className="text-xs text-foreground/60" aria-live="polite">
                {item.status === "uploading" ? u.uploading(Math.round(item.progress * 100))
                  : item.status === "error" ? <span className="text-red-700">{item.error ? t.errors[item.error] ?? item.error : u.failed}</span>
                    : <>{formatBytes(item.size)} · {item.path ? u.saved : u.uploaded}</>}
              </p>
              {item.status === "uploading" && <div className="mt-1 h-1 overflow-hidden rounded-full bg-(--secondary)">
                <div className="h-full bg-(--positive-tertiary) transition-[width] motion-reduce:transition-none" style={{ width: `${Math.round(item.progress * 100)}%` }} />
              </div>}
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              {item.status === "error" && item.file && <MainButton size="small" variant="secondary" className="text-xs" onClick={() => retry(item)}>{u.retry}</MainButton>}
              <MainButton size="small" variant="ghost" className="text-xs" aria-label={u.removeAria(item.name)} onClick={() => remove(item)}>{u.remove}</MainButton>
            </div>
          </li>;
        })}
      </ul>}
      <p className="mt-2 text-xs text-foreground/50">{u.count(items.length, max)}</p>
    </div>
  );
}

/** Why the form can't be saved yet because of its files, or null when every file is ready. */
export function uploadsBlockingSave(items: UploadItem[], messages: Messages["vendorForm"]["upload"]) {
  const uploading = items.filter((item) => item.status === "uploading").length;
  if (uploading) return messages.waiting(uploading);
  if (items.some((item) => item.status === "error")) return messages.someFailed;
  return null;
}
