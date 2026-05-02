def _top_segment(series: list[dict]) -> dict:
    if not series:
        return {
            "segment": "No data",
            "churn_rate": 0,
            "customer_count": 0,
            "average_monthly_charge": 0,
        }
    return max(series, key=lambda item: (item["churn_rate"], item["customer_count"]))


def generate_insight_cards(summary: dict, charts: dict) -> list[dict]:
    contract_risk = _top_segment(charts["churn_by_contract"])
    payment_risk = _top_segment(charts["churn_by_payment_method"])
    internet_risk = _top_segment(charts["churn_by_internet_service"])
    tenure_risk = _top_segment(charts["churn_by_tenure_group"])
    monthly_charge_risk = _top_segment(charts["churn_by_monthly_charge_range"])

    churn_rate = summary["kpis"]["churn_rate"]
    revenue_at_risk = summary["kpis"]["revenue_at_risk"]
    severity = "critical" if churn_rate >= 35 else "high" if churn_rate >= 25 else "medium"

    return [
        {
            "title": "Contract exposure is the primary churn signal",
            "metric": f"{contract_risk['segment']} contract",
            "detail": f"{contract_risk['churn_rate']}% churn across {contract_risk['customer_count']} customers makes this the most exposed contract segment.",
            "severity": severity,
            "recommendation": "Convert at-risk customers from short commitment plans into more stable plans with targeted save offers.",
        },
        {
            "title": "Billing friction is a visible churn driver",
            "metric": payment_risk["segment"],
            "detail": f"{payment_risk['churn_rate']}% churn and average monthly charge of {payment_risk['average_monthly_charge']} indicate this payment segment needs attention.",
            "severity": "high" if payment_risk["churn_rate"] >= 30 else "medium",
            "recommendation": "Reduce payment friction and review failed-payment, renewal, and billing-support journeys for this segment.",
        },
        {
            "title": "Service mix is creating churn pressure",
            "metric": internet_risk["segment"],
            "detail": f"{internet_risk['churn_rate']}% churn in this internet service segment suggests a value or reliability gap.",
            "severity": "high" if internet_risk["churn_rate"] >= 30 else "medium",
            "recommendation": "Pair service quality checks with proactive offers for customers in the riskiest service mix.",
        },
        {
            "title": "Early lifecycle churn is still costly",
            "metric": tenure_risk["segment"],
            "detail": f"Customers in this tenure band churn at {tenure_risk['churn_rate']}%, pointing to onboarding and adoption weakness.",
            "severity": "high" if tenure_risk["churn_rate"] >= 30 else "medium",
            "recommendation": "Strengthen first-year activation, education, and support outreach before renewal decisions are made.",
        },
        {
            "title": "Charge sensitivity is concentrated in one band",
            "metric": monthly_charge_risk["segment"],
            "detail": f"This charge band shows {monthly_charge_risk['churn_rate']}% churn and likely reflects the sharpest price-value tension in the base.",
            "severity": "high" if monthly_charge_risk["churn_rate"] >= 30 else "medium",
            "recommendation": "Review bundles, service quality, and pricing narrative for the most churn-prone charge band.",
        },
        {
            "title": "Revenue at risk is material",
            "metric": f"{revenue_at_risk}",
            "detail": f"Current churned customers represent {churn_rate}% churn across the selected view and expose recurring revenue that can still be protected upstream.",
            "severity": severity,
            "recommendation": "Focus retention effort on customers who combine high churn risk with higher recurring charge levels.",
        },
    ]


def generate_recommendations(summary: dict, charts: dict) -> list[dict]:
    contract_risk = _top_segment(charts["churn_by_contract"])
    payment_risk = _top_segment(charts["churn_by_payment_method"])
    internet_risk = _top_segment(charts["churn_by_internet_service"])
    tenure_risk = _top_segment(charts["churn_by_tenure_group"])

    recommendations = [
        {
            "title": "Stabilize short-commitment customers",
            "body": f"Month-to-month style behavior remains the highest churn signal, so prioritize save campaigns and plan conversion for {contract_risk['segment']} customers.",
        },
        {
            "title": "Simplify billing and payment support",
            "body": f"Customers using {payment_risk['segment']} show the strongest churn pressure, so payment support and renewal friction should be reduced first.",
        },
        {
            "title": "Target service-value mismatch",
            "body": f"The {internet_risk['segment']} segment shows elevated churn, which makes it the best place to investigate reliability, speed, and bundle fit.",
        },
        {
            "title": "Invest earlier in the customer lifecycle",
            "body": f"Customers in the {tenure_risk['segment']} band are the most vulnerable, so onboarding milestones and usage nudges should happen sooner.",
        },
    ]

    if summary["kpis"]["revenue_at_risk"] >= 10000:
        recommendations.append(
            {
                "title": "Protect high-value churn before broad incentives",
                "body": "Revenue at risk is meaningful enough to justify prioritizing the highest recurring-charge customers before launching broader discounts.",
            }
        )

    return recommendations
