# Local Start-Up Guide 🚀

This guide explains how to properly start your LiveKit AI Voice Agent and the Developer Control Panel (UI) on your local computer (Mac/PC) for testing and configuration.

## Prerequisites

Before starting, ensure you have completed the following:
1. You have a terminal window open.
2. You are in your project folder (`/Users/shreyasraj/Desktop/inbound AI voice`).
3. You have created your `.env` file (or plan to enter your API keys entirely via the UI).

---

## 🛠️ Step 1: Start the Developer Control Panel (UI Server)

The UI Server allows you to easily configure your agent's prompt, select voices/models, and securely paste your API keys without touching code.

1. **Open a new Terminal window** and navigate to your project folder:
   ```bash
   cd "/Users/shreyasraj/Desktop/inbound AI voice"
   ```

2. **Activate your Python Virtual Environment** (the "sandbox"):
   ```bash
   source ".venv/bin/activate"
   ```
   *(You should see `(.venv)` appear at the beginning of your terminal prompt.)*

3. **Start the FastAPI UI Server**:
   ```bash
   python3 ui_server.py
   ```

4. **Open the Dashboard**:
   Open your web browser (Chrome, Safari, etc.) and go to:
   **[http://localhost:8000](http://localhost:8000)**

   *Note: If you get an `address already in use` error, it means the server is already running in another terminal window or in the background. Just open your browser to the link above!*

---

## ⚙️ Step 2: Configure Your Agent via the UI

Before starting the voice agent, let's make sure it has the keys it needs to run.

1. On the `http://localhost:8000` dashboard, go to the **🔑 API Credentials** tab.
2. Ensure at least the following four essential keys are filled in (if they aren't already in your `.env` file):
   - `LiveKit URL`
   - `LiveKit API Key`
   - `LiveKit API Secret`
   - `OpenAI API Key`
   - `Sarvam API Key`
3. Click **Save Configuration** at the bottom right.

---

## 🎙️ Step 3: Start the Voice Agent (Backend Worker)

Now that the UI is running and your keys are saved, it's time to start the actual AI application that answers calls.

1. **Open a SECOND new Terminal window** (leave the UI server running in the first one).
2. Navigate to your project folder and activate the virtual environment again:
   ```bash
   cd "/Users/shreyasraj/Desktop/inbound AI voice"
   source .venv/bin/activate
   ```

3. **Start the LiveKit Agent**:
   ```bash
   python3 agent.py dev
   ```

4. **Verify it's working**:
   Watch the terminal output. Within a few seconds, you should see a message saying:
   `INFO:livekit.agents:registered worker {"id": "...", "url": "wss://..."}`

   **Congratulations!** Your agent is now online and actively listening for incoming phone calls from Vobiz/LiveKit.

---

## 📞 Step 4: Make a Test Call

To verify everything is flowing correctly locally:

1. **Open a THIRD Terminal window**, navigate, and activate:
   ```bash
   cd "/Users/shreyasraj/Desktop/inbound AI voice"
   source ".venv/bin/activate"
   ```

2. **Run the Make Call script**, replacing the placeholder with your actual phone number:
   ```bash
   python3 make_call.py --to "+91XXXXXXXXXX"
   ```

3. Answer the call on your phone and start talking to your Med Spa Concierge!

---

## 🛑 How to Stop Everything
When you are done testing:
1. Go to the terminal window running `agent.py dev` and press **`CTRL + C`**.
2. Go to the terminal window running `ui_server.py` and press **`CTRL + C`**.
