import "@/css/wedding-planner-loading.css";

export default function Loading() {
  return (
    <div className="planner-loading" role="status" aria-label="Loading wedding planner">
      <span className="planner-loading-spinner" aria-hidden="true" />
    </div>
  );
}
