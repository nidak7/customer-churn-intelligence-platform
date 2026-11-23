import StatusBadge from "./StatusBadge";

function Header({ backendStatus }) {
  return (
    <header className="flex flex-col gap-3 rounded-lg glass-border bg-surface px-4 py-3 shadow-panel md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
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
