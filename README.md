# PreMatching Agent

Vantion pre-college program matching app: React + TypeScript frontend, FastAPI backend, Supabase storage, Anthropic recommendations and chat, and optional Voyage embeddings and Langfuse tracing.

## Run locally

1. Create a Python 3.13 virtual environment in `backend/.venv` and install `backend/requirements-dev.txt`.
2. Copy `backend/.env.example` to `backend/.env` and fill in your server-side keys.
3. Apply `backend/scripts/schema.sql` in your Supabase SQL editor if the database is new. From `backend`, run `python -m scripts.seed` to populate the catalog (this writes to your configured database and may use paid embedding calls).
4. From `backend`, run `uvicorn app.main:app --reload`.
5. From `frontend`, run `npm ci` and `npm run dev`.

## Deploy

A `render.yaml` Blueprint is included for Render, with secret values supplied through its dashboard (see https://render.com/docs/blueprint-spec).

Build the root `Dockerfile` on a Docker-capable web host. The container serves both the React app and the Python API, listening on the host-provided `PORT` (default 8000). Use `/health` as the health-check path.

Set `ANTHROPIC_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in the host's secret environment settings. Optional settings are listed in `backend/.env.example`. Never add secret values to GitHub or frontend code.

The frontend calls `/api`; production routes this to FastAPI in the same container. React page routes fall back to `index.html`.

The existing application has no user authentication or API rate limiting. Public use can incur AI charges; use a host access gate for a private demo until authentication and usage controls are added. Student and saved-program endpoints currently rely on client-provided identifiers.

## Checks

- Frontend: `npm run build` and `npm run lint` from `frontend`.
- Backend: `python -m pytest` from `backend`.

The repository excludes local credentials, virtual environments, node_modules, build output, and the original recording.
