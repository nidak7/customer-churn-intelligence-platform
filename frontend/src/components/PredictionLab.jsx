import { useState } from "react";

const FIELD_SECTIONS = [
  {
    title: "Customer Profile",
    fields: [
      { key: "gender", label: "Gender", type: "select", options: ["Female", "Male"] },
      { key: "SeniorCitizen", label: "Senior citizen", type: "select", options: [0, 1] },
      { key: "Partner", label: "Partner", type: "select", options: ["Yes", "No"] },
      { key: "Dependents", label: "Dependents", type: "select", options: ["Yes", "No"] },
      { key: "tenure", label: "Tenure (months)", type: "number" }
    ]
  },
  {
    title: "Services",
    fields: [
      { key: "PhoneService", label: "Phone service", type: "select", options: ["Yes", "No"] },
      { key: "MultipleLines", label: "Multiple lines", type: "select", options: ["Yes", "No", "No phone service"] },
      { key: "InternetService", label: "Internet service", type: "select", options: ["DSL", "Fiber optic", "No"] },
      { key: "OnlineSecurity", label: "Online security", type: "select", options: ["Yes", "No", "No internet service"] },
      { key: "OnlineBackup", label: "Online backup", type: "select", options: ["Yes", "No", "No internet service"] },
      { key: "DeviceProtection", label: "Device protection", type: "select", options: ["Yes", "No", "No internet service"] },
      { key: "TechSupport", label: "Tech support", type: "select", options: ["Yes", "No", "No internet service"] },
      { key: "StreamingTV", label: "Streaming TV", type: "select", options: ["Yes", "No", "No internet service"] },
      { key: "StreamingMovies", label: "Streaming movies", type: "select", options: ["Yes", "No", "No internet service"] }
    ]
  },
  {
    title: "Billing",
    fields: [
      { key: "Contract", label: "Contract", type: "select", options: ["Month-to-month", "One year", "Two year"] },
      { key: "PaperlessBilling", label: "Paperless billing", type: "select", options: ["Yes", "No"] },
      {
        key: "PaymentMethod",
        label: "Payment method",
        type: "select",
        options: ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"]
      }
    ]
  },
  {
    title: "Charges",
    fields: [
      { key: "MonthlyCharges", label: "Monthly charges", type: "number", step: "0.01" },
      { key: "TotalCharges", label: "Total charges", type: "number", step: "0.01" }
    ]
  }
];

function RiskBadge({ level = "Low" }) {
  const styles =
    level === "High"
      ? "bg-risk/20 text-[#a2553f] border border-risk/25"
      : level === "Medium"
        ? "bg-warning/15 text-[#8a6d2f] border border-warning/25"
        : "bg-primary/15 text-textPrimary border border-primary/25";

  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles}`}>{level}</span>;
}

function PredictionLab({ values, setValues, onPredict, prediction, isLoading, backendStatus }) {
  const [isOpen, setIsOpen] = useState(false);
  const drivers = (prediction?.top_prediction_factors || []).slice(0, 3);

  return (
    <section className="rounded-lg glass-border bg-surface p-4 shadow-panel">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-textSecondary">Prediction</p>
          <h3 className="mt-2 text-lg font-semibold text-textPrimary">Customer risk simulation</h3>
          <p className="mt-1 text-sm text-textSecondary">
            Expand the lab to test a customer profile, estimate churn probability, and review the main risk drivers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="rounded-full border glass-border bg-elevated px-4 py-2.5 text-sm font-medium text-textPrimary transition hover:border-primary/35 hover:bg-elevated"
          >
            {isOpen ? "Hide Lab" : "Open Lab"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {FIELD_SECTIONS.map((section) => (
                <div key={section.title} className="rounded-lg border border-line bg-elevated p-4">
                  <p className="text-[11px] uppercase tracking-wide text-textSecondary">{section.title}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {section.fields.map((field) => (
                      <label key={field.key} className={`block ${section.fields.length <= 3 ? "md:col-span-2" : ""}`}>
                        <span className="mb-2 block text-xs text-textSecondary">{field.label}</span>
                        {field.type === "select" ? (
                          <select
                            value={values[field.key]}
                            onChange={(event) =>
                              setValues((current) => ({
                                ...current,
                                [field.key]: field.key === "SeniorCitizen" ? Number(event.target.value) : event.target.value
                              }))
                            }
                            className="w-full rounded-md border border-line bg-card px-3.5 py-2.5 text-sm text-textPrimary outline-none transition focus:border-primary/55"
                          >
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {String(option)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={values[field.key]}
                            type="number"
                            min="0"
                            step={field.step || "1"}
                            onChange={(event) =>
                              setValues((current) => ({
                                ...current,
                                [field.key]: Number(event.target.value)
                              }))
                            }
                            className="w-full rounded-md border border-line bg-card px-3.5 py-2.5 text-sm text-textPrimary outline-none transition focus:border-primary/55"
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onPredict}
              disabled={isLoading || backendStatus !== "online"}
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Running prediction..." : "Run Prediction"}
            </button>
          </div>

          <div className="rounded-lg border border-line bg-elevated p-4">
            <p className="text-[11px] uppercase tracking-wide text-textSecondary">Prediction output</p>
            {prediction ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-line bg-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-textSecondary">Risk level</p>
                      <div className="mt-2">
                        <RiskBadge level={prediction?.risk_level || "Low"} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-textSecondary">Churn probability</p>
                      <p className="mt-2 font-display text-[30px] text-textPrimary">
                        {Number(prediction?.churn_probability || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-textSecondary">
                    {prediction?.recommended_action || "Recommended action will appear after prediction runs."}
                  </p>
                </div>

                <div className="rounded-lg border border-line bg-card p-4">
                  <p className="text-[11px] uppercase tracking-wide text-textSecondary">Top 3 factors</p>
                  <div className="mt-3 space-y-3">
                    {drivers.length > 0 ? (
                      drivers.map((driver) => (
                        <div key={driver?.feature} className="rounded-md border border-line bg-elevated p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-textPrimary">{driver?.feature}</span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] ${
                                driver?.direction?.includes("Increase")
                                  ? "bg-risk/20 text-[#a2553f]"
                                  : "bg-primary/15 text-textPrimary"
                              }`}
                            >
                              {driver?.impact?.toFixed ? driver.impact.toFixed(2) : driver?.impact}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-textSecondary">{driver?.direction}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-textSecondary">Prediction factors will appear after a scoring run.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-line bg-card p-4">
                <p className="text-sm font-medium text-textPrimary">
                  {backendStatus === "online" ? "No prediction yet" : "Backend offline"}
                </p>
                <p className="mt-2 text-sm leading-6 text-textSecondary">
                  {backendStatus === "online"
                    ? "Run the model with a customer profile to display churn probability, risk level, and the strongest local drivers."
                    : "Start the FastAPI server to use the prediction form."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default PredictionLab;
