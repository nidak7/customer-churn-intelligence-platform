import { useEffect, useMemo, useState } from "react";
import ChartCard from "../components/ChartCard";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import Header from "../components/Header";
import InsightPanel from "../components/InsightPanel";
import KPIGrid from "../components/KPIGrid";
import ModelPanel from "../components/ModelPanel";
import PredictionLab from "../components/PredictionLab";
import StatusBanner from "../components/StatusBanner";
import UploadPanel from "../components/UploadPanel";
import {
  checkBackendStatus,
  exportReport,
  getCharts,
  getInsights,
  getSummary,
  predictRisk,
  trainModel,
  uploadDataset
} from "../services/api";
import { EMPTY_CHARTS, EMPTY_INSIGHTS, EMPTY_SUMMARY } from "../utils/dashboard";
import {
  downloadBlob,
  formatDateTime,
  getFriendlyApiMessage,
  isNetworkError
} from "../utils/formatters";

const defaultPredictionValues = {
  gender: "Female",
  SeniorCitizen: 0,
  Partner: "No",
  Dependents: "No",
  tenure: 12,
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "Fiber optic",
  OnlineSecurity: "No",
  OnlineBackup: "No",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "Yes",
  StreamingMovies: "Yes",
  Contract: "Month-to-month",
  PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 79.5,
  TotalCharges: 954
};

const filterOptions = {
  contract: ["All", "Month-to-month", "One year", "Two year"],
  internet_service: ["All", "DSL", "Fiber optic", "No"],
  payment_method: [
    "All",
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)"
  ],
  churn: ["All", "Yes", "No"]
};

function DashboardPage() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [charts, setCharts] = useState(EMPTY_CHARTS);
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  const [modelState, setModelState] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predictionValues, setPredictionValues] = useState(defaultPredictionValues);
  const [filters, setFilters] = useState({
    contract: "All",
    internet_service: "All",
    payment_method: "All",
    churn: "All"
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [banner, setBanner] = useState({
    tone: "info",
    message: "Checking backend status and loading dashboard..."
  });
  const [backendStatus, setBackendStatus] = useState("checking");
  const [loading, setLoading] = useState({
    dashboard: true,
    upload: false,
    train: false,
    predict: false,
    export: ""
  });

  const setDataToEmptyState = () => {
    setSummary(EMPTY_SUMMARY);
    setCharts(EMPTY_CHARTS);
    setInsights(EMPTY_INSIGHTS);
  };

  const normalizeFilters = (activeFilters) =>
    Object.fromEntries(Object.entries(activeFilters).filter(([, value]) => value && value !== "All"));

  const refreshBackendConnection = async ({ quiet = false } = {}) => {
    try {
      await checkBackendStatus();
      setBackendStatus("online");
      if (!quiet && !summary?.kpis?.total_customers) {
        setBanner({
          tone: "success",
          message: "Backend connected. Upload a churn CSV or use the preloaded Telco dataset to explore retention risk."
        });
      }
      return true;
    } catch (error) {
      setBackendStatus("offline");
      if (!quiet) {
        setBanner({
          tone: "error",
          message: getFriendlyApiMessage(error, "Backend is offline. Start the FastAPI server and refresh.")
        });
      }
      return false;
    }
  };

  const fetchDashboard = async (activeFilters = filters, { skipStatusCheck = false } = {}) => {
    setLoading((current) => ({ ...current, dashboard: true }));
    const normalizedFilters = normalizeFilters(activeFilters);

    try {
      if (!skipStatusCheck) {
        const online = await refreshBackendConnection({ quiet: true });
        if (!online) {
          setDataToEmptyState();
          setLoading((current) => ({ ...current, dashboard: false }));
          setBanner({
            tone: "error",
            message: "Backend is offline. Start the FastAPI server and refresh."
          });
          return;
        }
      }

      const [summaryResponse, chartsResponse, insightsResponse] = await Promise.all([
        getSummary(normalizedFilters),
        getCharts(normalizedFilters),
        getInsights(normalizedFilters)
      ]);

      setSummary(summaryResponse?.data || EMPTY_SUMMARY);
      setCharts({ ...EMPTY_CHARTS, ...(chartsResponse?.data || {}) });
      setInsights({ ...EMPTY_INSIGHTS, ...(insightsResponse?.data || {}) });
      setBackendStatus("online");
      setBanner({
        tone: "info",
        message: "Dashboard synced. KPIs, charts, and analyst notes reflect the active dataset."
      });
    } catch (error) {
      if (isNetworkError(error)) {
        setBackendStatus("offline");
        setDataToEmptyState();
      } else {
        setBackendStatus("online");
      }
      setBanner({
        tone: "error",
        message: getFriendlyApiMessage(error, "Dashboard data could not be loaded.")
      });
    } finally {
      setLoading((current) => ({ ...current, dashboard: false }));
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const online = await refreshBackendConnection({ quiet: true });
      if (!online) {
        if (!cancelled) {
          setDataToEmptyState();
          setLoading((current) => ({ ...current, dashboard: false }));
          setBanner({
            tone: "error",
            message: "Backend is offline. Start the FastAPI server and refresh."
          });
        }
        return;
      }
      if (!cancelled) {
        fetchDashboard(filters, { skipStatusCheck: true });
      }
    };

    initialize();
    const intervalId = window.setInterval(() => {
      refreshBackendConnection({ quiet: true });
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (backendStatus === "online") {
      fetchDashboard(filters, { skipStatusCheck: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleUpload = async () => {
    if (!selectedFile) {
      setBanner({
        tone: "warning",
        message: "Choose a Telco churn CSV before uploading."
      });
      return;
    }

    setLoading((current) => ({ ...current, upload: true }));
    try {
      const response = await uploadDataset(selectedFile);
      setModelState(null);
      setPrediction(null);
      setBackendStatus("online");
      await fetchDashboard(filters, { skipStatusCheck: true });
      setBanner({
        tone: "success",
        message: response?.data?.message || "Dataset uploaded and cleaned successfully."
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: getFriendlyApiMessage(error, "Dataset upload failed.")
      });
      if (isNetworkError(error)) {
        setBackendStatus("offline");
      }
    } finally {
      setLoading((current) => ({ ...current, upload: false }));
    }
  };

  const handleTrainModel = async () => {
    setLoading((current) => ({ ...current, train: true }));
    try {
      const response = await trainModel();
      setModelState(response?.data || null);
      setBackendStatus("online");
      setBanner({
        tone: "success",
        message: "Model trained successfully. Metrics, confusion matrix, and top churn factors are ready."
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: getFriendlyApiMessage(error, "Model training failed.")
      });
      if (isNetworkError(error)) {
        setBackendStatus("offline");
      }
    } finally {
      setLoading((current) => ({ ...current, train: false }));
    }
  };

  const handlePredict = async () => {
    setLoading((current) => ({ ...current, predict: true }));
    try {
      const response = await predictRisk(predictionValues);
      setPrediction(response?.data || null);
      setBackendStatus("online");
      setBanner({
        tone: "success",
        message: "Prediction complete. Review the churn probability, risk level, and local drivers below."
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: getFriendlyApiMessage(error, "Prediction could not be generated.")
      });
      if (isNetworkError(error)) {
        setBackendStatus("offline");
      }
    } finally {
      setLoading((current) => ({ ...current, predict: false }));
    }
  };

  const handleExport = async (format) => {
    setLoading((current) => ({ ...current, export: format }));
    try {
      const response = await exportReport(format);
      const disposition = response?.headers?.["content-disposition"] || "";
      const matchedName = disposition.match(/filename="(.+)"/);
      downloadBlob(response.data, matchedName?.[1] || `customer_churn_report.${format}`);
      setBackendStatus("online");
      setBanner({
        tone: "success",
        message: `${format.toUpperCase()} report downloaded successfully.`
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: getFriendlyApiMessage(error, "Report export failed.")
      });
      if (isNetworkError(error)) {
        setBackendStatus("offline");
      }
    } finally {
      setLoading((current) => ({ ...current, export: "" }));
    }
  };

  const hasLiveData = useMemo(
    () =>
      backendStatus === "online" &&
      ((summary?.kpis?.total_customers || 0) > 0 || (charts?.churn_by_contract || []).length > 0),
    [backendStatus, charts, summary]
  );

  const metadata = summary?.data_health || {};
  const sourceLabel = metadata?.source_name || "No dataset loaded";
  const freshnessLabel = metadata?.loaded_at ? formatDateTime(metadata.loaded_at) : "Awaiting dataset";

  return (
    <main className="min-h-screen bg-app text-slate-100">
      <div className="mx-auto max-w-[1440px] px-4 py-4 md:px-6 lg:px-8">
        <Header backendStatus={backendStatus} />

        <section className="mt-4 rounded-[24px] glass-border bg-surface px-5 py-4 shadow-panel backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-primary">Operations overview</p>
              <h1 className="mt-2 font-display text-2xl text-textPrimary md:text-[28px]">
                Retention KPIs, churn drivers, and predictive risk in one operating view.
              </h1>
              <p className="mt-2 text-sm text-textSecondary">
                Track customer exposure, compare high-risk segments, and move from descriptive analysis to prediction
                without leaving the workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
              <div className="rounded-2xl border border-line bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-textSecondary">Dataset source</p>
                <p className="mt-2 truncate text-sm font-medium text-textPrimary">{sourceLabel}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-textSecondary">Last refresh</p>
                <p className="mt-2 text-sm font-medium text-textPrimary">{freshnessLabel}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4">
          <UploadPanel
            backendStatus={backendStatus}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            onUpload={handleUpload}
            onTrain={handleTrainModel}
            onExport={handleExport}
            loading={loading}
            metadata={metadata}
          />
        </div>

        <div className="mt-4">
          <StatusBanner
            tone={banner.tone}
            message={banner.message}
            loading={loading.dashboard}
          />
        </div>

        <div className="mt-4">
          <KPIGrid
            kpis={summary?.kpis}
            backendStatus={backendStatus}
            isLoading={loading.dashboard}
          />
        </div>

        <div className="mt-4">
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            filterOptions={filterOptions}
            disabled={backendStatus !== "online"}
          />
        </div>

        <section className="mt-4 grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Churn by Contract"
                subtitle="Contract mix is often the clearest early signal of retention pressure."
                data={charts?.churn_by_contract}
                isLoading={loading.dashboard}
                isEmpty={!hasLiveData}
                emptyMessage="Upload dataset to view contract churn analysis."
                type="bar"
              />
              <ChartCard
                title="Churn by Payment Method"
                subtitle="Billing friction often reveals avoidable churn before support escalations appear."
                data={charts?.churn_by_payment_method}
                isLoading={loading.dashboard}
                isEmpty={!hasLiveData}
                emptyMessage="Upload dataset to view payment-method churn patterns."
                type="bar"
              />
              <ChartCard
                title="Churn by Internet Service"
                subtitle="Service mix helps expose where experience quality or price-value balance may be slipping."
                data={charts?.churn_by_internet_service}
                isLoading={loading.dashboard}
                isEmpty={!hasLiveData}
                emptyMessage="Upload dataset to view internet-service churn mix."
                type="donut"
              />
              <ChartCard
                title="Tenure vs Churn"
                subtitle="Lifecycle exposure highlights when retention interventions should trigger."
                data={charts?.churn_by_tenure_group}
                isLoading={loading.dashboard}
                isEmpty={!hasLiveData}
                emptyMessage="Upload dataset to view tenure-group churn trends."
                type="bar"
              />
              <div className="lg:col-span-2">
                <ChartCard
                  title="Risk Heatmap"
                  subtitle="Compare contract and tenure combinations to spot the most exposed customer cohorts."
                  data={charts?.risk_heatmap}
                  isLoading={loading.dashboard}
                  isEmpty={!hasLiveData}
                  emptyMessage="Upload dataset to view the contract-tenure risk heatmap."
                  type="heatmap"
                />
              </div>
              <div className="lg:col-span-2">
                <ChartCard
                  title="Monthly Charges vs Churn"
                  subtitle="Charge bands help reveal where pricing pressure and perceived value begin to diverge."
                  data={charts?.churn_by_monthly_charge_range}
                  isLoading={loading.dashboard}
                  isEmpty={!hasLiveData}
                  emptyMessage="Upload dataset to view monthly-charge churn ranges."
                  type="bar"
                />
              </div>
            </div>
          </div>

          <aside className="space-y-4 xl:col-span-4">
            <InsightPanel
              summary={summary}
              insights={insights}
              charts={charts}
              isLoading={loading.dashboard}
              isEmpty={!hasLiveData}
            />
            <ModelPanel
              modelState={modelState}
              isTraining={loading.train}
              backendStatus={backendStatus}
            />
            <section className="rounded-[22px] glass-border bg-surface p-4 shadow-panel backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.26em] text-textSecondary">Data health</p>
                  <h3 className="mt-2 text-lg font-semibold text-textPrimary">Dataset quality</h3>
                </div>
              </div>

              {hasLiveData || metadata?.source_name ? (
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-textSecondary">Rows after cleaning</span>
                    <span className="font-semibold text-textPrimary">{metadata?.cleaned_rows ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-textSecondary">Duplicates removed</span>
                    <span className="text-textPrimary">{metadata?.duplicate_customer_ids_removed ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-textSecondary">Blank charges fixed</span>
                    <span className="text-textPrimary">{metadata?.blank_total_charges_fixed ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-textSecondary">Missing values filled</span>
                    <span className="text-textPrimary">{metadata?.missing_values_filled ?? 0}</span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Waiting for dataset"
                  message="No dataset loaded yet. Upload a Telco churn CSV to begin."
                  compact
                />
              )}
            </section>
          </aside>
        </section>

        <section className="mt-4">
          <PredictionLab
            values={predictionValues}
            setValues={setPredictionValues}
            onPredict={handlePredict}
            prediction={prediction}
            isLoading={loading.predict}
            backendStatus={backendStatus}
          />
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
