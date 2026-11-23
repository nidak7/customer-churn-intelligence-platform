export const EMPTY_SUMMARY = {
  kpis: {
    total_customers: 0,
    churn_rate: 0,
    average_monthly_charges: 0,
    average_tenure: 0,
    revenue_at_risk: 0
  },
  data_health: {}
};

export const EMPTY_CHARTS = {
  churn_by_contract: [],
  churn_by_payment_method: [],
  churn_by_internet_service: [],
  churn_by_tenure_group: [],
  churn_by_monthly_charge_range: [],
  risk_heatmap: []
};

export const EMPTY_INSIGHTS = {
  top_segment: "No data",
  key_drivers: {
    contract: "Unknown",
    tenure: "Unknown",
    payment: "Unknown"
  },
  insight_cards: [],
  recommendations: [],
  high_risk_segments: []
};
