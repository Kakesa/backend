#!/bin/bash

# Check if an email argument is provided
if [ -z "$1" ]; then
  echo "Error: Missing email address."
  echo "Usage: ./generate_github_ssh_key.sh <email-address>"
  echo "Example: ./generate_github_ssh_key.sh deploy@acadex.com"
  exit 1
fi

EMAIL="$1"
KEY_PATH="$HOME/.ssh/acadex_ed25519"

echo "Following the official GitHub Linux guide for generating a new SSH key..."
echo "Generating a new Ed25519 SSH key for GitHub using email: $EMAIL"

# Create .ssh directory if it doesn't exist and protect it
mkdir -p ~/.ssh

# Step 1: Generate a new SSH key (forcing the acadex-prefixed path)
# -q makes it quiet, we will still allow them to enter a passphrase if they want, but no prompt if it works automatically.
ssh-keygen -t ed25519 -C "$EMAIL" -f "$KEY_PATH"

echo ""
echo "Protecting the generated keys (applying strict permissions and ownership)..."
# Step to protect the generated keys to prevent SSH permission warning
chown -R $(whoami):$(whoami) ~/.ssh
chmod 700 ~/.ssh
chmod 600 "$KEY_PATH"
chmod 644 "${KEY_PATH}.pub"

echo ""
echo "Adding SSH configuration for git@github.com to prevent 'Permission denied'..."
# SSH needs to know to use our custom-named key for github
# Remove existing block if it exists to avoid duplicates
sed -i '/Host github.com/,/IdentitiesOnly yes/d' ~/.ssh/config 2>/dev/null || true

cat <<EOL >> ~/.ssh/config
Host github.com
  HostName github.com
  User git
  IdentityFile $KEY_PATH
  IdentitiesOnly yes
EOL
chmod 600 ~/.ssh/config
chown $(whoami):$(whoami) ~/.ssh/config

echo ""
echo "Starting the ssh-agent in the background..."
# Step 2: Start the ssh-agent in the background
eval "$(ssh-agent -s)"

echo "Adding SSH private key to the ssh-agent..."
# Step 3: Add your SSH private key to the ssh-agent
ssh-add "$KEY_PATH"

echo ""
echo "========================================================================"
echo "✅ SSH key successfully generated and added to SSH agent!"
echo ""
echo "Here is your public key (you need to add this to your GitHub account):"
echo "========================================================================"
cat "${KEY_PATH}.pub"
echo "========================================================================"
echo ""
echo "Next steps:"
echo "1. Copy the key strictly between the === lines."
echo "2. Go to GitHub -> Settings -> SSH and GPG keys (https://github.com/settings/keys)."
echo "3. Click 'New SSH key'. Give it a title (like 'Acadex Webhook') and paste the key."
echo "4. Use 'ssh -T git@github.com' to verify the connection."
