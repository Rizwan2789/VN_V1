from io import BytesIO

from reportlab.lib.pagesizes import A5
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.models.payment import Payment
from app.models.student import Student


def generate_receipt_pdf(payment: Payment, student: Student) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A5)
    _, height = A5

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(20 * mm, height - 20 * mm, "Vista Nova Academy")
    pdf.setFont("Helvetica", 10)
    pdf.drawString(20 * mm, height - 27 * mm, "Fee Payment Receipt")
    pdf.line(20 * mm, height - 30 * mm, 130 * mm, height - 30 * mm)

    fee_record = payment.fee_record
    lines = [
        f"Receipt No: {payment.receipt_number}",
        f"Date: {payment.payment_date.isoformat()}",
        f"Student: {student.user.full_name} ({student.roll_no})",
        f"Batch: {student.batch.name}",
        f"Billing Period: {fee_record.period_month:02d}/{fee_record.period_year}",
        f"Amount Paid: Rs. {payment.amount}",
        f"Payment Method: {payment.payment_method or '-'}",
        f"Notes: {payment.transaction_notes or '-'}",
    ]

    y = height - 42 * mm
    pdf.setFont("Helvetica", 11)
    for line in lines:
        pdf.drawString(20 * mm, y, line)
        y -= 8 * mm

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
