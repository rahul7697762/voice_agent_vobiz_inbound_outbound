# Inbound AI Voice - Architecture Overview

This document provides a high-level architectural overview of the LiveKit Outbound Calling Agent project. 

The system is designed as a backend pipeline for an outbound AI voice agent, built primarily in Python. It heavily leverages **LiveKit** for WebRTC audio streaming, **OpenAI** (or Sarvam) for the conversational AI, and **Vobiz** for SIP trunking to make actual phone calls.

---

## 1. System Components

The codebase is organized into modular Python files under the `src/` directory, each with a specific responsibility.

### 1.1 Core AI Worker ([src/agent.py](file:///c:/Users/rahul/InboundAIVoice/src/agent.py))
This is the heart of the voice agent. It is a long-running process that listens for dispatched LiveKit jobs and connects to isolated voice rooms.
- **Voice Activity Detection (VAD) & WebRTC**: Interfaces with the LiveKit Python SDK (`JobContext`, `Room`) to manage raw audio streams.
- **Conversational AI ([OutboundAssistant](file:///c:/Users/rahul/InboundAIVoice/src/agent.py#234-257))**: Powered by an LLM (typically GPT-4o-mini). It utilizes `livekit.plugins.openai` (or `sarvam` for regional voices) and `silero` for VAD.
- **Function Calling ([AgentTools](file:///c:/Users/rahul/InboundAIVoice/src/agent.py#105-228))**: The AI is equipped with executable tools to perform actions during the call:
  - [transfer_call](file:///c:/Users/rahul/InboundAIVoice/src/agent.py#121-155): Transfers the user to a human agent.
  - [end_call](file:///c:/Users/rahul/InboundAIVoice/src/agent.py#159-183): Hangs up the call.
  - [save_booking_intent](file:///c:/Users/rahul/InboundAIVoice/src/agent.py#187-208): Captures the caller's details for an appointment.
  - [cancel_appointment](file:///c:/Users/rahul/InboundAIVoice/src/agent.py#212-228): Cancels an existing booking.
- **Entrypoint**: The [entrypoint](file:///c:/Users/rahul/InboundAIVoice/src/agent.py#263-618) function orchestrates the lifecycle of a call, hooking into events like [on_user_speech_started](file:///c:/Users/rahul/InboundAIVoice/src/agent.py#359-365), handling TTS interruptions, and gracefully shutting down when a participant disconnects.

### 1.2 Dashboard Server ([src/ui_server.py](file:///c:/Users/rahul/InboundAIVoice/src/ui_server.py))
A **FastAPI** web server that provides a real-time monitor and control panel for the med-spa administrators.
- **Config Management**: Reads and writes to [config.json](file:///c:/Users/rahul/InboundAIVoice/config.json) dynamically via `/api/config`.
- **CRM & Analytics**: Provides endpoints to fetch call logs (`/api/bookings`), contact deduplication (`/api/contacts`), and aggregate statistics (`/api/stats`).
- **Web UI**: Serves a monolithic HTML payload ([get_dashboard()](file:///c:/Users/rahul/InboundAIVoice/src/ui_server.py#170-898)) that renders the frontend dashboard containing call history and active settings.

### 1.3 Database Layer ([src/db.py](file:///c:/Users/rahul/InboundAIVoice/src/db.py))
Manages persistent storage using **Supabase** (PostgreSQL).
- **Schema**: Primarily interacts with a [call_logs](file:///c:/Users/rahul/InboundAIVoice/src/db.py#57-71) table.
- **Operations**:
  - [save_call_log](file:///c:/Users/rahul/InboundAIVoice/src/db.py#24-56): Saves call duration, transcript, and AI-generated summary.
  - [fetch_call_logs](file:///c:/Users/rahul/InboundAIVoice/src/db.py#57-71) / [fetch_bookings](file:///c:/Users/rahul/InboundAIVoice/src/db.py#73-93): Retrieves historical data for the UI dashboard.
  - [fetch_stats](file:///c:/Users/rahul/InboundAIVoice/src/db.py#95-114): Computes Key Performance Indicators (KPIs) like booking rate and average call duration.

### 1.4 Calendar Integration ([src/calendar_tools.py](file:///c:/Users/rahul/InboundAIVoice/src/calendar_tools.py))
A utility module for connecting the voice agent to scheduling infrastructure (**Cal.com**).
- **Slot Fetching ([get_available_slots](file:///c:/Users/rahul/InboundAIVoice/src/calendar_tools.py#20-55))**: Queries Cal.com for available timeslots on a given date.
- **Booking Engine ([async_create_booking](file:///c:/Users/rahul/InboundAIVoice/src/calendar_tools.py#75-128))**: Books an appointment asynchronously via the Cal.com v2 API.
- **Cancellation ([cancel_booking](file:///c:/Users/rahul/InboundAIVoice/src/calendar_tools.py#132-153))**: Exposes an endpoint to delete an existing booking by its UID.

### 1.5 Notification System ([src/notify.py](file:///c:/Users/rahul/InboundAIVoice/src/notify.py))
A real-time alerting module that sends messages to a **Telegram** channel.
- **Templates**: Contains pre-formatted rich text templates for various call outcomes:
  - [notify_booking_confirmed](file:///c:/Users/rahul/InboundAIVoice/src/notify.py#43-75)
  - [notify_booking_cancelled](file:///c:/Users/rahul/InboundAIVoice/src/notify.py#77-97)
  - [notify_call_no_booking](file:///c:/Users/rahul/InboundAIVoice/src/notify.py#99-123)
  - [notify_agent_error](file:///c:/Users/rahul/InboundAIVoice/src/notify.py#125-138) (for instant debugging of crashed calls).

---

## 2. Configuration & State

- **[config.json](file:///c:/Users/rahul/InboundAIVoice/config.json)**: Acts as the dynamic brain of the agent. It stores the "System Prompt" (`agent_instructions`), LLM model choices, and VAD thresholds. This file can be hot-reloaded by the `ui_server`.
- **[.env.local](file:///c:/Users/rahul/InboundAIVoice/.env.local)**: Holds static secrets and infrastructure keys, including LiveKit credentials, OpenAI keys, Supabase URLs, Telegram Bot tokens, and Vobiz SIP credentials.
- **Timezone Awareness**: The [agent.py](file:///c:/Users/rahul/InboundAIVoice/src/agent.py) injects a dynamic prompt containing current IST time ([get_ist_time_context()](file:///c:/Users/rahul/InboundAIVoice/src/agent.py#59-83)) to help the LLM seamlessly resolve relative dates like "next Thursday".

---

## 3. Communication Flow (How a Call Works)

1. **Trigger**: An external script (`make_call.py`) uses LiveKit's API to dispatch a job targeting a specific phone number via the Vobiz SIP trunk ID.
2. **Acceptance**: The running [agent.py](file:///c:/Users/rahul/InboundAIVoice/src/agent.py) process accepts the job and joins the newly created LiveKit WebRTC room.
3. **Connection**: The LiveKit Cloud platform bridges the WebRTC room to the regular phone network (PSTN) via the configured Vobiz SIP credentials.
4. **Conversation**: 
   - User speaks -> Silero VAD detects speech -> Deepgram/OpenAI converts STT.
   - The LLM processes the text against its prompt and dynamic context.
   - LLM responds -> OpenAI/ElevenLabs TTS -> Streamed back to the phone call.
5. **Action**: During the call, if the user agrees to a time, the LLM calls [save_booking_intent](file:///c:/Users/rahul/InboundAIVoice/src/agent.py#187-208) which triggers [calendar_tools.py](file:///c:/Users/rahul/InboundAIVoice/src/calendar_tools.py) to book the slot and [notify.py](file:///c:/Users/rahul/InboundAIVoice/src/notify.py) to ping Telegram.
6. **Teardown**: When the call finishes, [db.py](file:///c:/Users/rahul/InboundAIVoice/src/db.py) is called to save the [call_logs](file:///c:/Users/rahul/InboundAIVoice/src/db.py#57-71) in Supabase, and the agent safely disconnects.
