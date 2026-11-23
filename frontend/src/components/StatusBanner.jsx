const TONE_STYLES = {
  info: "border-secondary/20 bg-secondary/10 text-primary",
  success: "border-primary/20 bg-primary/10 text-textPrimary",
  warning: "border-warning/25 bg-warning/10 text-[#8a6d2f]",
  error: "border-risk/25 bg-risk/10 text-[#a2553f]"
};

function StatusBanner({ tone = "info", message, loading = false }) {
  if (!message && !loading) {
    return null;
  }

  const style = TONE_STYLES[tone] || TONE_STYLES.info;

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm shadow-panel ${style}`}>
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-current" />
        <div className="min-w-0">
          {loading && <p className="text-[11px] uppercase tracking-wide opacity-80">Loading</p>}
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}

export default StatusBanner;
