# PPOINT

PPOINT is a digital addressing platform with a Node.js backend, React frontend, and PostgreSQL/PostGIS database.

## Project Structure

```text
ppoint/
├── backend/
├── database/
├── frontend/
└── docker-compose.yml
```

## Local Development

### Start database

```powershell
docker-compose up postgres
```

### Start backend

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

### Start frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

## Production Deployment

```powershell
docker-compose up -d
```

### ppoint.online deployment

```powershell
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Use [deploy/nginx/ppoint.online.conf](deploy/nginx/ppoint.online.conf) on the host machine to terminate SSL and proxy traffic to the frontend container on `127.0.0.1:8080`.

## Environment Variables

- Set `ADMIN_TOKEN` for admin dashboard access.
- Configure database credentials.
- Set up SSL certificates for production.
- For the frontend, set `VITE_API_BASE_URL=/api` when deploying behind the same domain.
- For production on `ppoint.online`, set `FRONTEND_URL=https://ppoint.online` in the backend environment.

Backend defaults are currently defined in `backend/.env` for local development.
If PostgreSQL/PostGIS is not installed locally yet, the backend can run in a development fallback mode with `USE_IN_MEMORY_DB=true`.
For production, copy [.env.prod.example](.env.prod.example) to `.env.prod`, set strong secrets, and keep `USE_IN_MEMORY_DB=false`.

## GitHub

Repository remote:

```text
https://github.com/ibitoyeoluwasegunemmanuel-ops/ppoint.git
```

### GitHub Actions secrets for deploy

- `DEPLOY_HOST`: production server hostname or IP
- `DEPLOY_USER`: SSH user on the server
- `DEPLOY_PATH`: absolute project path on the server
- `DEPLOY_SSH_KEY`: private SSH key with access to the server

### Production checklist for ppoint.online

1. Install Docker and Docker Compose on the server.
2. Copy `.env.prod.example` to `.env.prod` on the server and set real secrets.
3. Put the SSL certificate files in the paths referenced by `deploy/nginx/ppoint.online.conf`.
4. Enable the Nginx host config and reload Nginx.
5. Run `docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build`.

## Scaling Notes

- Use Redis for session management.
- Implement read replicas for the database.
- Use a CDN for static assets.

## Overview

This implementation includes the grid-based addressing flow, proximity detection, an admin dashboard, and a Docker-based deployment path for future expansion.