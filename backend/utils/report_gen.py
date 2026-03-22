"""Generate a PDF report using ReportLab."""
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT


W, H = A4
BRAND = colors.HexColor("#6366f1")  # Indigo


def _header_style(styles):
    return ParagraphStyle("Header", parent=styles["Heading1"],
                          textColor=BRAND, fontSize=16, spaceAfter=6)


def _subheader_style(styles):
    return ParagraphStyle("SubHeader", parent=styles["Heading2"],
                          textColor=colors.HexColor("#334155"), fontSize=12, spaceAfter=4)


def _table_style():
    return TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])


def generate_report(
    filename: str,
    basic_info: dict,
    missing_info: dict,
    trained_models: dict,   # model_key -> { name, task, metrics }
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    h1 = _header_style(styles)
    h2 = _subheader_style(styles)
    normal = styles["Normal"]
    story = []

    # ── Title ──────────────────────────────────────────────────────────────
    story.append(Paragraph("MLInsights — Analysis Report", h1))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal))
    story.append(Paragraph(f"File: {filename}", normal))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND))
    story.append(Spacer(1, 0.4*cm))

    # ── Dataset Overview ───────────────────────────────────────────────────
    story.append(Paragraph("1. Dataset Overview", h2))
    overview_data = [
        ["Property", "Value"],
        ["Rows", str(basic_info.get("rows", "—"))],
        ["Columns", str(basic_info.get("columns", "—"))],
        ["Numeric Columns", str(len(basic_info.get("numeric_columns", [])))],
        ["Categorical Columns", str(len(basic_info.get("categorical_columns", [])))],
        ["Duplicate Rows", str(basic_info.get("duplicate_rows", "—"))],
        ["Memory Usage (KB)", str(basic_info.get("memory_usage_kb", "—"))],
    ]
    t = Table(overview_data, colWidths=[8*cm, 8*cm])
    t.setStyle(_table_style())
    story.append(t)
    story.append(Spacer(1, 0.5*cm))

    # ── Missing Values ─────────────────────────────────────────────────────
    story.append(Paragraph("2. Missing Values", h2))
    story.append(Paragraph(
        f"Total missing cells: <b>{missing_info.get('total_missing', 0)}</b> "
        f"({missing_info.get('total_missing_percentage', 0):.1f}% of all cells)",
        normal
    ))
    story.append(Spacer(1, 0.2*cm))

    per_col = missing_info.get("per_column", {})
    if per_col:
        mv_data = [["Column", "Missing Count", "Missing %", "Dtype"]]
        for col, info in per_col.items():
            if info["count"] > 0:
                mv_data.append([col, str(info["count"]), f"{info['percentage']:.1f}%", info["dtype"]])
        if len(mv_data) > 1:
            t2 = Table(mv_data, colWidths=[7*cm, 4*cm, 3.5*cm, 3.5*cm])
            t2.setStyle(_table_style())
            story.append(t2)
        else:
            story.append(Paragraph("No missing values found.", normal))
    story.append(Spacer(1, 0.5*cm))

    # ── Trained Models ─────────────────────────────────────────────────────
    if trained_models:
        story.append(Paragraph("3. Model Training Results", h2))

        for model_key, model_info in trained_models.items():
            story.append(Paragraph(f"<b>{model_info.get('name', model_key)}</b> "
                                   f"({model_info.get('task', '').capitalize()})", normal))
            metrics = model_info.get("metrics", {})
            if metrics:
                m_data = [["Metric", "Value"]]
                for k, v in metrics.items():
                    if v is not None:
                        m_data.append([k, f"{v:.4f}" if isinstance(v, float) else str(v)])
                mt = Table(m_data, colWidths=[9*cm, 7*cm])
                mt.setStyle(_table_style())
                story.append(mt)
            story.append(Spacer(1, 0.3*cm))

    # ── Footer ─────────────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("— End of Report —", ParagraphStyle(
        "Footer", parent=normal, textColor=colors.grey, alignment=TA_CENTER)))

    doc.build(story)
    return buffer.getvalue()
