# Free Deployment Guide

This guide gives the exact values to enter for:

1. Vercel
2. Railway
3. Supabase

## 1. Vercel

Create a new Vercel project from this GitHub repository.

Use these values:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Node.js Version: `20.x` if Vercel asks

Environment variables:

- `VITE_API_BASE_URL` = `https://api.ppoint.online/api`

Domains to add in Vercel:

- `ppoint.online`
- `www.ppoint.online`

DNS expectation:

- Point `ppoint.online` to Vercel using the A or alias record Vercel shows
- Point `www.ppoint.online` to Vercel using the CNAME record Vercel shows

Relevant project file:

- [frontend/vercel.json](frontend/vercel.json)

## 2. Railway

Create a new Railway project from this GitHub repository.

Use these values:

- Service Source: GitHub repo
- Root Directory: `backend`
- Start Command: `npm start`
- Build Command: leave default or let Railway detect from [backend/railway.json](backend/railway.json)

Environment variables to add in Railway:

- `DATABASE_URL` = your Supabase PostgreSQL connection string
- `ADMIN_TOKEN` = your secret admin token
- `API_BASE_URL` = `https://api.ppoint.online`
- `FRONTEND_URL` = `https://ppoint.online`
- `NODE_ENV` = `production`
- `USE_IN_MEMORY_DB` = `false`
- `INIT_DB_ON_START` = `false`
- `GRID_SIZE` = `20`
- `PROXIMITY_RADIUS` = `15`

Port behavior:

- Railway will inject `PORT` automatically
- The backend already listens on `process.env.PORT`

Domain to add in Railway:

- `api.ppoint.online`

Health check path:

- `/health`

Relevant project files:

- [backend/railway.json](backend/railway.json)
- [backend/src/app.js](backend/src/app.js)
- [backend/src/config/database.js](backend/src/config/database.js)

## 3. Supabase

Create a new free Supabase project.

After the project is created:

1. Open `Project Settings`
2. Open `Database`
3. Copy the connection string

Use the pooled connection string format:

```text
postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require
```

That full string becomes the Railway value for:

- `DATABASE_URL`

Enable PostGIS:

1. Open `SQL Editor`
2. Run:

```sql
create extension if not exists postgis;
```

Load the app schema:

1. Open [database/schema.sql](database/schema.sql)
2. Copy the file contents
3. Paste into the Supabase SQL Editor
4. Run it

Expected result:

- Continents table created
- Countries table created
- States table created
- Cities table created
- Addresses table created
- Initial Nigeria seed data inserted

## Domain Mapping

Use these final domains:

- Frontend main site: `ppoint.online`
- Frontend alias: `www.ppoint.online`
- Backend API: `api.ppoint.online`

Final domain split:

- Vercel serves `ppoint.online`
- Vercel serves `www.ppoint.online`
- Railway serves `api.ppoint.online`

## DNS Records

Create these DNS records at your domain provider.

### Frontend records for Vercel

For the root domain:

- Type: `A`
- Name/Host: `@`
- Value: `76.76.21.21`

For the `www` subdomain:

- Type: `CNAME`
- Name/Host: `www`
- Value: `cname.vercel-dns.com`

### Backend API record for Railway

For the API subdomain:

- Type: `CNAME`
- Name/Host: `api`
- Value: use the Railway target shown when you add `api.ppoint.online` in Railway

Typical Railway target shape:

- `something.up.railway.app`

Important note:

- The Vercel values above are stable and can be added now.
- The Railway `api` target is generated per project, so you must copy the exact value from the Railway custom domain screen.
- If your DNS provider does not allow `CNAME` flattening rules on the apex, keep `@` on the Vercel A record and do not point `@` to Railway.

## Click-By-Click Domain Setup

### Vercel custom domains

After the frontend project is created in Vercel:

1. Open the Vercel project.
2. Go to `Settings`.
3. Open `Domains`.
4. Add `ppoint.online`.
5. Add `www.ppoint.online`.
6. Copy the DNS instructions shown by Vercel.
7. At your DNS provider, create or update:
	1. `A` record for `@` to `76.76.21.21`
	2. `CNAME` record for `www` to `cname.vercel-dns.com`
8. Return to Vercel and wait for domain verification to turn green.

### Railway custom domain

After the backend project is created in Railway:

1. Open the Railway service.
2. Go to `Settings`.
3. Open `Networking` or `Domains`.
4. Add custom domain `api.ppoint.online`.
5. Railway will show a target hostname.
6. At your DNS provider, create:
	1. `CNAME` record for `api` pointing to the exact Railway target hostname
7. Return to Railway and wait for domain verification to complete.

## DNS Verification

After you add the records, verify them from your terminal.

### Windows commands

```powershell
nslookup ppoint.online
nslookup www.ppoint.online
nslookup api.ppoint.online
```

Expected pattern after DNS propagation:

1. `ppoint.online` should resolve to `76.76.21.21` or Vercel-managed equivalent
2. `www.ppoint.online` should resolve through `cname.vercel-dns.com`
3. `api.ppoint.online` should resolve to the Railway target hostname

### Browser verification

After DNS is live:

1. Open `https://ppoint.online`
2. Open `https://www.ppoint.online`
3. Open `https://api.ppoint.online/health`

### Current status observed from this machine

At the moment, DNS is still on the old/default parking path:

1. `ppoint.online` resolves to `192.64.119.227`
2. `www.ppoint.online` points to `parkingpage.namecheap.com`
3. `api.ppoint.online` does not exist yet

## Deployment Order

Use this order so nothing points to a missing service:

1. Create the Supabase project
2. Enable `postgis`
3. Run [database/schema.sql](database/schema.sql)
4. Create the Railway backend service
5. Add Railway environment variables
6. Deploy Railway and confirm `/health` works
7. Create the Vercel frontend project
8. Add `VITE_API_BASE_URL`
9. Deploy Vercel
10. Attach custom domains on Railway and Vercel
11. Update DNS records to match both dashboards

## Smoke Test

After deployment, test these URLs:

1. `https://api.ppoint.online/health`
2. `https://ppoint.online`
3. `https://www.ppoint.online`

Backend API checks:

1. `GET https://api.ppoint.online/health`
2. `GET https://api.ppoint.online/api/cities`

Frontend checks:

1. Homepage loads fully
2. Map renders
3. Manual map selection works
4. Address generation works

## Required Values Summary

Vercel:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Env: `VITE_API_BASE_URL=https://api.ppoint.online/api`

Railway:

- Root Directory: `backend`
- Start Command: `npm start`
- Health Check: `/health`
- Env: `DATABASE_URL`, `ADMIN_TOKEN`, `API_BASE_URL`, `FRONTEND_URL`

Supabase:

- Enable `postgis`
- Run [database/schema.sql](database/schema.sql)
- Copy pooled PostgreSQL connection string into Railway `DATABASE_URL`