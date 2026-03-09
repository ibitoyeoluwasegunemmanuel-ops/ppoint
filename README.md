# PPOINT

PPOINT is a digital addressing platform with a Node.js backend, React frontend, and PostgreSQL/PostGIS database.

## Project Structure

```text
ppoint/
├── .env.example
├── backend/
│   ├── railway.json
│   └── .env.example
├── database/
├── frontend/
│   ├── vercel.json
│   └── .env.example
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
2. Railway for the backend API
3. Supabase PostgreSQL for the database

For exact dashboard values, DNS records, and click-by-click setup, see [DEPLOY_FREE_STACK.md](DEPLOY_FREE_STACK.md).

## Environment Variables

- Set `ADMIN_TOKEN` for admin dashboard access.
- Configure `DATABASE_URL` with your Supabase PostgreSQL connection string.
- Set `API_BASE_URL=https://api.ppoint.online`.
- For the frontend, set `VITE_API_BASE_URL=https://api.ppoint.online/api`.
- For production on `ppoint.online`, set `FRONTEND_URL=https://ppoint.online` in the backend environment.

Use [.env.example](.env.example) as the base reference. Backend-specific placeholders also exist in [backend/.env.example](backend/.env.example), and frontend-specific placeholders exist in [frontend/.env.example](frontend/.env.example).

## GitHub

Repository remote:

```text
https://github.com/ibitoyeoluwasegunemmanuel-ops/ppoint.git
```

## Frontend Deployment: Vercel

The frontend already uses Vite and has the correct build script in [frontend/package.json](frontend/package.json):

1. Build command: `npm run build`
2. Output directory: `dist`

Vercel config is defined in [frontend/vercel.json](frontend/vercel.json).

### Vercel steps

1. Import the GitHub repository into Vercel.
2. Set the project root directory to `frontend`.
3. Confirm build command is `npm run build`.
4. Confirm output directory is `dist`.
5. Set environment variable `VITE_API_BASE_URL=https://api.ppoint.online/api`.
6. Add custom domains `ppoint.online` and `www.ppoint.online`.

## Backend Deployment: Railway

The backend is configured to start with `npm start` in [backend/package.json](backend/package.json), and Railway config is defined in [backend/railway.json](backend/railway.json).

The server listens on `process.env.PORT` in [backend/src/app.js](backend/src/app.js).

### Railway steps

1. Create a new Railway project from the GitHub repository.
2. Set the service root directory to `backend`.
3. Confirm start command is `npm start`.
4. Add these Railway environment variables:
	1. `DATABASE_URL`
	2. `ADMIN_TOKEN`
	3. `API_BASE_URL=https://api.ppoint.online`
	4. `FRONTEND_URL=https://ppoint.online`
	5. `NODE_ENV=production`
5. Add the custom domain `api.ppoint.online`.

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
4. Copy the Supabase connection string into `DATABASE_URL` on Railway.

## Domain Configuration

Configure these production domains:

1. Frontend: `ppoint.online`
2. Frontend: `www.ppoint.online`
3. Backend API: `api.ppoint.online`

Point the frontend domains to Vercel and the API domain to Railway using the DNS values shown in each platform dashboard.

## Scaling Notes

- Use Redis for session management.
- Implement read replicas for the database.
- Use a CDN for static assets.

## Overview

This implementation includes the grid-based addressing flow, proximity detection, an admin dashboard, and a Docker-based deployment path for future expansion.