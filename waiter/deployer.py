import os
import subprocess
import tempfile
import urllib.parse
import re

ORCHESTRATOR = os.getenv("ACADEX_ORCHESTRATOR", "docker-compose").lower()

def get_authenticated_repo_url(repo_url):
    git_auth_method = os.getenv("GIT_AUTH_METHOD", "https").lower()
    github_user = os.getenv("GITHUB_USER", "")
    github_pass = os.getenv("GITHUB_PASSWORD", "")
    
    if git_auth_method == "ssh":
        # Convert HTTPS URL to SSH URL
        if repo_url.startswith("https://github.com/"):
            repo_url = repo_url.replace("https://github.com/", "git@github.com:")
            if not repo_url.endswith(".git"):
                repo_url += ".git"
        return repo_url
        
    elif git_auth_method == "https":
        if github_user and github_pass and repo_url.startswith("https://"):
            parsed = urllib.parse.urlparse(repo_url)
            # Reconstruct with auth
            return f"https://{urllib.parse.quote(github_user)}:{urllib.parse.quote(github_pass)}@{parsed.netloc}{parsed.path}"
    
    return repo_url

def deploy(repo_url, branch="release"):
    auth_repo_url = get_authenticated_repo_url(repo_url)

    # Do not print auth_repo_url to keep credentials out of logs
    print(f"Deploying using {ORCHESTRATOR} from temp clone of {repo_url}...")
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"Cloning branch '{branch}' into {temp_dir}...")
            # We use auth_repo_url but don't print it to keep secrets safe
            subprocess.run(["git", "clone", "-b", branch, "--single-branch", auth_repo_url, temp_dir], check=True)
            
            # Copy configuration files to permanent storage for the acadex CLI
            subprocess.run(["sudo", "mkdir", "-p", "/var/acadex"], check=True)
            for f in ["k8s.yaml", "docker-compose.yml"]:
                file_path = os.path.join(temp_dir, f)
                if os.path.exists(file_path):
                    subprocess.run(["sudo", "cp", file_path, "/var/acadex/"], check=True)

            if ORCHESTRATOR == "kubernetes":
                # Build the image locally
                subprocess.run(["docker", "build", "-t", "acadex-shadow:latest", "."], cwd=temp_dir, check=True)
                
                # Apply k8s manifests just in case they changed, then restart
                subprocess.run(["kubectl", "apply", "-f", "/var/acadex/k8s.yaml"], cwd=temp_dir, check=True)
                # Update the deployment in kubernetes
                subprocess.run(["kubectl", "rollout", "restart", "deployment/shadow"], cwd=temp_dir, check=True)
                print("Successfully rolled out kubernetes deployment.")
                
            elif ORCHESTRATOR == "docker-compose":
                # Docker Compose builds and recreates containers automatically
                # Specify project name so it doesn't use the temporary folder name
                subprocess.run(["docker", "compose", "-p", "acadex", "-f", "/var/acadex/docker-compose.yml", "up", "-d", "--build"], cwd=temp_dir, check=True)
                print("Successfully updated docker-compose services.")
                
            else:
                print(f"Unknown orchestrator: {ORCHESTRATOR}")
                return False
                
        # The temporary directory is automatically removed when the `with` block exits
        return True
    except subprocess.CalledProcessError as e:
        print(f"Deployment failed: {e}")
        return False
