# Monitoring Dashboard

Production-structured monitoring dashboard built with Next.js App Router, Tailwind CSS, Prisma, and Neon PostgreSQL.

## Features

- Dashboard with status summary cards, filters, and endpoint table
- History page with uptime trend chart and recent check log
- Company CRUD with ownership metadata
- Endpoint CRUD with current monitoring status
- Monitoring engine with response time checks and warning/down classification
- Telegram alerts for down and recovery transitions with duplicate suppression
- Settings page for Telegram and monitoring thresholds
- REST-style API routes for companies, endpoints, monitoring, and settings

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS with shadcn-inspired UI components
- Prisma ORM + Neon PostgreSQL

## Run locally

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

Open `http://localhost:3000`.

## Notes

- Monitoring also starts as a background worker when the Next.js Node server boots, so checks continue even if nobody opens the dashboard.
- You can also trigger an immediate cycle from the dashboard or by calling `POST /api/monitoring/run`.
- The built-in worker requires a persistent Node process such as `npm run dev` or `npm run start`; it is not suitable for serverless deployments that sleep between requests.

## Deploy to Vercel

- Create a Neon project and copy its pooled connection string into `DATABASE_URL`.
- Add these environment variables in Vercel Project Settings:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `CRON_SECRET`
- Optional alert settings can also be set from the UI after deploy.
- The cron endpoint validates `Authorization: Bearer <CRON_SECRET>`.

### Neon setup

- Create a new Neon database and keep the default `neondb` database.
- Copy the Prisma-compatible connection string, for example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@EP-XXXX-XXXX.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@EP-XXXX-XXXX.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

- In local development, put the pooled connection in `DATABASE_URL` and the non-pooler connection in `DIRECT_URL`.
- Run `npm run prisma:push` to create the schema in Neon.
- Run `npm run seed` if you want sample companies and endpoints.

### Vercel deploy steps

- Import this repo into Vercel.
- Set `DATABASE_URL`, `DIRECT_URL`, and `CRON_SECRET` in the Vercel project.
- Deploy once.
- Open the deployed app, then add Telegram settings in `/settings` if needed.

### External cron for Hobby plan

- Vercel Hobby does not support running a cron every 5 minutes.
- Use an external scheduler such as GitHub Actions, cron-job.org, UptimeRobot, or EasyCron.
- Configure it to call:

```text
GET https://your-domain.vercel.app/api/cron/monitoring
Authorization: Bearer <CRON_SECRET>
```

- Schedule it for every 5 minutes.

### Important runtime note

- On Vercel, the built-in Node background worker is disabled.
- Monitoring should be triggered by an external cron through `/api/cron/monitoring` every 5 minutes.
