import os
import hmac
import hashlib
import subprocess
import tempfile
from flask import Flask, request, jsonify

app = Flask(__name__)

# Environment variables
ORCHESTRATOR = os.getenv("ACADEX_ORCHESTRATOR", "docker-compose").lower()
GITHUB_SECRET = os.getenv("GITHUB_SECRET", "")
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def verify_signature(payload_body, signature_header):
    if not GITHUB_SECRET:
        return True
    
    if not signature_header:
        return False

    hash_object = hmac.new(GITHUB_SECRET.encode('utf-8'), msg=payload_body, digestmod=hashlib.sha256)
    expected_signature = "sha256=" + hash_object.hexdigest()
    
    return hmac.compare_digest(expected_signature, signature_header)

def deploy(repo_url):
    print(f"Deploying using {ORCHESTRATOR} from temp clone of {repo_url}...")
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"Cloning branch 'release' into {temp_dir}...")
            subprocess.run(["git", "clone", "-b", "release", "--single-branch", repo_url, temp_dir], check=True)
            
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

@app.route('/webhook', methods=['POST'])
def webhook():
    # Verify the request signature
    signature = request.headers.get('X-Hub-Signature-256')
    if not verify_signature(request.get_data(), signature):
        return jsonify({"status": "forbidden", "message": "Invalid signature"}), 403
        
    event = request.headers.get("X-GitHub-Event", "ping")
    if event == "ping":
        return jsonify({"status": "ok", "message": "Pong!"}), 200
        
    if event == "push":
        payload = request.json
        ref = payload.get("ref", "")
        repo_url = payload.get("repository", {}).get("clone_url")
        
        # Check if the push is to the release branch
        if ref == "refs/heads/release":
            if not repo_url:
                return jsonify({"status": "error", "message": "Repository URL not found in payload"}), 400
                
            print(f"Push to release branch detected, starting deployment for {repo_url}...")
            success = deploy(repo_url)
            if success:
                return jsonify({"status": "ok", "message": "Deployment triggered successfully"}), 200
            else:
                return jsonify({"status": "error", "message": "Deployment failed"}), 500
        else:
            return jsonify({"status": "ignored", "message": f"Push to non-release branch ({ref})"}), 200
            
    return jsonify({"status": "ignored", "message": "Event not handled"}), 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5050))
    app.run(host='0.0.0.0', port=port)
