import { formatMetric } from "../utils/formatters";
import EmptyState from "./EmptyState";

function findTopSegment(list = []) {
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }
  return [...list].sort((a, b) => (b?.churn_rate || 0) - (a?.churn_rate || 0))[0];
}

function InsightPanel({ summary, insights, charts, isLoading, isEmpty }) {
  const topRisk = insights?.high_risk_segments?.[0] || insights?.insight_cards?.[0] || null;
  const fallbackDriver = findTopSegment(charts?.churn_by_payment_method) || findTopSegment(charts?.churn_by_contract);
  const keyDrivers = insights?.key_drivers || {};
  const revenueAtRisk = summary?.kpis?.revenue_at_risk ?? 0;
  const recommendations = (insights?.recommendations || []).slice(0, 3);
  const analystNotes = (insights?.insight_cards || []).slice(0, 4);

  return (
    <section className="rounded-lg glass-border bg-surface p-4 shadow-panel">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-textSecondary">Insights</p>
        <h3 className="mt-2 text-lg font-semibold text-textPrimary">Analyst notes</h3>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          <div className="h-24 animate-pulse rounded-lg bg-elevated" />
          <div className="h-24 animate-pulse rounded-lg bg-elevated" />
          <div className="h-40 animate-pulse rounded-lg bg-elevated" />
        </div>
      ) : isEmpty ? (
        <div className="mt-4">
          <EmptyState
            title="No insights yet"
            message="Upload dataset to populate the analyst notes, churn drivers, and recommendations."
            compact
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <article className="rounded-lg border border-risk/25 bg-risk/10 p-4">
            <p className="text-[11px] uppercase tracking-wide text-[#a2553f]">Top risk segment</p>
            <p className="mt-2 text-lg font-semibold text-textPrimary">{topRisk?.metric || "Segment not available"}</p>
            <p className="mt-2 text-sm leading-6 text-textSecondary">
              {topRisk?.detail || "Risk details will appear after churn data is loaded."}
            </p>
          </article>

          <article className="rounded-lg border border-secondary/20 bg-secondary/10 p-4">
            <p className="text-[11px] uppercase tracking-wide text-primary">Key churn driver</p>
            <p className="mt-2 text-lg font-semibold text-textPrimary">
              {keyDrivers?.contract || fallbackDriver?.segment || "Driver unavailable"}
            </p>
            <p className="mt-2 text-sm leading-6 text-textSecondary">
              {fallbackDriver
                ? `${Number(fallbackDriver.churn_rate || 0).toFixed(1)}% churn across ${fallbackDriver.customer_count || 0} customers.`
                : "Load data to surface the segment with the strongest churn pressure."}
            </p>
          </article>

          <article className="rounded-lg border border-primary/20 bg-primary/10 p-4">
            <p className="text-[11px] uppercase tracking-wide text-textPrimary">Revenue at risk</p>
            <p className="mt-2 font-display text-[28px] text-textPrimary">{formatMetric(revenueAtRisk)}</p>
            <p className="mt-2 text-sm leading-6 text-textSecondary">
              Monthly charges of the customers who left.
            </p>
          </article>

          <article className="rounded-lg glass-border bg-elevated p-4">
            <p className="text-[11px] uppercase tracking-wide text-textSecondary">Key findings</p>
            <div className="mt-3 space-y-3">
              {analystNotes.length > 0 ? (
                analystNotes.map((note) => (
                  <div key={note?.title} className="rounded-md border border-line bg-elevated p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-textPrimary">{note?.title}</p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          note?.severity === "critical" || note?.severity === "high"
                            ? "bg-risk/20 text-[#a2553f]"
                            : note?.severity === "medium"
                              ? "bg-warning/15 text-[#8a6d2f]"
                              : "bg-primary/15 text-textPrimary"
                        }`}
                      >
                        {note?.severity || "info"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-textSecondary">{note?.detail}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-textSecondary">Insight notes will appear once dataset insights are available.</p>
              )}
            </div>
          </article>

          <article className="rounded-lg glass-border bg-elevated p-4">
            <p className="text-[11px] uppercase tracking-wide text-textSecondary">Recommendations</p>
            <div className="mt-3 space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((recommendation) => (
                  <div key={recommendation?.title} className="rounded-md border border-line bg-elevated p-3">
                    <p className="text-sm font-medium text-textPrimary">{recommendation?.title}</p>
                    <p className="mt-2 text-sm leading-6 text-textSecondary">{recommendation?.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-textSecondary">Recommendations will appear once dataset insights are available.</p>
              )}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

export default InsightPanel;
