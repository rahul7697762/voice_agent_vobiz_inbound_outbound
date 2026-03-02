import subprocess

# Add creationflags to hide the CMD window on Windows
subprocess.Popen(
    ["python", "agent.py", "start"],
    creationflags=subprocess.CREATE_NO_WINDOW  # ← this hides the CMD
)
