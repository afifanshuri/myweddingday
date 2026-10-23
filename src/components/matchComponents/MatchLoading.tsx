import "@/css/match-loading.css";

export default function MatchLoading() {
  return (
    <div className="match-loading" role="status">
      <div className="match-loading-content">
        <span className="match-loading-spinner" aria-hidden="true" />
        <p>Finding the best vendors for you.</p>
      </div>
    </div>
  );
}
