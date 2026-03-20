version: "3.9"

services:
  # ── Voice Agent Worker ────────────────────────────────────────────────────
  voice-agent:
    build: .
    command: python src/voice_agent.py start
    restart: always
    env_file:
      - .env
    environment:
      - PYTHONUNBUFFERED=1

  # ── UI / API Server ───────────────────────────────────────────────────────
  ui-server:
    build: .
    command: python src/main.py
    restart: always
    ports:
      - "8080:8080"
    env_file:
      - .env
    environment:
      - PYTHONUNBUFFERED=1
    depends_on:
      - voice-agent
