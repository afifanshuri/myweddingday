type LoadingScreenProps = {
  label?: string;
  /** Cover the page with the background colour. Turn off to keep the page visible behind the spinner, e.g. while a list reloads under its search form. */
  backdrop?: boolean;
};

/** One loop of the knot logo, as a rounded band rotated onto a diagonal. `pathLength` lets the trace animation work in percentages. */
function KnotLoop({ angle, color, className }: { angle: number; color: string; className: string }) {
  return (
    <rect pathLength={100} x={-45} y={-15} width={90} height={30} rx={15}
      stroke={color} transform={`translate(50 50) rotate(${angle})`} className={className} />
  );
}

/** The knot logo drawing itself in and unwinding again (keyframes in globals.css). */
function KnotLoader() {
  return (
    <svg viewBox="0 0 100 100" fill="none" strokeWidth={14} aria-hidden="true" className="size-16">
      <defs>
        {/* Where the rose loop crosses over the plum one, so the loops weave like the logo. */}
        <clipPath id="knot-loader-weave">
          <circle cx={28.8} cy={50} r={11} />
          <circle cx={71.2} cy={50} r={11} />
        </clipPath>
      </defs>
      <KnotLoop angle={-45} color="var(--positive-secondary)" className="knot-trace knot-trace-delayed" />
      <KnotLoop angle={45} color="var(--positive-tertiary)" className="knot-trace" />
      {/* Clip on an unrotated group: on the rect itself the clip would rotate with the loop. */}
      <g clipPath="url(#knot-loader-weave)">
        <KnotLoop angle={-45} color="var(--positive-secondary)" className="knot-trace knot-trace-delayed" />
      </g>
    </svg>
  );
}

/** Animated logo and message centred in the middle of the screen. Used for every loading state. */
export default function LoadingScreen({ label = "Loading…", backdrop = true }: LoadingScreenProps) {
  return (
    <div role="status" aria-live="polite"
      className={`fixed inset-0 z-50 grid place-items-center p-6 ${backdrop ? "bg-background" : "pointer-events-none"}`}>
      <div className="flex flex-col items-center gap-4 text-center text-sm text-(--positive-tertiary)">
        <KnotLoader />
        <p>{label}</p>
      </div>
    </div>
  );
}
