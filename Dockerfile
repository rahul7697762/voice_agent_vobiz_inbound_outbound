FROM python:3.11-slim

# Install system libs needed by silero/onnxruntime
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (cache-efficient)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project source
COPY . .

# Default: run the voice agent worker
CMD ["python", "src/voice_agent.py", "start"]
