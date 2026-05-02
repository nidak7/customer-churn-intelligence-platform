const BADGE_STYLES = {
  online: "border-primary/30 bg-primary/10 text-primary shadow-signal",
  offline: "border-risk/35 bg-risk/10 text-rose-100",
  checking: "border-secondary/30 bg-secondary/10 text-sky-100"
};

const BADGE_LABELS = {
  online: "Backend Connected",
  offline: "Backend Offline",
  checking: "Checking Backend"
};

function StatusBadge({ status = "checking" }) {
  const tone = BADGE_STYLES[status] || BADGE_STYLES.checking;
  const label = BADGE_LABELS[status] || BADGE_LABELS.checking;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${tone}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      <span>{label}</span>
    </div>
  );
}

export default StatusBadge;
