const TONE_STYLES = {
  info: "border-secondary/20 bg-secondary/10 text-sky-100",
  success: "border-primary/20 bg-primary/10 text-lime-100",
  warning: "border-warning/25 bg-warning/10 text-amber-50",
  error: "border-risk/25 bg-risk/10 text-rose-100"
};

function StatusBanner({ tone = "info", message, loading = false }) {
  if (!message && !loading) {
    return null;
  }

  const style = TONE_STYLES[tone] || TONE_STYLES.info;

  return (
    <div className={`rounded-[18px] border px-4 py-3 text-sm shadow-panel ${style}`}>
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-current" />
        <div className="min-w-0">
          {loading && <p className="text-[11px] uppercase tracking-[0.22em] opacity-80">Loading</p>}
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}

export default StatusBanner;
