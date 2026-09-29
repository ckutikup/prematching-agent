# PreMatching Agent

Find pre-college programs based on a student's interests, grade level, preferred format, and budget. Compare recommendations, ask questions about a program, and keep a shortlist with personal notes.

## Stack

- React, TypeScript, Vite, and Tailwind CSS
- FastAPI and Pydantic
- Supabase for programs, profiles, saved programs, and vector search
- Anthropic for recommendations and program chat
- Voyage for embeddings; optional Langfuse tracing

## Local setup

Requires Node.js 22.12+ and Python 3.13.

```sh
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
```

Fill in `ANTHROPIC_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`. Set `VOYAGE_API_KEY` to enable embedding-based retrieval and catalog seeding. Keep these values on the server.

For a new Supabase project, apply `backend/scripts/schema.sql` in the SQL editor, then populate the catalog from the backend directory:

```sh
python -m scripts.seed
```

Seeding writes to the configured database and calls the embedding service. Skip it when using an already populated database.

Start the backend:

```sh
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal, start the frontend:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` requests to the backend. API documentation is at http://127.0.0.1:8000/docs.

## Checks

```sh
cd frontend
npm run lint
npm run build
```

```sh
cd backend
source .venv/bin/activate
python -m pytest -q
```

## Docker

```sh
docker build -t prematching-agent .
docker run --rm --env-file backend/.env -p 8000:8000 prematching-agent
```

Open http://localhost:8000. The container serves the built frontend and API together. `PORT` defaults to `8000`; `/health` is the health-check endpoint. A Render Blueprint is included in `render.yaml` for a future deployment.

## Current scope

This is a local prototype. Profiles and shortlist endpoints do not yet enforce user authentication, and model calls have no per-user rate limits. Add these controls before opening the service to public traffic. Program details and deadlines should be checked against the provider's website.
