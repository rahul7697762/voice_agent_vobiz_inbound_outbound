from pathlib import Path
import asyncio
import os
from dotenv import load_dotenv, set_key
from livekit import api

# Load .env.local from the project root
_env_path = Path(__file__).resolve().parent.parent / ".env.local"
if not _env_path.exists():
    _env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

async def main():
    lkapi = api.LiveKitAPI()
    sip = lkapi.sip

    trunk_id = os.getenv("OUTBOUND_TRUNK_ID", "").strip()
    address  = os.getenv("VOBIZ_SIP_DOMAIN", "").strip()
    username = os.getenv("VOBIZ_USERNAME", "").strip()
    password = os.getenv("VOBIZ_PASSWORD", "").strip()
    number   = os.getenv("VOBIZ_OUTBOUND_NUMBER", "").strip()

    print("=== VoBiz Outbound Trunk Setup ===")
    print(f"  SIP Domain : {address}")
    print(f"  Username   : {username}")
    print(f"  Number     : {number}")
    print(f"  Trunk ID   : {trunk_id or '(none - will create new)'}")
    print()

    if not address or not username or not password or not number:
        print("[FAIL] Missing VoBiz credentials in .env.local")
        await lkapi.aclose()
        return

    # If trunk_id exists, try to update it first
    if trunk_id:
        print(f"Trying to update existing trunk: {trunk_id}")
        try:
            await sip.update_outbound_trunk_fields(
                trunk_id,
                address=address,
                auth_username=username,
                auth_password=password,
                numbers=[number],
            )
            print("[OK] Outbound SIP trunk updated successfully!")
            await lkapi.aclose()
            return
        except Exception as update_err:
            print(f"[WARN] Trunk not found in LiveKit (stale ID). Creating new one...")
            # Clear the stale ID
            trunk_id = ""

    # Create a new outbound trunk
    try:
        print("Creating new outbound SIP trunk with VoBiz credentials...")
        trunk = await sip.create_sip_outbound_trunk(
            api.CreateSIPOutboundTrunkRequest(
                trunk=api.SIPOutboundTrunkInfo(
                    name="VoBiz Outbound",
                    address=address,
                    numbers=[number],
                    auth_username=username,
                    auth_password=password,
                )
            )
        )
        new_id = trunk.sip_trunk_id
        print(f"[OK] Outbound SIP trunk created! Trunk ID: {new_id}")

        # Save trunk ID back to .env.local
        set_key(str(_env_path), "OUTBOUND_TRUNK_ID", new_id)
        print(f"[OK] OUTBOUND_TRUNK_ID saved to .env.local automatically")

    except Exception as e:
        print(f"[FAIL] Could not create trunk: {e}")
    finally:
        await lkapi.aclose()

if __name__ == "__main__":
    asyncio.run(main())
