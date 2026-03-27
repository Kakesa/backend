import sys
import os
from deployer import deploy

# Base environment variables fundamentally required by Waiter & Shadow
REQUIRED_ENV_VARS = [
    "ACADEX_REPO_URL",       # Needed to clone the codebase
    "ACADEX_ORCHESTRATOR",   # Needed to decide between docker-compose or kubernetes
    "GITHUB_SECRET",         # Needed to securely verify GitHub webhooks
    "JWT_SECRET"             # Needed by Shadow for authentication tokens
]

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
    if success:
        print("\nInstallation complete! The initial application setup is done.")
        sys.exit(0)
    else:
        print("\nInstallation failed. Please review the error logs above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
