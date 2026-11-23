import axios from "axios";

const resolveApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return configured;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://127.0.0.1:8000";
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000
});

export const checkBackendStatus = () => api.get("/health");
export const getSummary = (filters = {}) => api.get("/summary", { params: filters });
export const getCharts = (filters = {}) => api.get("/charts", { params: filters });
export const getInsights = (filters = {}) => api.get("/insights", { params: filters });
export const trainModel = () => api.post("/train-model");
export const predictRisk = (payload) => api.post("/predict", payload);

export const uploadDataset = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const exportReport = async (format) => {
  const response = await api.get("/export-report", {
    params: { format },
    responseType: "blob"
  });
  return response;
};
