# Extraordinary Life (NG)

Co-working seat booking frontend for Extraordinary Life.

## Quick start

**1. Start the API** (see [extraordinarylife-backend](https://github.com/DevDavidWisdom/extraordinarylife-backend))

```bash
cd ~/extraordinarylife-backend
cp .env.example .env
docker compose up --build
```

**2. Start the frontend**

```bash
npm start
```

Open http://localhost:3456

Production API: `https://extraordinarylife-backend-production.up.railway.app`

`index.html` uses localhost when developing locally, otherwise the Railway URL above.

## Admin login

Admin credentials are configured on the backend via environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).

## Stack

- Vanilla JS modules, CSS
- Connects to Express + PostgreSQL API
- JWT stored in browser (`el_token`) for session only
