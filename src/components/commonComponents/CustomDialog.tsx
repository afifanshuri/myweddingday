"use client";
import MainButton from "@/components/commonComponents/MainButton";


type CustomDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  busy?: boolean;
  title: string;
  children: React.ReactNode;
};

export default function CustomDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  busy = false,
}: CustomDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => { if (!busy) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-busy={busy}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold">{title}</h2>

        <div>{children}</div>

        <div className="mt-6 flex justify-end gap-2">
          <MainButton variant="secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </MainButton>

          <MainButton
            type="button"
            disabled={busy}
            onClick={() => {
              if (onConfirm) onConfirm();
              else onClose();
            }}
          >
            {busy ? "Saving..." : "Confirm"}
          </MainButton>
        </div>
      </div>
    </div>
  );
}
