"""Plain functions returning (subject, body) — keeps email copy centralized
instead of scattered across service/router call sites."""


def credentials_email(full_name: str, login_id: str, temporary_password: str) -> tuple[str, str]:
    subject = "Your Vista Nova Academy login details"
    body = (
        f"Hi {full_name},\n\n"
        "Your application has been approved. You can now sign in with:\n\n"
        f"  Roll number: {login_id}\n"
        f"  Temporary password: {temporary_password}\n\n"
        "Please sign in and keep this password to yourself.\n\n"
        "— Vista Nova Academy"
    )
    return subject, body


def signup_rejected_email(full_name: str, reason: str | None) -> tuple[str, str]:
    subject = "Update on your Vista Nova Academy application"
    reason_line = f"\n\nReason: {reason}" if reason else ""
    body = (
        f"Hi {full_name},\n\n"
        "Your application could not be approved at this time."
        f"{reason_line}\n\n"
        "If you believe this is a mistake, please contact the school office.\n\n"
        "— Vista Nova Academy"
    )
    return subject, body


def password_reset_approved_email(full_name: str, login_id: str, temporary_password: str) -> tuple[str, str]:
    subject = "Your Vista Nova Academy password has been reset"
    body = (
        f"Hi {full_name},\n\n"
        "Your password reset request has been approved. Your new temporary "
        "password is:\n\n"
        f"  {temporary_password}\n\n"
        f"Sign in with your login ({login_id}) and this password.\n\n"
        "— Vista Nova Academy"
    )
    return subject, body


def password_reset_rejected_email(full_name: str, reason: str | None) -> tuple[str, str]:
    subject = "Your Vista Nova Academy password reset request"
    reason_line = f"\n\nReason: {reason}" if reason else ""
    body = (
        f"Hi {full_name},\n\n"
        "Your password reset request could not be approved."
        f"{reason_line}\n\n"
        "Please contact the school office if you still need access.\n\n"
        "— Vista Nova Academy"
    )
    return subject, body
