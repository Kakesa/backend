#!/bin/bash

# Check if an email argument is provided
if [ -z "$1" ]; then
  echo "Error: Missing email address."
  echo "Usage: ./generate_github_ssh_key.sh <email-address>"
  echo "Example: ./generate_github_ssh_key.sh deploy@acadex.com"
  exit 1
fi

EMAIL="$1"

echo "Following the official GitHub Linux guide for generating a new SSH key..."
echo "Generating a new Ed25519 SSH key for GitHub using email: $EMAIL"

# Step 1: Generate a new SSH key
# (Press Enter to accept default location and either enter a passphrase or leave it empty)
ssh-keygen -t ed25519 -C "$EMAIL"

echo ""
echo "Starting the ssh-agent in the background..."
# Step 2: Start the ssh-agent in the background
eval "$(ssh-agent -s)"

echo "Adding SSH private key to the ssh-agent..."
# Step 3: Add your SSH private key to the ssh-agent
ssh-add ~/.ssh/id_ed25519

echo ""
echo "========================================================================"
echo "✅ SSH key successfully generated and added to SSH agent!"
echo ""
echo "Here is your public key (you need to add this to your GitHub account):"
echo "========================================================================"
cat ~/.ssh/id_ed25519.pub
echo "========================================================================"
echo ""
echo "Next steps:"
echo "1. Copy the key strictly between the === lines."
echo "2. Go to GitHub -> Settings -> SSH and GPG keys (https://github.com/settings/keys)."
echo "3. Click 'New SSH key'. Give it a title (like 'Acadex Webhook') and paste the key."
echo "4. Use 'ssh -T git@github.com' to verify the connection."
