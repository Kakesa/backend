import sys
import os
import subprocess
from deployer import deploy

# Base environment variables fundamentally required by Waiter & Shadow
REQUIRED_ENV_VARS = [
    "ACADEX_REPO_URL",       # Needed to clone the codebase
    "ACADEX_ORCHESTRATOR",   # Needed to decide between docker-compose or kubernetes
    "GITHUB_SECRET",         # Needed to securely verify GitHub webhooks
    "JWT_SECRET"             # Needed by Shadow for authentication tokens
]

def install_ngrok():
    print("Installing URL tunnel tool: ngrok...")
    try:
        # Standard silent install of ngrok (fallbacks to ~/.local/bin if not root)
        cmd = '''
        if ! command -v ngrok &> /dev/null; then
            echo "ngrok not found, downloading..."
            mkdir -p ~/.local/bin
            wget -qO- https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | tar xvz -C ~/.local/bin || \
            wget -qO- https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | sudo tar xvz -C /usr/local/bin
            echo "Installed ngrok successfully."
        else
            echo "ngrok is already installed."
        fi
        '''
        subprocess.run(cmd, executable='/bin/bash', shell=True, check=True)
    except subprocess.CalledProcessError:
        print("Warning: failed to automatically fetch ngrok. You may need to manually install it.")

def main():
    print("Starting one-time installation for Acadex...")
    
    # Allow mapping the argv to the env var for ease of use
    if len(sys.argv) > 1 and not os.getenv("ACADEX_REPO_URL"):
        os.environ["ACADEX_REPO_URL"] = sys.argv[1]
        
    # Check for missing required variables
    missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
    
    if missing_vars:
        print("Error: Installation failed. The following required environment variables are missing:")
        for var in missing_vars:
            print(f"  - {var}")
        print("\nPlease set them before running the script. Example:")
        print("export ACADEX_REPO_URL='https://github.com/.../repo.git'")
        print("export ACADEX_ORCHESTRATOR='kubernetes'")
        print("export GITHUB_SECRET='your_secure_random_string'")
        print("export JWT_SECRET='your_secure_jwt_secret'")
        sys.exit(1)
        
    repo_url = os.getenv("ACADEX_REPO_URL")
    
    success = deploy(repo_url)
    install_ngrok()

    # Move acadex script to a system path
    print("Installing the 'acadex' CLI to /usr/local/bin...")
    try:
        subprocess.run(["sudo", "cp", "scripts/acadex", "/usr/local/bin/acadex"], check=True)
        subprocess.run(["sudo", "chmod", "+x", "/usr/local/bin/acadex"], check=True)
        print("'acadex' CLI installed globally. You can now type 'acadex' from anywhere.")
    except Exception as e:
        print(f"Warning: Failed to install 'acadex' globally, you might need to run the installer with sudo, or copy it manually. Error: {e}")

    if success:
        print("\n" + "="*60)
        print("🎉 Installation complete! The Acadex suite is now running.")
        print("="*60)
        print("\n🚨 ACTION REQUIRED: Configure ngrok manually using your auth token.")
        print("Run the following command to link your account:")
        print("   ngrok config add-authtoken <YOUR_NGROK_TOKEN>")
        print("\nOnce configured, you can expose your applications by navigating to the repo and running:")
        print("   acadex tunnel")
        print("\nOther available commands:")
        print("   acadex kill   # Stops all services securely")
        print("   acadex start  # Boots all services back up")
        sys.exit(0)
    else:
        print("\nInstallation failed. Please review the error logs above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
