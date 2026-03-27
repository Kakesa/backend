# Waiter

This folder contains the webhook listener for Acadex. It is responsible for listening to GitHub webhook events and automatically deploying the application when new code is merged into the `release` branch.

## Setup

1. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set the `ACADEX_ORCHESTRATOR` environment variable to either `kubernetes` or `docker-compose`. This tells the script which tool to use to deploy the app.
   ```bash
   export ACADEX_ORCHESTRATOR=kubernetes
   ```

3. (Optional) Set a `GITHUB_SECRET` environment variable to secure the webhook endpoint.

4. Run the webhook listener:
   ```bash
   python webhook.py
   ```

## How it works

The `webhook.py` script starts a Flask server on port 5050. When a POST request is received at `/webhook`, it checks the payload to see if code was pushed to the `release` branch. 

If it was, the script navigates to the parent directory and:
- Rebuilds the Docker image.
- Deploys the updated image using the specified orchestrator.
