from pathlib import Path
from dotenv import load_dotenv
import os, urllib.request, json

# Load .env.local from project root
load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")

token = os.getenv("TELEGRAM_BOT_TOKEN", "")
if not token or "AAxx" in token or "1234567890" in token:
    print("ERROR: Bot token is still a placeholder.")
    print("Update TELEGRAM_BOT_TOKEN in .env.local first.")
else:
    url = f"https://api.telegram.org/bot{token}/getUpdates"
    try:
        res = json.loads(urllib.request.urlopen(url).read())
        results = res.get("result", [])
        if not results:
            print("No messages found!")
            print("-> Go to Telegram, open @bitlance123_bot, send any message, then run this again.")
        else:
            print("Found chats:")
            for r in results:
                chat = r.get("message", {}).get("chat", {})
                if chat:
                    print(f"  Chat ID : {chat.get('id')}")
                    print(f"  Name    : {chat.get('first_name', '')} {chat.get('last_name', '')}")
                    print(f"  Username: @{chat.get('username', 'N/A')}")
                    print()
    except Exception as e:
        print(f"Error: {e}")
