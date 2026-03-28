#!/bin/bash

# =========================================================================
# Acadex Total System Bootstrap Script
# 
# Installs: Python3, Pip, Git, Curl, Wget, Docker, Docker Compose, 
# Kubernetes (kubectl + Minikube for local dev), and project dependencies.
# =========================================================================

set -e

# Helper function to print bold text
echo_b() {
    echo -e "\033[1;34m======================================\033[0m"
    echo -e "\033[1;32m$1\033[0m"
    echo -e "\033[1;34m======================================\033[0m"
}

# Require sudo privileges
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo." 
   exit 1
fi

echo_b "Updating system packages..."
apt-get update -y
apt-get upgrade -y

echo_b "Installing basic tools (git, curl, wget, jq, apt-transport-https, software-properties-common)..."
apt-get install -y git curl wget jq apt-transport-https software-properties-common ca-certificates build-essential libpam0g-dev

echo_b "Installing Python 3 and Pip..."
apt-get install -y python3 python3-pip python3-venv python3-dev
# Extensively ignore the apt debian package marker when using system pip on Debian/Ubuntu
export PIP_BREAK_SYSTEM_PACKAGES=1
# Do not attempt to upgrade pip itself globally using pip because the apt layer blocks its uninstall. Use --ignore-installed if forced.
# Ensure waiter requirements are met (ignore externally managed logic)
pip3 install flask gunicorn python-pam python-dotenv --break-system-packages || pip3 install flask gunicorn python-pam python-dotenv --ignore-installed

echo_b "Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Set up the Docker repository
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group (if $SUDO_USER is defined)
    if [ -n "$SUDO_USER" ]; then
        usermod -aG docker $SUDO_USER
        echo "Added $SUDO_USER to the docker group."
    fi
else
    echo "Docker is already installed."
fi

# Docker Compose check (usually bundled in docker-compose-plugin now, but link backward compatibility if needed)
echo_b "Checking Docker Compose..."
if ! docker compose version &> /dev/null; then
    echo "Installing standalone docker-compose v2 legacy binary..."
    curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo_b "Installing Kubernetes Tools (kubectl)..."
if ! command -v kubectl &> /dev/null; then
    curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
    echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
    apt-get update -y
    apt-get install -y kubectl
else
    echo "kubectl is already installed."
fi

echo_b "Installing Kubernetes Platform (Minikube)..."
if ! command -v minikube &> /dev/null; then
    # Minikube is excellent for local dev testing k8s arrays easily
    curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
    chmod +x minikube
    install minikube /usr/local/bin/
    rm -f minikube
else
    echo "Minikube is already installed."
fi

# Ensure conntrack is installed as minikube requires it for some drivers
apt-get install -y conntrack

echo_b "Initializing Minikube environment..."
# Start minikube as the normal user if possible to avoid root/docker driver conflicts
if [ -n "$SUDO_USER" ]; then
    echo "Starting minikube as $SUDO_USER..."
    sudo -u $SUDO_USER minikube start --force
else
    echo "Starting minikube as root (forcing)..."
    minikube start --force
fi

echo_b "Installing ngrok..."
if ! command -v ngrok &> /dev/null; then
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update && sudo apt install ngrok
else
    echo "ngrok is already installed."
fi

echo_b "Bootstrap Complete!"
echo ""
echo "Please verify everything is correctly built. To test everything natively without rebooting you may"
echo "need to switch to your user to inherit the new 'docker' group permissions:"
echo ""
if [ -n "$SUDO_USER" ]; then
    echo "    su - $SUDO_USER"
fi
echo ""
echo "From there, run:"
echo "    cd $(pwd)"
echo "    python3 waiter/install.py"
echo ""
