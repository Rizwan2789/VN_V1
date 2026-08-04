from datetime import date
from decimal import Decimal


def compute_status(amount_due: Decimal, amount_paid: Decimal, due_date: date, today: date) -> str:
    if amount_paid >= amount_due:
        return "PAID"
    if amount_paid > 0:
        return "PARTIAL"
    if due_date < today:
        return "OVERDUE"
    return "PENDING"
