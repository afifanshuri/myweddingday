export default function Loading() {
  return <div role="status" className="flex min-h-screen items-center justify-center">
    <span aria-hidden="true" className="size-8 animate-spin rounded-full border-2 border-(--tertiary) border-t-(--positive-tertiary) motion-reduce:animate-none" />
    <span className="sr-only">Loading…</span>
  </div>;
}
