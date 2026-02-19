# Production Deployment Guide

This guide describes how to deploy the Maestro application to a production server (VPS) and ensure it can handle load.

## 1. Server Requirements (Hetzner VPS)
We recommend the **CPX11** (or CPX21 for higher load) instance types on Hetzner Cloud.
- **Model**: CPX11
- **Price**: ~€4-5 / month (approx)
- **Specs**: 2 vCPU, 2GB RAM, 40GB SSD (Perfect for this project).
- **Location**: Falkenstein or Helsinki (Usually cheapest/best connectivity).
- **OS**: Ubuntu 22.04 LTS (or 24.04).
- **Current IP**: `89.167.75.82`

## 2. Hetzner Setup Instructions
1.  **Create Project**: Log in to [Hetzner Cloud Console](https://console.hetzner.com/) and create a new project "Maestro".
2.  **Add SSH Key** (Critical):
    - Go to **Security** > **SSH Keys**.
    - Click "Add SSH Key".
    - Paste your public key (run `cat ~/.ssh/id_rsa.pub` on your Mac to see it).
3.  **Create Server**:
    - Click **Add Server**.
    - Select **Location** (e.g., Falkenstein).
    - Select **Image**: Ubuntu 22.04.
    - Select **Type**: Standard > CPX11.
    - **SSH Key**: Select the key you added (Do NOT use password via email, it's less secure).
    - Click **Create & Buy**.

## 3. Initial Server Setup
Copy your project files to the new server:
```bash
# Replace 1.2.3.4 with your new Hetzner IP
scp -r . root@1.2.3.4:/root/app
```

Connect to your server:
```bash
ssh root@1.2.3.4
```

Install Docker on Hetzner Ubuntu:
```bash
apt update && apt upgrade -y
# Install Docker and Compose plugin
apt install -y docker.io docker-compose-v2
```

## 3. Deploying the Application
1.  **Clone your repository** (or copy files via SCP):
    ```bash
    git clone <your-repo-url> app
    cd app
    ```

2.  **Configure Environment**:
    ```bash
    cp .env.example .env
    nano .env
    ```
    **Critical Changes for Production:**
    - `DEBUG=0` (Disable debug mode!)
    - `DJANGO_SECRET_KEY`: Generate a long random string.
    - `ALLOWED_HOSTS`: Set to your domain name (e.g., `maestro.uz`).
    - `GEMINI_API_KEY`: Ensure your real key is set.

3.  **Start Services**:
    ```bash
    docker compose up --build -d
    ```

## 4. Setting up HTTPS (SSL)
For a secure site (https://), the easiest way with Docker is to use Caddy or Nginx Proxy Manager. Here is a manual approach using Certbot on the host:

1.  **Install Certbot**:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    ```
    *Note: You'll need to install Nginx on the host `apt install nginx` to use it as a reverse proxy, OR modify the Docker Nginx container to handle SSL.*

    **Recommended Approach (Docker Nginx + Certbot):**
    We recommend using a separate `nginx-proxy` container for automatic SSL, or configuring Cloudflare for free SSL (easiest).

    **Cloudflare Setup (Easiest & Best for Load):**
    1.  Point your domain's DNS to Cloudflare.
    2.  Enable "Always Use HTTPS" in Cloudflare settings.
    3.  In `nginx/nginx.conf`, ensure you are listening on port 80 (Cloudflare handles the encryption to the user).

## 5. Optimization & Load Handling
To withstand simultaneous loads:

### Backend Scaling
We have configured Gunicorn with:
- `--workers 4`: Handles 4 parallel requests.
- `--threads 4`: Handles concurrent I/O.
*Formula*: `(2 x CPU_Cores) + 1`. If you have 4 cores, set workers to 9. You can edit `docker-compose.yml` to change this.

### Database Connection Pooling
Django opens a new connection for every request by default.
- **Enabled**: We recommended using `pgbouncer` for very high loads, but for now, ensure `CONN_MAX_AGE` is set in Django settings (already default in many prod configs, but can be tuned).

### Static Files
Currently served by Nginx. For extreme load, consider:
- Offloading media files to AWS S3 or Cloudflare R2.
- Using a CDN (Cloudflare) to cache static assets (CSS/JS/Images).

## 6. Maintenance
- **Backups**: regularly backup your database.
    ```bash
    docker compose exec db pg_dump -U hello_django hello_django_dev > backup.sql
    ```
- **Updates**:
    ```bash
    git pull
    docker compose up --build -d
    ```
    docker compose up --build -d
    ```

## 7. Automatic Deployment (CD)
We have set up a GitHub Action `.github/workflows/deploy.yml` that automatically deploys changes when you push to `main`.

**Setup Required:**
1.  Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2.  Click **New repository secret**.
3.  Add the following secrets:
    -   `HETZNER_HOST`: Your server IP address (e.g., `1.2.3.4`).
    -   `HETZNER_USER`: `root`.
    -   `SSH_PRIVATE_KEY`: The content of your private SSH key (open `~/.ssh/id_rsa` on your Mac and copy everything).

**How it works:**
- When you `git push`, GitHub logs into your server via SSH.
- It pulls the latest code (`git pull`).
- It rebuilds the Docker containers (`docker compose up --build -d`).
- It runs database migrations automatically.
