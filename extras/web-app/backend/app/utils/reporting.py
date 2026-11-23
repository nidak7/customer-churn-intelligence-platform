from io import BytesIO

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def build_export_dataframe(
    summary: dict,
    charts: dict,
    insights: dict,
    model_metrics: dict | None,
    top_features: list[dict],
) -> pd.DataFrame:
    rows = [
        {"section": "KPI", "label": "Total customers", "value": summary["kpis"]["total_customers"]},
        {"section": "KPI", "label": "Churn rate", "value": f"{summary['kpis']['churn_rate']}%"},
        {"section": "KPI", "label": "Average monthly charges", "value": summary["kpis"]["average_monthly_charges"]},
        {"section": "KPI", "label": "Average tenure", "value": summary["kpis"]["average_tenure"]},
        {"section": "KPI", "label": "Revenue at risk", "value": summary["kpis"]["revenue_at_risk"]},
    ]

    for chart_name, chart_rows in charts.items():
        if isinstance(chart_rows, list):
            for row in chart_rows[:8]:
                rows.append(
                    {
                        "section": chart_name,
                        "label": row.get("segment", row.get("contract", "Segment")),
                        "value": f"{row.get('churn_rate', 0)}%",
                    }
                )

    for item in insights["insight_cards"][:6]:
        rows.append({"section": "Insight", "label": item["title"], "value": item["detail"]})

    for item in insights["recommendations"]:
        rows.append({"section": "Recommendation", "label": item["title"], "value": item["body"]})

    if model_metrics:
        for metric_name, metric_value in model_metrics.items():
            rows.append({"section": "Model metric", "label": metric_name, "value": metric_value})

    for feature in top_features[:10]:
        rows.append(
            {
                "section": "Top feature",
                "label": feature["feature"],
                "value": f"{feature.get('importance', 0)} ({feature.get('direction', 'Effect')})",
            }
        )

    return pd.DataFrame(rows)


def build_pdf_report(
    summary: dict,
    insights: dict,
    model_metrics: dict | None,
    top_features: list[dict],
) -> bytes:
    buffer = BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=A4, title="Customer Churn Intelligence Report")
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading2"]
    body_style = ParagraphStyle(
        "NeutralBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=14,
        textColor=colors.HexColor("#1f2937"),
    )

    story = [
        Paragraph("Customer Churn Intelligence Report", title_style),
        Spacer(1, 12),
        Paragraph("Executive KPIs", heading_style),
    ]

    kpi_table = Table(
        [
            ["KPI", "Value"],
            ["Total customers", str(summary["kpis"]["total_customers"])],
            ["Churn rate", f"{summary['kpis']['churn_rate']}%"],
            ["Average monthly charges", f"{summary['kpis']['average_monthly_charges']}"],
            ["Average tenure", f"{summary['kpis']['average_tenure']} months"],
            ["Revenue at risk", f"{summary['kpis']['revenue_at_risk']}"],
        ]
    )
    kpi_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#263244")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ]
        )
    )
    story.extend([kpi_table, Spacer(1, 16), Paragraph("Key Insights", heading_style)])

    for insight in insights["insight_cards"][:6]:
        story.append(Paragraph(f"<b>{insight['title']}</b>: {insight['detail']}", body_style))
        story.append(Spacer(1, 6))

    story.extend([Spacer(1, 8), Paragraph("Business Recommendations", heading_style)])

    for recommendation in insights["recommendations"]:
        story.append(Paragraph(f"<b>{recommendation['title']}</b>: {recommendation['body']}", body_style))
        story.append(Spacer(1, 8))

    if model_metrics:
        story.append(Spacer(1, 8))
        story.append(Paragraph("Model Snapshot", heading_style))
        for metric_name, metric_value in model_metrics.items():
            story.append(Paragraph(f"{metric_name}: {metric_value}", body_style))
            story.append(Spacer(1, 6))

    if top_features:
        story.append(Spacer(1, 8))
        story.append(Paragraph("Top Influential Features", heading_style))
        for feature in top_features[:10]:
            story.append(
                Paragraph(
                    f"{feature['feature']}: {feature['importance']} ({feature.get('direction', 'Effect')})",
                    body_style,
                )
            )
            story.append(Spacer(1, 4))

    document.build(story)
    return buffer.getvalue()
