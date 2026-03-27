import os
import subprocess
import tempfile

ORCHESTRATOR = os.getenv("ACADEX_ORCHESTRATOR", "docker-compose").lower()

def deploy(repo_url, branch="release"):
    print(f"Deploying using {ORCHESTRATOR} from temp clone of {repo_url}...")
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"Cloning branch '{branch}' into {temp_dir}...")
            subprocess.run(["git", "clone", "-b", branch, "--single-branch", repo_url, temp_dir], check=True)
            
            if ORCHESTRATOR == "kubernetes":
                # Build the image locally
                subprocess.run(["docker", "build", "-t", "acadex-shadow:latest", "."], cwd=temp_dir, check=True)
                
                # Apply k8s manifests just in case they changed, then restart
                subprocess.run(["kubectl", "apply", "-f", "k8s.yaml"], cwd=temp_dir, check=True)
                # Update the deployment in kubernetes
                subprocess.run(["kubectl", "rollout", "restart", "deployment/shadow"], cwd=temp_dir, check=True)
                print("Successfully rolled out kubernetes deployment.")
                
            elif ORCHESTRATOR == "docker-compose":
                # Docker Compose builds and recreates containers automatically
                # Specify project name so it doesn't use the temporary folder name
                subprocess.run(["docker", "compose", "-p", "acadex", "up", "-d", "--build"], cwd=temp_dir, check=True)
                print("Successfully updated docker-compose services.")
                
            else:
                print(f"Unknown orchestrator: {ORCHESTRATOR}")
                return False
                
        # The temporary directory is automatically removed when the `with` block exits
        return True
    except subprocess.CalledProcessError as e:
        print(f"Deployment failed: {e}")
        return False
