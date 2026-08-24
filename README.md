# BlueApp

BlueApp is split into a React frontend and a Node backend.

## Local dev

Frontend:

```powershell
cd frontend
copy .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Backend:

```powershell
cd backend
copy .env.example .env
npm.cmd install
npm.cmd start
```

## Render + Supabase

1. Create a Supabase project and run `backend/db/migrations/0001_init.sql` in the SQL editor.
2. Add the values from `backend/.env.example` to your Render backend service.
3. Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` on the backend service.
4. Set `FRONTEND_URL` to your deployed frontend URL.
5. Set `VITE_API_BASE_URL` in the frontend environment to the deployed backend URL.
6. Start the backend once. It will seed the `countries` and `achievements` tables automatically if they are empty.

## Notes

- The backend uses Supabase Auth and Supabase Postgres when `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are present.
- If those env vars are missing, the backend falls back to the local JSON store for development.
