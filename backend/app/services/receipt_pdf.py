from datetime import date
from decimal import Decimal
from io import BytesIO
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A5
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.models.payment import Payment
from app.models.student import Student

PAYMENT_METHOD_LABELS = {"CASH": "Cash", "BANK_TRANSFER": "Bank Transfer", "ONLINE": "Online"}

LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "vn-logo.jpg"

PRIMARY = HexColor("#123C85")
TEXT = HexColor("#080808")
MUTED = HexColor("#52555C")
BORDER = HexColor("#DFE0E3")


def _money(amount: Decimal) -> str:
    return f"Rs. {amount:,.2f}"


def _format_date(value: date) -> str:
    # "14 Aug 2026" — %d zero-pads (e.g. "04"), so build it from parts
    # instead of relying on the non-portable %-d/%e strftime flags.
    return f"{value.day} {value.strftime('%b %Y')}"


def generate_receipt_pdf(payment: Payment, student: Student) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A5)
    width, height = A5
    margin = 18 * mm
    top = height - margin

    # --- Header: logo + academy name ---
    logo_size = 16 * mm
    text_x = margin
    if LOGO_PATH.exists():
        pdf.drawImage(
            str(LOGO_PATH),
            margin,
            top - logo_size,
            width=logo_size,
            height=logo_size,
            mask="auto",
            preserveAspectRatio=True,
            anchor="c",
        )
        text_x = margin + logo_size + 4 * mm

    pdf.setFillColor(TEXT)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(text_x, top - 7 * mm, "Vista Nova Academy")
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 10)
    pdf.drawString(text_x, top - 13 * mm, "Fee Payment Receipt")

    rule_y = top - logo_size - 5 * mm
    pdf.setStrokeColor(PRIMARY)
    pdf.setLineWidth(1.3)
    pdf.line(margin, rule_y, width - margin, rule_y)

    # --- Body rows: label on the left, value on the right ---
    fee_record = payment.fee_record
    rows = [
        ("Receipt No.", payment.receipt_number),
        ("Date", _format_date(payment.payment_date)),
        ("Student", f"{student.user.full_name} ({student.roll_no})"),
        ("Batch", student.batch.name),
        ("Billing Period", f"{fee_record.period_month:02d}/{fee_record.period_year}"),
        ("Payment Method", PAYMENT_METHOD_LABELS.get(payment.payment_method, payment.payment_method) or "-"),
        ("Notes", payment.transaction_notes or "-"),
    ]

    row_height = 9 * mm
    y = rule_y - 12 * mm
    for label, value in rows:
        pdf.setFont("Helvetica", 10.5)
        pdf.setFillColor(MUTED)
        pdf.drawString(margin, y, label)
        pdf.setFont("Helvetica-Bold", 10.5)
        pdf.setFillColor(TEXT)
        pdf.drawRightString(width - margin, y, str(value))
        y -= row_height

    # --- Total, set apart at the bottom as the one number that matters most ---
    total_rule_y = y - 3 * mm
    pdf.setStrokeColor(BORDER)
    pdf.setLineWidth(0.75)
    pdf.line(margin, total_rule_y, width - margin, total_rule_y)

    total_y = total_rule_y - 11 * mm
    pdf.setFillColor(PRIMARY)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(margin, total_y, "Total Paid")
    pdf.drawRightString(width - margin, total_y, _money(payment.amount))

    # --- Footer ---
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica-Oblique", 8)
    pdf.drawCentredString(
        width / 2, margin / 2, "This is a computer-generated receipt and does not require a signature."
    )

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
