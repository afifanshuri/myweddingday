"use client";

type CustomDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function CustomDialog({
  open,
  onClose,
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

          <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
