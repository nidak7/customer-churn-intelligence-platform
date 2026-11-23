def _top_segment(series: list[dict]) -> dict:
    """Return the segment with the highest churn rate (ties broken by size)."""
    if not series:
        return {"segment": "No data", "churn_rate": 0, "customer_count": 0, "average_monthly_charge": 0}
    return max(series, key=lambda item: (item["churn_rate"], item["customer_count"]))


def _severity(churn_rate: float, high: float = 30) -> str:
    return "high" if churn_rate >= high else "medium"


def generate_insight_cards(summary: dict, charts: dict) -> list[dict]:
    contract = _top_segment(charts["churn_by_contract"])
    payment = _top_segment(charts["churn_by_payment_method"])
    internet = _top_segment(charts["churn_by_internet_service"])
    tenure = _top_segment(charts["churn_by_tenure_group"])
    charge = _top_segment(charts["churn_by_monthly_charge_range"])

    churn_rate = summary["kpis"]["churn_rate"]
    revenue_lost = summary["kpis"]["revenue_at_risk"]
    overall = "critical" if churn_rate >= 35 else "high" if churn_rate >= 25 else "medium"

    return [
        {
            "title": "Contract type matters most",
            "metric": f"{contract['segment']} contract",
            "detail": f"{contract['churn_rate']}% of these {contract['customer_count']} customers left, the highest of any contract type.",
            "severity": overall,
            "recommendation": "Offer these customers a move to a one- or two-year plan.",
        },
        {
            "title": "Payment method",
            "metric": payment["segment"],
            "detail": f"{payment['churn_rate']}% churn. Average monthly charge is {payment['average_monthly_charge']}.",
            "severity": _severity(payment["churn_rate"]),
            "recommendation": "Encourage a switch to automatic payment.",
        },
        {
            "title": "Internet service",
            "metric": internet["segment"],
            "detail": f"{internet['churn_rate']}% churn, the highest among internet service types.",
            "severity": _severity(internet["churn_rate"]),
            "recommendation": "Review price and service quality for this group.",
        },
        {
            "title": "New customers leave early",
            "metric": tenure["segment"],
            "detail": f"Customers in this tenure group churn at {tenure['churn_rate']}%.",
            "severity": _severity(tenure["churn_rate"]),
            "recommendation": "Check in with new customers during their first year.",
        },
        {
            "title": "Monthly charge band",
            "metric": charge["segment"],
            "detail": f"{charge['churn_rate']}% churn for customers paying this much per month.",
            "severity": _severity(charge["churn_rate"]),
            "recommendation": "Look at whether this price band gives customers enough value.",
        },
        {
            "title": "Revenue lost to churn",
            "metric": f"{revenue_lost}",
            "detail": f"Monthly charges of customers who left. Churn rate in this view is {churn_rate}%.",
            "severity": overall,
            "recommendation": "Start retention efforts with the highest-paying at-risk customers.",
        },
    ]


def generate_recommendations(summary: dict, charts: dict) -> list[dict]:
    contract = _top_segment(charts["churn_by_contract"])
    payment = _top_segment(charts["churn_by_payment_method"])
    internet = _top_segment(charts["churn_by_internet_service"])
    tenure = _top_segment(charts["churn_by_tenure_group"])

    return [
        {
            "title": "Move customers to longer contracts",
            "body": f"{contract['segment']} customers churn the most. Offer them a discount to switch to a longer plan.",
        },
        {
            "title": "Make payment easier",
            "body": f"Customers paying by {payment['segment']} churn most. Promote automatic payment.",
        },
        {
            "title": "Look into service quality",
            "body": f"{internet['segment']} customers churn more than others. Check pricing and reliability.",
        },
        {
            "title": "Support customers early",
            "body": f"The {tenure['segment']} group is the most likely to leave. Contact them at 30, 90 and 180 days.",
        },
    ]
