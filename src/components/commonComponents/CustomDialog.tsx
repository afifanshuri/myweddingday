"use client";

type CustomDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: React.ReactNode;
};

export default function CustomDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
}: CustomDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold">{title}</h2>

        <div>{children}</div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className="rounded-md bg-(--positive) px-4 py-2 text-white hover:brightness-90"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
