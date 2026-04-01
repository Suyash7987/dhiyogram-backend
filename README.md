# Dhiyogram Backend

## Setup

```bash
cd Dhiyo-back
npm install
copy .env.example .env
npm run dev
```

## Endpoints

- `GET /health` → basic health check
- `POST /auth/register` → creates a demo user (in-memory)
- `POST /auth/login` → verifies demo user (in-memory)

## MongoDB

Put your Atlas connection string in `MONGODB_URI` and keep `DB_NAME=Chatgram` to use your existing database.

Note: you asked to store passwords **without encryption/hashing**. This is implemented as requested, but it is unsafe for real users.

