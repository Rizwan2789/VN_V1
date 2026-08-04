from datetime import date


def format_receipt_number(payment_id: int, issued_on: date | None = None) -> str:
    year = (issued_on or date.today()).year
    return f"VN-{year}-{payment_id:06d}"
