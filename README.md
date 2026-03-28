# Acadex (EduGest)

[![Shadow CI](https://github.com/Kakesa/backend/actions/workflows/shadow.yml/badge.svg)](https://github.com/Kakesa/backend/actions/workflows/shadow.yml)
[![Sushi CI](https://github.com/Kakesa/backend/actions/workflows/sushi.yml/badge.svg)](https://github.com/Kakesa/backend/actions/workflows/sushi.yml)
[![Waiter CI](https://github.com/Kakesa/backend/actions/workflows/waiter.yml/badge.svg)](https://github.com/Kakesa/backend/actions/workflows/waiter.yml)

Welcome to the Acadex repository. This monorepo contains the entire suite for the Acadex educational management system. 

## 🏗️ Architecture Overview

The system is split into three main components residing in this repository:

### 1. `shadow` (Backend & API)
The core backend application. It is a multi-tenant Node.js & Express server connected to an underlying MongoDB database. It handles user authentication, multi-tenant isolation (via `X-School-Id`), role management, and serves all API endpoints. In production, `shadow` also serves the frontend's static assets.

### 2. `sushi` (Frontend)
The user interface. It is a modern React 18 application built with Vite, TypeScript, and Tailwind CSS. It connects dynamically to `shadow`'s API endpoints and utilizes role-based routing to provide different dashboards for students, teachers, parents, and admins.

### 3. `waiter` (Webhook & CI/CD Deployment)
A Python webhook service and installation suite. `waiter` listens for GitHub webhooks (pushes to the `release` branch) and manages deployments automatically by rebuilding Docker or Kubernetes configurations. It also contains `install.py`, which is used to initialize the platform on new bare-metal servers.

---

## 📦 How They are Built and Packaged

Instead of running two separate instances in production, `sushi` and `shadow` are packaged together into a **single Docker container** using a multi-stage `Dockerfile`:

1. **Stage 1 (Frontend Build)**: Uses `oven/bun` to heavily optimize installing frontend dependencies and compiling the React application via Vite (`bun run build`). The static files are output to `sushi/dist`.
2. **Stage 2 (Backend Build & Serve)**: Uses an Alpine Node.js image to install the backend server (Shadow). It then **copies the statically compiled frontend assets** (`sushi/dist`) into the backend container. 
3. Finally, the Express app in `shadow` is configured to serve the frontend on all non-API paths, acting as a unified application server.

---

## 💻 Running in Development Mode

For development, you will typically run the backend and frontend separately to benefit from hot-reloading.

### Prerequisites
- Node.js (v20+)
- Bun (for the frontend)
- Local MongoDB instance running on port 27017.

### 1. Start the Backend (`shadow`)
```bash
cd shadow
cp env.example .env
# Edit .env variables if necessary (e.g. MONGO_URI, JWT_SECRET)
npm install
npm run dev
```
*The backend will start using Nodemon on `http://localhost:5000`.*

### 2. Start the Frontend (`sushi`)
In a new terminal:
```bash
cd sushi
bun install
bun run dev
```
*Vite will start the frontend development server typically on `http://localhost:5173` or `8080`, and requests to the API will be pointed to port 5000.*

---

## 🚀 Running in Production Mode

To run locally in a production-like environment (or on a cloud VM), we use Docker Compose. The `docker-compose.yml` spins up a MongoDB instance, an Elasticsearch-Logstash-Kibana (ELK) stack, and the unified Acadex server.

### Prerequisites
- Docker & Docker Compose

### Starting the Stack
Ensure you are in the root directory:
```bash
docker compose up -d --build
```
This will:
- Spin up MongoDB.
- Build the `shadow` and `sushi` apps via the unified Dockerfile.
- Serve the entire application securely on port `5000`.

To view application logs:
```bash
docker compose logs -f shadow
```

---

## 🛠️ How to Deploy on Bare Metal

If you are setting up Acadex on a fresh Ubuntu/Debian bare-metal server, you can use the `waiter` installation script. This script automatically clones the repository, checks for required configuration, and initializes either the Docker Compose or Kubernetes orchestrator.

### 1. Clone wait scripts manually or copy them over
Retrieve the repository on your server.

### 2. Setup your Environment Variables
Before running the installer, these are strictly required:
```bash
export ACADEX_REPO_URL="https://github.com/Kakesa/backend.git" # (or whichever url you use)
export ACADEX_ORCHESTRATOR="docker-compose" # or "kubernetes"
export GITHUB_SECRET="your-secure-webhook-secret"
export JWT_SECRET="your-secure-jwt-secret-for-auth"
```

*(Note: Depending on your server, you may also need to configure your MongoDB URIs if not using the default Docker setups).*

### 3. Run the One-Time Installer
Execute the installation script using Python:
```bash
cd waiter
python3 -m pip install -r requirements.txt
python3 install.py
```

This will cleanly orchestrate a temporary environment, build your Docker images (including both UI and Backend), deploy them using your chosen orchestrator, and finally clear the temporaries.

### 4. Continuous Deployment (Webhook)
Once your bare-metal setup is successful, you can keep it constantly updated by running normal `waiter`:
```bash
cd waiter
python3 webhook.py
```
*It binds to port 5050. Point your GitHub `release` branch webhooks to `http://your-server-ip:5050/webhook`.*
