function ActionButton({ label, onClick, disabled = false, busy = false, tone = "secondary" }) {
  const toneStyles =
    tone === "primary"
      ? "bg-primary text-slate-950 shadow-signal hover:brightness-110"
      : "border glass-border bg-white/[0.03] text-textPrimary hover:border-primary/35 hover:bg-white/[0.05]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${toneStyles}`}
    >
      {busy ? "Working..." : label}
    </button>
  );
}

function UploadPanel({
  backendStatus,
  selectedFile,
  setSelectedFile,
  onUpload,
  onTrain,
  onExport,
  loading,
  metadata
}) {
  const backendOffline = backendStatus !== "online";

  return (
    <section className="panel-hover rounded-[22px] glass-border bg-surface px-4 py-4 shadow-panel backdrop-blur">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.26em] text-textSecondary">Action bar</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-full border glass-border bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-textPrimary transition hover:border-primary/35 hover:bg-white/[0.05]">
              Choose CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              />
            </label>
            <ActionButton
              label="Upload CSV"
              onClick={onUpload}
              busy={loading.upload}
              disabled={backendOffline || !selectedFile}
              tone="primary"
            />
            <ActionButton
              label="Train Model"
              onClick={onTrain}
              busy={loading.train}
              disabled={backendOffline}
            />
            <ActionButton
              label="Export CSV"
              onClick={() => onExport("csv")}
              busy={loading.export === "csv"}
              disabled={backendOffline}
            />
            <ActionButton
              label="Export PDF"
              onClick={() => onExport("pdf")}
              busy={loading.export === "pdf"}
              disabled={backendOffline}
            />
          </div>
          <p className="mt-3 truncate text-sm text-textSecondary">
            {selectedFile
              ? `Selected file: ${selectedFile.name}`
              : "The full Telco churn sample is preloaded. Upload another Telco-format CSV to replace it."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 2xl:min-w-[420px]">
          <div className="rounded-2xl glass-border bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-textSecondary">Rows cleaned</p>
            <p className="mt-2 text-lg font-semibold text-textPrimary">{metadata?.cleaned_rows ?? 0}</p>
          </div>
          <div className="rounded-2xl glass-border bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-textSecondary">Duplicate IDs</p>
            <p className="mt-2 text-lg font-semibold text-textPrimary">{metadata?.duplicate_customer_ids_removed ?? 0}</p>
          </div>
          <div className="rounded-2xl glass-border bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-textSecondary">Missing fixed</p>
            <p className="mt-2 text-lg font-semibold text-textPrimary">{metadata?.missing_values_filled ?? 0}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UploadPanel;
