import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatMetric, formatNumber, formatPercent } from "../utils/formatters";
import EmptyState from "./EmptyState";

const CHART_COLORS = ["#A3E635", "#38BDF8", "#FBBF24", "#FB7185", "#7DD3FC", "#D9F99D"];

const tooltipStyle = {
  backgroundColor: "#101827",
  border: "1px solid rgba(38, 50, 68, 0.92)",
  borderRadius: "16px",
  color: "#F8FAFC",
  boxShadow: "0 24px 60px rgba(3, 7, 18, 0.55)"
};

function SmartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload || {};
  const pointLabel = point?.segment || point?.contract || label || "Segment";

  return (
    <div style={tooltipStyle} className="min-w-[180px] p-3 text-sm">
      <p className="font-medium text-textPrimary">{pointLabel}</p>
      <div className="mt-2 space-y-1.5 text-textSecondary">
        <p>Churn rate: {formatPercent(point?.churn_rate || payload[0]?.value || 0)}</p>
        {typeof point?.customer_count !== "undefined" && <p>Customers: {formatNumber(point.customer_count)}</p>}
        {typeof point?.average_monthly_charge !== "undefined" && (
          <p>Avg monthly charge: {formatMetric(point.average_monthly_charge)}</p>
        )}
      </div>
    </div>
  );
}

function HeatmapView({ data }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((item, index) => {
        const churnRate = Number(item?.churn_rate || 0);
        const intensity = Math.min(1, churnRate / 55);
        const glowColor = churnRate >= 35 ? "251, 113, 133" : churnRate >= 20 ? "251, 191, 36" : "163, 230, 53";

        return (
          <div
            key={`${item?.contract}-${item?.tenure_group}-${index}`}
            className="panel-hover rounded-[16px] border border-line px-4 py-3"
            style={{
              background: `linear-gradient(180deg, rgba(23, 32, 51, 0.88), rgba(${glowColor}, ${0.11 + intensity * 0.16}))`
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-textSecondary">{item?.contract || "Unknown"}</p>
                <p className="mt-2 text-sm font-medium text-textPrimary">{item?.tenure_group || "Unknown"}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  churnRate >= 35
                    ? "bg-risk/15 text-rose-100"
                    : churnRate >= 20
                      ? "bg-warning/15 text-amber-50"
                      : "bg-primary/15 text-lime-100"
                }`}
              >
                {churnRate >= 35 ? "High" : churnRate >= 20 ? "Medium" : "Low"}
              </span>
            </div>
            <p className="mt-4 font-display text-2xl text-textPrimary">{formatPercent(churnRate)}</p>
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  data = [],
  type = "bar",
  isLoading = false,
  isEmpty = false,
  emptyMessage = "Upload dataset to view analysis."
}) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <section className="panel-hover rounded-[22px] glass-border bg-surface p-4 shadow-panel backdrop-blur">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-textPrimary">{title}</h3>
        <p className="mt-1 text-sm text-textSecondary">{subtitle}</p>
      </div>

      {isLoading ? (
        <div className="h-[248px] animate-pulse rounded-[18px] bg-white/[0.04]" />
      ) : isEmpty || safeData.length === 0 ? (
        <EmptyState title="No analysis yet" message={emptyMessage} compact={false} />
      ) : type === "heatmap" ? (
        <HeatmapView data={safeData} />
      ) : (
        <div className="h-[248px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === "donut" ? (
              <PieChart>
                <Pie
                  data={safeData}
                  dataKey="churn_rate"
                  nameKey="segment"
                  innerRadius={56}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {safeData.map((entry, index) => (
                    <Cell key={`${entry?.segment}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<SmartTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={safeData} margin={{ top: 8, right: 6, left: -18, bottom: 26 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="segment"
                  angle={safeData.length > 4 ? -14 : 0}
                  textAnchor={safeData.length > 4 ? "end" : "middle"}
                  interval={0}
                  height={58}
                />
                <YAxis unit="%" />
                <Tooltip content={<SmartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="churn_rate" radius={[10, 10, 4, 4]} maxBarSize={42}>
                  {safeData.map((entry, index) => (
                    <Cell key={`${entry?.segment}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default ChartCard;
