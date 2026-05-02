import StatusBadge from "./StatusBadge";

function Header({ backendStatus }) {
  return (
    <header className="panel-hover flex flex-col gap-3 rounded-[20px] glass-border bg-surface px-4 py-3 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary">Churn Intelligence Lab</p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="truncate font-display text-xl text-textPrimary md:text-2xl">Customer Churn Intelligence</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={backendStatus} />
      </div>
    </header>
  );
}

export default Header;
