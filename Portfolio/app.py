
import os
import re
import smtplib
import sqlite3
from pathlib import Path
from email.message import EmailMessage

from flask import Flask, render_template, request, flash, redirect, url_for

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-this-for-production")

# Persistent database location
BASE_DIR = Path(__file__).resolve().parent
DATABASE = Path(
    os.environ.get("FEEDBACK_DB", str(BASE_DIR / "feedback.db"))
)


def get_db():
    """Open a connection to the feedback database."""
    connection = sqlite3.connect(DATABASE, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    """Create the feedback table if it does not exist."""
    DATABASE.parent.mkdir(parents=True, exist_ok=True)

    with get_db() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
                message TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)


# Initialize the database when the application starts.
init_db()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/contact", methods=["POST"])
def contact():
    name = request.form.get("name", "").strip()
    sender_email = request.form.get("email", "").strip()
    subject = request.form.get("subject", "").strip()
    message = request.form.get("message", "").strip()

    if not all([name, sender_email, subject, message]):
        flash("Please complete every field.", "error")
        return redirect(url_for("home") + "#contact")

    if len(name) > 100 or len(sender_email) > 254:
        flash("Please check your name and email address.", "error")
        return redirect(url_for("home") + "#contact")

    if (
        not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", sender_email)
        or "\n" in sender_email
    ):
        flash("Please enter a valid email address.", "error")
        return redirect(url_for("home") + "#contact")

    if len(subject) > 150 or len(message) > 5000:
        flash("Your subject or message is too long.", "error")
        return redirect(url_for("home") + "#contact")

    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    recipient = os.environ.get("CONTACT_EMAIL")

    if not all([smtp_host, smtp_user, smtp_password, recipient]):
        flash(
            "The contact service is not configured yet. "
            "Please contact me through Instagram for now.",
            "error",
        )
        return redirect(url_for("home") + "#contact")

    email = EmailMessage()
    email["Subject"] = f"Portfolio contact: {subject}"
    email["From"] = smtp_user
    email["To"] = recipient
    email["Reply-To"] = sender_email
    email.set_content(
        f"New portfolio message\n\n"
        f"Name: {name}\n"
        f"Email: {sender_email}\n"
        f"Subject: {subject}\n\n"
        f"Message:\n{message}"
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(email)

        flash("Message sent successfully! Thanks for reaching out.", "success")

    except (OSError, smtplib.SMTPException, ValueError):
        app.logger.exception("Portfolio contact email failed.")
        flash(
            "Sorry, your message could not be sent. "
            "Please try Instagram instead.",
            "error",
        )

    return redirect(url_for("home") + "#contact")


@app.route("/feedback", methods=["POST"])
def feedback():
    name = request.form.get("feedback_name", "").strip()
    message = request.form.get("feedback_message", "").strip()
    rating_text = request.form.get("rating", "").strip()

    # Validate the submitted fields.
    if not name or not message or not rating_text:
        flash("Please complete your name, rating, and feedback.", "error")
        return redirect(url_for("home") + "#feedback")

    if len(name) > 100:
        flash("Your name must be 100 characters or fewer.", "error")
        return redirect(url_for("home") + "#feedback")

    if len(message) < 3 or len(message) > 2000:
        flash("Feedback must contain between 3 and 2000 characters.", "error")
        return redirect(url_for("home") + "#feedback")

    if rating_text not in {"1", "2", "3", "4", "5"}:
        flash("Please select a rating from 1 to 5 stars.", "error")
        return redirect(url_for("home") + "#feedback")

    try:
        with get_db() as connection:
            connection.execute(
                """
                INSERT INTO feedback (name, rating, message)
                VALUES (?, ?, ?)
                """,
                (name, int(rating_text), message),
            )

        flash("Thank you! Your feedback has been saved.", "success")

    except sqlite3.Error:
        app.logger.exception("Could not save portfolio feedback.")
        flash("Sorry, feedback could not be saved. Please try again.", "error")

    return redirect(url_for("home") + "#feedback")


if __name__ == "__main__":
    app.run(debug=True)
