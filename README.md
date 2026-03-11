# PPOINT

PPOINT is a digital addressing platform with a Node.js backend, React frontend, and PostgreSQL/PostGIS database.

## Project Structure

```text
ppoint/
├── .env.example
├── backend/
│   └── .env.example
├── database/
├── frontend/
│   ├── vercel.json
│   └── .env.example
├── render.yaml
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

## Deployment Stack

This project is configured for a fully free deployment path using:

1. Vercel for the frontend
2. Render for the backend API
3. Supabase PostgreSQL for the database

For exact dashboard values, DNS records, and click-by-click setup, see [DEPLOY_FREE_STACK.md](DEPLOY_FREE_STACK.md).

## Environment Variables

- Backend deployment requires `DATABASE_URL`, `ADMIN_TOKEN`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
- The current default admin login is `ibitoyeoluwasegunemmanuel@gmail.com`; override it with `ADMIN_EMAIL` and `ADMIN_PASSWORD` in production if you rotate credentials later.
- Backend deployment should set `API_BASE_URL=https://api.ppoint.online` and `FRONTEND_URL=https://ppoint.online`.
- Hosted frontend builds can use same-origin `/api`; `VITE_API_BASE_URL` is optional unless you want to force a non-default API host.
- `MAP_API_KEY` and `JWT_SECRET` are not currently consumed by this repository's deployed frontend flow.

Use [.env.example](.env.example) as the base reference. Backend-specific placeholders also exist in [backend/.env.example](backend/.env.example), and frontend-specific placeholders exist in [frontend/.env.example](frontend/.env.example).

## GitHub

Repository remote:

```text
https://github.com/ibitoyeoluwasegunemmanuel-ops/ppoint.git
```

## Frontend Deployment: Vercel

The repository root is now Vercel-ready and can build the frontend without changing the project root directory. The root build script in [package.json](package.json) delegates to the Vite app in [frontend/package.json](frontend/package.json), then copies the final static site into the root [dist](dist) directory.

1. Build command: `npm run build`
2. Output directory: `dist`

Vercel config is defined in [vercel.json](vercel.json).

That config already contains:

1. `buildCommand: npm run build`
2. `outputDirectory: dist`
3. An SPA rewrite that falls back all routes to `index.html`

### Vercel steps

1. Import the GitHub repository into Vercel.
2. Keep the project root directory at the repository root, or set it to `frontend` if you prefer the older frontend-only setup.
3. Confirm build command is `npm run build`.
4. Confirm output directory is `dist`.
5. Set environment variables `ADMIN_EMAIL=ibitoyeoluwasegunemmanuel@gmail.com` and `ADMIN_PASSWORD=Clause01!`.
6. Set `DATABASE_URL` if you want durable persistence across serverless invocations.
7. `VITE_API_BASE_URL` can be omitted for same-origin `/api`, or set to `/api` explicitly.
8. Add custom domains `ppoint.online` and `www.ppoint.online`.

## Backend Deployment: Render

The backend is configured to start with `npm start` in [backend/package.json](backend/package.json), and Render config is defined in [render.yaml](render.yaml).

The server listens on `process.env.PORT` in [backend/src/app.js](backend/src/app.js).

### Render steps

1. Create a new Web Service or Blueprint in Render from the GitHub repository.
2. If using a Web Service, set the root directory to `backend`.
3. Build command: `npm ci`.
4. Start command: `npm start`.
5. Add these Render environment variables:
	1. `DATABASE_URL`
	2. `ADMIN_TOKEN`
	3. `ADMIN_EMAIL=ibitoyeoluwasegunemmanuel@gmail.com`
	4. `ADMIN_PASSWORD=Clause01!`
	5. `API_BASE_URL=https://api.ppoint.online`
	6. `FRONTEND_URL=https://ppoint.online`
	7. `NODE_ENV=production`
	8. `USE_IN_MEMORY_DB=false`
	9. `INIT_DB_ON_START=false`
	10. `GRID_SIZE=20`
	11. `PROXIMITY_RADIUS=15`
6. Add the custom domain `api.ppoint.online`.

## Database Deployment: Supabase

The backend reads the database connection from `process.env.DATABASE_URL` in [backend/src/config/database.js](backend/src/config/database.js).

Supabase connection string format:

```text
postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require
```

### Supabase steps

1. Create a free Supabase project.
2. Enable the `postgis` extension in Supabase.
3. Open the SQL Editor and run [database/schema.sql](database/schema.sql).
4. Copy the Supabase connection string into `DATABASE_URL` on Render.

## Domain Configuration

Configure these production domains:

1. Frontend: `ppoint.online`
2. Frontend: `www.ppoint.online`
3. Backend API: `api.ppoint.online`

Point the frontend domains to Vercel and the API domain to Render using the DNS values shown in each platform dashboard.

## Scaling Notes

- Use Redis for session management.
- Implement read replicas for the database.
- Use a CDN for static assets.

## Overview

This implementation includes the grid-based addressing flow, proximity detection, an admin dashboard, and a Docker-based deployment path for future expansion.