import os
import json
import logging
import requests
from pathlib import Path
from datetime import datetime

logger = logging.getLogger("notify")

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID   = os.environ.get("TELEGRAM_CHAT_ID", "")
TELEGRAM_URL       = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.json"


def _get_whatsapp_config() -> dict:
    """Read WhatsApp credentials and settings from config.json."""
    try:
        if _CONFIG_PATH.exists():
            with open(_CONFIG_PATH) as f:
                c = json.load(f)
            return {
                "phone_number_id":   c.get("whatsapp_phone_number_id", ""),
                "token":             c.get("whatsapp_token", ""),
                "admin_number":      c.get("admin_whatsapp_number", ""),
                "client_template":   c.get("whatsapp_client_template", "acknowledgement"),
                "admin_template":    c.get("whatsapp_admin_template", "acknowledgement"),
            }
    except Exception as e:
        logger.error(f"[WHATSAPP] Could not read config: {e}")
    return {}


def send_whatsapp_template(
    to_phone: str,
    template_name: str,
    body_params: list,
    phone_number_id: str,
    token: str,
) -> bool:
    """Send a WhatsApp template message via Meta Cloud API."""
    if not phone_number_id or not token or not to_phone:
        logger.warning("[WHATSAPP] Missing phone_number_id, token, or recipient — skipping.")
        return False

    clean_phone = to_phone.replace("+", "").replace(" ", "").replace("-", "")
    url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": clean_phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": str(p)} for p in body_params],
                }
            ],
        },
    }
    try:
        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=payload,
            timeout=10,
        )
        resp.raise_for_status()
        logger.info(f"[WHATSAPP] Sent '{template_name}' → {clean_phone}")
        return True
    except Exception as e:
        logger.error(f"[WHATSAPP] Failed → {clean_phone}: {e}")
        return False


# ─── Core sender ───────────────────────────────────────────────────────────────

def send_telegram(message: str) -> bool:
    """
    Fire a single POST to Telegram. No library needed.
    Supports Markdown formatting: *bold*, _italic_, `code`
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("[TELEGRAM] Token or Chat ID not set in .env — skipping.")
        return False
    try:
        resp = requests.post(
            TELEGRAM_URL,
            json={
                "chat_id":    TELEGRAM_CHAT_ID,
                "text":       message,
                "parse_mode": "Markdown",
            },
            timeout=5,
        )
        resp.raise_for_status()
        logger.info("[TELEGRAM] Message sent successfully.")
        return True
    except Exception as e:
        logger.error(f"[TELEGRAM] Failed: {e}")
        return False


# ─── Message Templates ─────────────────────────────────────────────────────────

def notify_booking_confirmed(
    caller_name: str,
    caller_phone: str,
    booking_time_iso: str,
    booking_id: str,
    notes: str = "",
    tts_voice: str = "",
    ai_summary: str = "",
) -> bool:
    """
    Sends booking confirmation via Telegram + WhatsApp (client & admin).
    """
    try:
        dt = datetime.fromisoformat(booking_time_iso)
        readable = dt.strftime("%A, %d %B %Y at %-I:%M %p IST")
    except Exception:
        readable = booking_time_iso

    # ── Telegram ──────────────────────────────────────────────────────────────
    message = (
        f"✅ *New Booking Confirmed!*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 *Name:*        {caller_name}\n"
        f"📞 *Phone:*       `{caller_phone}`\n"
        f"📅 *Time:*        {readable}\n"
        f"🔖 *Booking ID:*  `{booking_id}`\n"
        f"📝 *Notes:*       {notes or '—'}\n"
        f"🎙️ *Voice Model:* {tts_voice or '—'}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        + (f"💬 *AI Summary:*\n_{ai_summary}_\n\n" if ai_summary else "")
        + f"_Booked via RapidXAI Voice Agent_ 🤖"
    )
    send_telegram(message)

    # ── WhatsApp ──────────────────────────────────────────────────────────────
    wa = _get_whatsapp_config()
    if wa.get("phone_number_id") and wa.get("token"):
        # To client: confirmation with their name
        send_whatsapp_template(
            to_phone=caller_phone,
            template_name=wa["client_template"],
            body_params=[caller_name],
            phone_number_id=wa["phone_number_id"],
            token=wa["token"],
        )
        # To admin: lead details — name, phone, booked time
        if wa.get("admin_number"):
            send_whatsapp_template(
                to_phone=wa["admin_number"],
                template_name=wa["admin_template"],
                body_params=[caller_name, caller_phone, readable],
                phone_number_id=wa["phone_number_id"],
                token=wa["token"],
            )

    return True


def notify_booking_cancelled(
    caller_name: str,
    caller_phone: str,
    booking_id: str,
    reason: str = "",
) -> bool:
    """
    Sends a Telegram message when a booking is cancelled during the call.
    """
    message = (
        f"❌ *Booking Cancelled*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 *Name:*      {caller_name}\n"
        f"📞 *Phone:*     `{caller_phone}`\n"
        f"🔖 *Booking ID:* `{booking_id}`\n"
        f"💬 *Reason:*    {reason or 'Caller changed mind'}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"_RapidXAI Voice Agent_ 🤖"
    )
    return send_telegram(message)


def notify_call_no_booking(
    caller_name: str,
    caller_phone: str,
    call_summary: str = "",
    tts_voice: str = "",
    ai_summary: str = "",
    duration_seconds: int = 0,
) -> bool:
    """
    Fires when a call ends WITHOUT any booking — sends Telegram + WhatsApp lead alert to admin.
    """
    # ── Telegram ──────────────────────────────────────────────────────────────
    message = (
        f"📵 *Call Ended — No Booking*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 *Name:*        {caller_name or 'Unknown'}\n"
        f"📞 *Phone:*       `{caller_phone}`\n"
        f"⏱️ *Duration:*    {duration_seconds}s\n"
        f"🎙️ *Voice Model:* {tts_voice or '—'}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        + (f"💬 *AI Summary:*\n_{ai_summary or call_summary or 'Caller did not schedule.'}_\n\n")
        + f"_Consider a manual follow-up call_ 📲\n"
        f"_RapidXAI Voice Agent_ 🤖"
    )
    send_telegram(message)

    # ── WhatsApp → admin only (lead alert, no client message for missed bookings) ──
    wa = _get_whatsapp_config()
    if wa.get("phone_number_id") and wa.get("token") and wa.get("admin_number"):
        send_whatsapp_template(
            to_phone=wa["admin_number"],
            template_name=wa["admin_template"],
            body_params=[caller_name or "Unknown", caller_phone, "No booking made"],
            phone_number_id=wa["phone_number_id"],
            token=wa["token"],
        )

    return True


def notify_agent_error(caller_phone: str, error: str) -> bool:
    """
    Fires if something crashes mid-call so you always know about failures.
    """
    message = (
        f"⚠️ *Agent Error During Call*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"📞 *Phone:*  `{caller_phone}`\n"
        f"🔴 *Error:*  `{error}`\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"_RapidXAI Voice Agent_ 🤖"
    )
    return send_telegram(message)
