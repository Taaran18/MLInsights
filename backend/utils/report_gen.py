import io
from datetime import datetime, timezone
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

BRAND = colors.HexColor("#4f46e5")
MUTED = colors.HexColor("#475569")
NON_METRIC_KEYS = {"confusion_matrix", "class_distribution", "class_labels"}
PERCENT_METRICS = {"Accuracy", "Precision", "Recall", "F1 Score", "ROC AUC", "CV Mean", "R2 Score"}


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("Title", parent=base["Heading1"], textColor=BRAND, fontSize=20, spaceAfter=8),
        "h2": ParagraphStyle("H2", parent=base["Heading2"], textColor=colors.HexColor("#0f172a"), fontSize=13, spaceBefore=10, spaceAfter=6),
        "h3": ParagraphStyle("H3", parent=base["Heading3"], textColor=colors.HexColor("#1e293b"), fontSize=11, spaceBefore=6, spaceAfter=4),
        "body": ParagraphStyle("Body", parent=base["Normal"], fontSize=9.5, leading=13),
        "muted": ParagraphStyle("Muted", parent=base["Normal"], fontSize=8.5, textColor=MUTED, leading=12),
        "cell": ParagraphStyle("Cell", parent=base["Normal"], fontSize=8.5, leading=11),
        "footer": ParagraphStyle("Footer", parent=base["Normal"], fontSize=8, textColor=colors.grey, alignment=TA_CENTER),
    }


def _table(rows, col_widths):
    table = Table(rows, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f6ff")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def _format_metric(name: str, value) -> str:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return str(value)
    if name in PERCENT_METRICS:
        return f"{value * 100:.2f}%"
    if isinstance(value, int):
        return f"{value:,}"
    return f"{value:,.4f}"


def generate_report(filename: str, basic_info: dict, missing_info: dict, trained_models: dict, is_cleaned: bool = False) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"MLInsights Report: {filename}",
        author="MLInsights",
    )
    s = _styles()
    story = []

    generated = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    story.append(Paragraph("MLInsights Analysis Report", s["title"]))
    story.append(Paragraph(f"<b>Dataset:</b> {escape(filename)}", s["body"]))
    story.append(Paragraph(f"<b>Data version:</b> {'Cleaned copy' if is_cleaned else 'Original upload'}", s["body"]))
    story.append(Paragraph(f"<b>Generated:</b> {generated}", s["body"]))
    story.append(Spacer(1, 0.2 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND))

    story.append(Paragraph("1. Dataset Overview", s["h2"]))
    overview = [
        ["Property", "Value"],
        ["Rows", f"{basic_info.get('rows', 0):,}"],
        ["Columns", f"{basic_info.get('columns', 0):,}"],
        ["Numeric columns", f"{len(basic_info.get('numeric_columns', [])):,}"],
        ["Categorical columns", f"{len(basic_info.get('categorical_columns', [])):,}"],
        ["Duplicate rows", f"{basic_info.get('duplicate_rows', 0):,}"],
        ["Memory usage", f"{basic_info.get('memory_usage_kb', 0):,} KB"],
    ]
    story.append(_table(overview, [8.5 * cm, 8.5 * cm]))

    story.append(Paragraph("2. Missing Values", s["h2"]))
    story.append(
        Paragraph(
            f"Total missing cells: <b>{missing_info.get('total_missing', 0):,}</b> "
            f"({missing_info.get('total_missing_percentage', 0):.2f}% of all cells)",
            s["body"],
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    missing_rows = [["Column", "Missing", "Missing %", "Type"]]
    for col, info in missing_info.get("per_column", {}).items():
        if info["count"] > 0:
            missing_rows.append(
                [Paragraph(escape(str(col)), s["cell"]), f"{info['count']:,}", f"{info['percentage']:.1f}%", info["dtype"]]
            )
    if len(missing_rows) > 1:
        story.append(_table(missing_rows, [7.5 * cm, 3 * cm, 3 * cm, 3.5 * cm]))
    else:
        story.append(Paragraph("No missing values were found.", s["muted"]))

    story.append(Paragraph("3. Model Training Results", s["h2"]))
    if not trained_models:
        story.append(Paragraph("No models have been trained in this session yet.", s["muted"]))
    for model_key, info in trained_models.items():
        task = str(info.get("task", "")).capitalize()
        target = info.get("target_col")
        subtitle = f"{task} · target: {escape(str(target))}" if target else task
        story.append(Paragraph(f"{escape(str(info.get('name', model_key)))}", s["h3"]))
        story.append(Paragraph(subtitle, s["muted"]))
        story.append(Spacer(1, 0.1 * cm))
        metric_rows = [["Metric", "Value"]]
        for name, value in (info.get("metrics") or {}).items():
            if name in NON_METRIC_KEYS or value is None:
                continue
            metric_rows.append([name, _format_metric(name, value)])
        if len(metric_rows) > 1:
            story.append(_table(metric_rows, [8.5 * cm, 8.5 * cm]))
        story.append(Spacer(1, 0.3 * cm))

    story.append(Spacer(1, 0.6 * cm))
    story.append(
        Paragraph(
            "Metrics are estimates computed on a held-out test split of your data. "
            "Validate models before relying on them for real decisions.",
            s["footer"],
        )
    )

    doc.build(story)
    return buffer.getvalue()
