import EmptyState from "./EmptyState";

function ModelPanel({ modelState, isTraining, backendStatus }) {
  const metrics = modelState?.metrics;
  const confusionMatrix = metrics?.confusion_matrix || [[0, 0], [0, 0]];
  const probabilityBands = modelState?.probability_bands || [];
  const maxImportance = Math.max(...(modelState?.top_features || []).map((f) => f?.importance || 0), 1);

  return (
    <section className="rounded-lg glass-border bg-surface p-4 shadow-panel">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-textSecondary">Model results</p>
        <h3 className="mt-2 text-lg font-semibold text-textPrimary">Logistic Regression model</h3>
      </div>

      {isTraining ? (
        <div className="mt-4 space-y-3">
          <div className="h-20 animate-pulse rounded-lg bg-elevated" />
          <div className="h-36 animate-pulse rounded-lg bg-elevated" />
        </div>
      ) : metrics ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wide text-textSecondary">Accuracy</p>
              <p className="mt-2 text-xl font-semibold text-textPrimary">{(metrics?.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-line bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wide text-textSecondary">Precision</p>
              <p className="mt-2 text-xl font-semibold text-textPrimary">{(metrics?.precision * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-line bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wide text-textSecondary">Recall</p>
              <p className="mt-2 text-xl font-semibold text-textPrimary">{(metrics?.recall * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wide text-textSecondary">AUC</p>
              <p className="mt-2 text-xl font-semibold text-textPrimary">{(metrics?.auc ?? 0).toFixed(3)}</p>
            </div>
            <div className="rounded-lg border border-line bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wide text-textSecondary">Top 30% capture</p>
              <p className="mt-2 text-xl font-semibold text-textPrimary">{((metrics?.top_30_capture ?? 0) * 100).toFixed(1)}%</p>
              <p className="mt-1 text-xs text-textSecondary">of churners sit in the riskiest 30%</p>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-elevated p-4">
            <p className="text-[11px] uppercase tracking-wide text-textSecondary">Top 10 influencing features</p>
            <div className="mt-3 space-y-3">
              {(modelState?.top_features || []).slice(0, 10).map((feature) => (
                <div key={feature?.feature}>
                  <div className="flex items-center justify-between gap-3 text-sm text-textPrimary">
                    <span>{feature?.feature}</span>
                    <span>{(feature?.importance || 0).toFixed(2)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-line">
                    <div
                      className={`h-2 rounded-full ${
                        feature?.direction?.includes("Increase")
                          ? "bg-risk"
                          : "bg-secondary"
                      }`}
                      style={{ width: `${Math.min(Math.max(((feature?.importance || 0) / maxImportance) * 100, 6), 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-textSecondary">{feature?.direction}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-elevated p-4">
              <p className="text-[11px] uppercase tracking-wide text-textSecondary">Confusion matrix</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {confusionMatrix.flatMap((row, rowIndex) =>
                  row.map((value, columnIndex) => (
                    <div key={`${rowIndex}-${columnIndex}`} className="rounded-md bg-elevated p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-textSecondary">
                        {rowIndex === 0 ? "Actual No" : "Actual Yes"}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-textSecondary">
                        {columnIndex === 0 ? "Pred No" : "Pred Yes"}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-textPrimary">{value}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-line bg-elevated p-4">
              <p className="text-[11px] uppercase tracking-wide text-textSecondary">Risk distribution</p>
              <div className="mt-3 space-y-3">
                {probabilityBands.length > 0 ? (
                  probabilityBands.map((band) => (
                    <div key={band?.threshold} className="flex items-center justify-between gap-3 text-sm text-textPrimary">
                      <span>{band?.threshold}</span>
                      <span className="rounded-full border border-line bg-elevated px-2.5 py-1 text-xs text-textPrimary">
                        {band?.count ?? 0} customers · {(band?.actual_churn_rate ?? 0).toFixed(1)}% churned
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-textSecondary">Train the model to populate low, medium, and high-risk buckets.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title={backendStatus === "online" ? "Model not trained yet" : "Model unavailable"}
            message={
              backendStatus === "online"
                ? "Use the Train Model action to generate accuracy, precision, recall, confusion matrix, and feature influence."
                : "Backend is offline. Start the FastAPI server to train and inspect the churn model."
            }
            compact
          />
        </div>
      )}
    </section>
  );
}

export default ModelPanel;
