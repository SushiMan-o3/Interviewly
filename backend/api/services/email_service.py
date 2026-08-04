import logging
import smtplib
from email.message import EmailMessage

from api.config import SMTP_FROM_EMAIL, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USERNAME

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    subject = "Reset your Interviewly password"
    body = (
        "We received a request to reset your Interviewly password.\n\n"
        f"Reset it here: {reset_link}\n\n"
        "This link expires soon. If you didn't request this, you can ignore this email."
    )

    if not SMTP_HOST:
        logger.info("SMTP not configured; printing password reset link instead.\nTo: %s\n%s", to_email, body)
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = SMTP_FROM_EMAIL
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        if SMTP_USERNAME and SMTP_PASSWORD:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(message)
