import paramiko
import sys
import time
import socket

host = "187.127.133.164"
user = "root"
password = "Radheradhe14@"

print(f"Connecting to {host}...")
try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password, timeout=10)
    print("Connected successfully!")
    
    print("Executing Coolify install command...")
    # Run the interactive bash script but don't wait for input
    stdin, stdout, stderr = ssh.exec_command("curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash", get_pty=True)
    
    # Read output line by line
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            print(stdout.channel.recv(1024).decode('utf-8', errors='replace'), end="", flush=True)
        if stderr.channel.recv_stderr_ready():
            print(stderr.channel.recv_stderr(1024).decode('utf-8', errors='replace'), end="", file=sys.stderr, flush=True)
        time.sleep(0.1)

    # Flush the rest
    print(stdout.read().decode('utf-8', errors='replace'))
    
    status = stdout.channel.recv_exit_status()
    print(f"\nInstall finished with code {status}")
    ssh.close()
except paramiko.AuthenticationException:
    print("Authentication failed. Please check password.")
except socket.timeout:
    print("Connection timed out.")
except Exception as e:
    print(f"Error: {e}")
