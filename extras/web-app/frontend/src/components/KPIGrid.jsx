import { formatMetric, formatNumber, formatPercent } from "../utils/formatters";

const KPI_CONFIG = {
  total_customers: {
    label: "Total Customers",
    render: formatNumber,
    hint: "Current analyzed base"
  },
  churn_rate: {
    label: "Churn Rate",
    render: formatPercent,
    hint: "Customers marked as churned"
  },
  average_monthly_charges: {
    label: "Avg Monthly Charges",
    render: formatMetric,
    hint: "Average monthly account value"
  },
  average_tenure: {
    label: "Avg Tenure",
    render: (value) => `${Number(value ?? 0).toFixed(1)} mo`,
    hint: "Customer lifetime depth"
  },
  revenue_at_risk: {
    label: "Revenue at Risk",
    render: formatMetric,
    hint: "Monthly exposure from churners"
  }
};

function KPIGrid({ kpis, isLoading }) {
  const safeKpis = kpis || {};

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {Object.entries(KPI_CONFIG).map(([key, config]) => (
        <article
          key={key}
          className="rounded-lg glass-border bg-surface px-4 py-4 shadow-panel"
        >
          <p className="text-[11px] uppercase tracking-wide text-textSecondary">{config.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="font-display text-2xl text-textPrimary md:text-[30px]">
              {isLoading ? "--" : config.render(safeKpis[key] ?? 0)}
            </p>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
              Active
            </span>
          </div>
          <p className="mt-3 text-xs text-textSecondary">{config.hint}</p>
        </article>
      ))}
    </section>
  );
}

export default KPIGrid;
