import os
import hmac
import hashlib
import subprocess
import tempfile
import pty
import time
import urllib.parse
from flask import Flask, request, jsonify, render_template_string, session, redirect, url_for
import dotenv

from deployer import deploy

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", os.urandom(24))

# Environment variables
ORCHESTRATOR = os.getenv("ACADEX_ORCHESTRATOR", "docker-compose").lower()
GITHUB_SECRET = os.getenv("GITHUB_SECRET", "")
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_FILE = os.path.join(PROJECT_ROOT, ".env")

LOGIN_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Acadex Configuration</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; margin-top: 100px; background: #f0f2f5; }
        .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 300px; text-align: center; }
        input[type="password"] { width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; width: 100%; }
        button:hover { background: #0052a3; }
        .error { color: #dc3545; margin-bottom: 15px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="card">
        <h3>Acadex System Login</h3>
        <p style="font-size: 14px; color: #666;">Enter the password for the 'acadex' Linux user</p>
        {% if error %}<div class="error">{{ error }}</div>{% endif %}
        <form method="POST">
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Unlock Configuration</button>
        </form>
    </div>
</body>
</html>
"""

CONFIG_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Acadex Environment Configuration</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #f0f2f5; }
        .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h2 { margin-top: 0; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #fafafa; }
        input[type="text"] { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        .btn { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        .btn:hover { background: #218838; }
        .alert { padding: 15px; margin-bottom: 20px; border-radius: 4px; color: white; background: #28a745; }
        .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .logout-btn { background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header-actions">
            <h2>Environment Configuration</h2>
            <form action="/logout" method="POST" style="margin:0;">
                <button type="submit" class="logout-btn">Logout</button>
            </form>
        </div>
        
        {% if message %}<div class="alert">{{ message }}</div>{% endif %}
        
        <form method="POST">
            <table>
                <tr>
                    <th width="35%">Variable</th>
                    <th>Value</th>
                </tr>
                {% for key, val in env_vars.items() %}
                <tr>
                    <td><strong>{{ key }}</strong></td>
                    <td><input type="text" name="{{ key }}" value="{{ val or '' }}"></td>
                </tr>
                {% endfor %}
            </table>
            
            <div style="background: #fafafa; padding: 15px; border-radius: 4px; margin-bottom: 20px; border: 1px solid #eee;">
                <h4 style="margin-top: 0;">Add New Variable</h4>
                <div style="display: flex; gap: 10px;">
                    <input type="text" name="__new_key" placeholder="Key (e.g., CUSTOM_PORT)">
                    <input type="text" name="__new_val" placeholder="Value">
                </div>
            </div>
            
            <button type="submit" class="btn">Save & Restart Containers</button>
        </form>
    </div>
</body>
</html>
"""

def auth_acadex_user(password):
    """Fallback Linux authentication via a pty and su."""
    try:
        import pam
        p = pam.pam()
        if p.authenticate('acadex', password):
            return True
    except ImportError:
        pass

    try:
        pid, fd = pty.fork()
        if pid == 0:
            os.execv('/bin/su', ['su', '-', 'acadex', '-c', 'exit 0'])
        else:
            time.sleep(0.1)
            try:
                output = os.read(fd, 2048)
                if b':' in output or b'assword' in output:
                    os.write(fd, password.encode() + b'\n')
            except Exception:
                pass
            _, status = os.waitpid(pid, 0)
            return os.WEXITSTATUS(status) == 0
    except Exception as e:
        print(f"Auth error: {e}")
        return False
    return False

@app.route('/config', methods=['GET', 'POST'])
def config_ui():
    if not session.get('authenticated'):
        return redirect(url_for('login'))
        
    message = None
    
    # Ensure .env exists, fallback to shadow/env.example
    if not os.path.exists(ENV_FILE):
        example_env = os.path.join(PROJECT_ROOT, "shadow", "env.example")
        if os.path.exists(example_env):
            with open(example_env, 'r') as src, open(ENV_FILE, 'w') as dst:
                dst.write(src.read())
        else:
            open(ENV_FILE, 'w').close()
            
    if request.method == 'POST':
        form_data = request.form
        for key, value in form_data.items():
            if key == "__new_key":
                continue
            if key == "__new_val":
                new_key = form_data.get("__new_key", "").strip()
                new_val = form_data.get("__new_val", "").strip()
                if new_key:
                    dotenv.set_key(ENV_FILE, new_key, new_val)
                    os.environ[new_key] = new_val
                continue
            
            dotenv.set_key(ENV_FILE, key, value)
            os.environ[key] = value
            
        message = "Configuration saved! Restarting containers..."
        restart_containers()
        
    env_vars = dotenv.dotenv_values(ENV_FILE)
    return render_template_string(CONFIG_TEMPLATE, env_vars=env_vars, message=message)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('authenticated'):
        return redirect(url_for('config_ui'))
        
    error = None
    if request.method == 'POST':
        password = request.form.get('password')
        if auth_acadex_user(password):
            session['authenticated'] = True
            return redirect(url_for('config_ui'))
        else:
            error = "Invalid password for user 'acadex'"
            
    return render_template_string(LOGIN_TEMPLATE, error=error)

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('authenticated', None)
    return redirect(url_for('login'))

@app.route('/', methods=['GET'])
def index():
    return redirect(url_for('config_ui'))

def restart_containers():
    print(f"Restarting containers using {ORCHESTRATOR} based on config change...")
    try:
        if ORCHESTRATOR == "docker-compose":
            subprocess.run(["docker", "compose", "-p", "acadex", "-f", "/var/acadex/docker-compose.yml", "down"], check=True)
            subprocess.run(["docker", "compose", "-p", "acadex", "-f", "/var/acadex/docker-compose.yml", "up", "-d"], check=True)
        elif ORCHESTRATOR == "kubernetes":
            subprocess.run(["kubectl", "apply", "-f", "/var/acadex/k8s.yaml"], check=True)
            subprocess.run(["kubectl", "rollout", "restart", "deployment/shadow"], check=True)
    except Exception as e:
        print(f"Restart failed: {e}")

def verify_signature(payload_body, signature_header):
    if not GITHUB_SECRET:
        return True
    
    if not signature_header:
        return False

    hash_object = hmac.new(GITHUB_SECRET.encode('utf-8'), msg=payload_body, digestmod=hashlib.sha256)
    expected_signature = "sha256=" + hash_object.hexdigest()
    
    return hmac.compare_digest(expected_signature, signature_header)

@app.route('/webhook', methods=['POST'])
def webhook():
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
