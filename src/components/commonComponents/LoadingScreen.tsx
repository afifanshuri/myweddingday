type LoadingScreenProps = {
  label?: string;
  /** Cover the page with the background colour. Turn off to keep the page visible behind the spinner, e.g. while a list reloads under its search form. */
  backdrop?: boolean;
};

/** Spinner and message centred in the middle of the screen. Used for every loading state. */
export default function LoadingScreen({ label = "Loading…", backdrop = true }: LoadingScreenProps) {
  return (
    <div role="status" aria-live="polite"
      className={`fixed inset-0 z-50 grid place-items-center p-6 ${backdrop ? "bg-background" : "pointer-events-none"}`}>
      <div className="flex flex-col items-center gap-4 text-center text-sm text-(--positive-tertiary)">
        <span aria-hidden="true"
          className="size-10 animate-spin rounded-full border-3 border-(--tertiary) border-t-(--positive-tertiary) motion-reduce:animate-[spin_3s_linear_infinite]" />
        <p>{label}</p>
      </div>
    </div>
  );
}
