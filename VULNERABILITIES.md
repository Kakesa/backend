# Security Vulnerability Report

This document contains a security analysis of the Acadex application, identifying potential vulnerabilities across the `shadow` (backend), `sushi` (frontend), and infrastructure configurations.

## 🔴 High Severity

### 1. Hardcoded Credentials
- **Location:** `shadow/src/config/initSuperAdmin.js`
- **Description:** The system automatically seeds a super-admin account using a hardcoded, plaintext password (`SuperAdmin@123`) and email. If the repository is ever compromised or exposed, an attacker can access the highest privileged account in the system easily.
- **Remediation:** Remove the hardcoded password. Read initialization configuration from environment variables (e.g., `process.env.SUPERADMIN_EMAIL`, `process.env.SUPERADMIN_PASSWORD`).

### 2. Missing NoSQL Injection Protection
- **Location:** `shadow/src/app.js` and Express Routes
- **Description:** The Express application connects to a MongoDB database but lacks sanitation middleware for NoSQL injection (such as `express-mongo-sanitize`). This allows an attacker to inject MongoDB operator objects like `{"$gt": ""}` inside JSON request bodies or query strings to bypass authentication or extract unauthorized records.
- **Remediation:** Install and configure `express-mongo-sanitize` as a global middleware.

### 3. Open Webhook Leads to Resource Exhaustion (DoS)
- **Location:** `waiter/webhook.py`
- **Description:** In the webhook server, if `GITHUB_SECRET` is not set in the environment, `verify_signature` silently defaults to returning `True`. An unauthenticated attacker could continuously spoof GitHub push payloads targeted at the `release` branch. This forces continuous rebuilds and orchestrator deployments, leading to a Denial of Service (DoS) due to CPU/Memory exhaustion.
- **Remediation:** Enforce the presence of `GITHUB_SECRET`. If it is empty or missing, the server should fail to start or reject all requests by default.


## 🟡 Medium Severity

### 4. Docker Container Runs as Root
- **Location:** `Dockerfile`
- **Description:** By default, Docker runs the container as the `root` user. If an attacker manages to achieve Remote Code Execution (RCE) via a vulnerable dependency or insecure file upload, they will have root privileges inside the container, easing lateral movement possibilities.
- **Remediation:** Add a `USER node` directive at the end of the Dockerfile so the shadow server executes as an unprivileged user.

### 5. Stored XSS via File Uploads & Weak MIME checking
- **Location:** `shadow/src/middlewares/upload.middleware.js` & `shadow/src/app.js`
- **Description:** File uploads often rely on MIME types (which can be spoofed by the client). Furthermore, if your image upload config allows `.svg` files, these files can embed malicious `<script>` tags, causing Stored Cross-Site Scripting (XSS) when rendered in the browser. 
- **Remediation:** Disallow SVG file types for user-submitted uploads. Implement strict extension validation rather than relying purely on HTTP `Content-Type` headers or `file.mimetype`. 

### 6. Missing Standard Defensive Middleware
- **Location:** `shadow/src/app.js`, `shadow/package.json`
- **Description:** The API lacks baseline security tools:
  - **Helmet:** Missing HTTP security headers (HSTS, Content-Security-Policy, X-Frame-Options).
  - **Rate Limiting:** Endpoints do not implement `express-rate-limit`, leaving features like user login vulnerable to brute-force credential stuffing and basic DDoS attacks.
- **Remediation:** Install `helmet` and `express-rate-limit`. Apply standard rate limits to public-facing and authentication routes.


## 🟢 Low Severity

### 7. Permissive CORS Configuration
- **Location:** `shadow/src/app.js`
- **Description:** Permitting arbitrary non-browser origins (like `curl` or Postman) via `if (!origin) return callback(null, true);` is common for APIs supporting mobile devices but expands the application's attack surface to basic CSRF from locally running tools or scripts. 
- **Remediation:** Limit origins securely. If API routes are required for programmatic access, enforce Bearer tokens. 

### 8. Potential Environment File Exposure
- **Location:** Source Control & Frontend Builds
- **Description:** Ensure that `.env` files storing variables like `JWT_SECRET` and `MONGO_URI` are never tracked by source control. Also, ensure the Vite frontend (`sushi/`) never uses `VITE_` prefixed environment variables for private API keys, as they are fully exposed in the compiled static files. 
