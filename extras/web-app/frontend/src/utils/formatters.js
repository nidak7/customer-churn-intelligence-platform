export const formatNumber = (value) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value ?? 0));

export const formatDecimal = (value, digits = 1) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  }).format(Number(value ?? 0));

export const formatMetric = (value, digits = 1) => formatDecimal(value, digits);

export const formatPercent = (value) => `${Number(value ?? 0).toFixed(1)}%`;

export const formatDateTime = (value) => {
  if (!value) {
    return "Awaiting refresh";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Awaiting refresh";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

export const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const isNetworkError = (error) => !error?.response;

export const getFriendlyApiMessage = (error, fallback = "Something went wrong.") => {
  const detail = error?.response?.data?.detail;

  if (!error?.response) {
    return "Backend is offline. Start the FastAPI server and refresh.";
  }

  if (typeof detail === "string") {
    if (detail.includes("Dataset not loaded")) {
      return "No dataset loaded yet. Upload a Telco churn CSV to begin.";
    }
    if (detail.includes("Missing required columns")) {
      return "Invalid CSV format. Required columns are missing.";
    }
    if (detail.includes("looks like an exported report")) {
      return "Invalid CSV format. Please upload the source churn dataset, not an exported report.";
    }
    if (detail.includes("Invalid CSV format")) {
      return "Invalid CSV format. Please upload a valid Telco churn CSV.";
    }
    if (detail.includes("selected filters")) {
      return "No customers match the selected filters. Adjust the filter toolbar to continue.";
    }
    if (detail.includes("Model not trained")) {
      return "Model not trained yet. Train the churn model, then run prediction again.";
    }
    return detail;
  }

  return fallback;
};
