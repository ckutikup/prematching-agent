# PreMatching Agent

A full-stack application that helps students discover pre-college programs aligned with their interests, academic stage, goals, and budget. It combines semantic search with personalized recommendations, program-specific chat, and a saved shortlist.

## Features

- **Student profiles** — capture interests, grade level, academic background, format preferences, and budget.
- **Personalized matching** — retrieve relevant programs with vector search, then rank candidates with fit scores and explanations.
- **Program exploration** — review eligibility, cost, format, and provider links.
- **Program chat** — ask follow-up questions using the student's profile and selected program as context.
- **Saved shortlists** — save programs and keep personal notes.

## Architecture

```text
React + TypeScript
        │ /api
        ▼
FastAPI
  ├── Supabase / pgvector     Program catalog, profiles, saved programs
  ├── Voyage                 Profile and program embeddings
  ├── Anthropic              Fit scoring, recommendations, chat
  └── Langfuse (optional)     Model-call tracing
```

The frontend uses Vite, Tailwind CSS, and React Router. The backend validates requests with Pydantic and retrieves a focused candidate set before generating recommendations.

## Getting started

Requires Node.js 22.12+ and Python 3.13, plus your own Supabase, Anthropic, and Voyage configuration.

```sh
git clone https://github.com/ckutikup/prematching-agent.git
cd prematching-agent
```

### 1. Configure the backend

```sh
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
```

Set the following values in `backend/.env`:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side access to the project database |
| `ANTHROPIC_API_KEY` | Recommendations and chat |
| `VOYAGE_API_KEY` | Semantic retrieval and catalog embeddings |
| `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` | Optional model-call tracing |

Credentials stay in the backend environment and are excluded from version control. Supabase is configurable: point the application at your own project using these environment variables.

### 2. Initialize the catalog

For a new database, run `backend/scripts/schema.sql` in the Supabase SQL editor. Then, from the `backend` directory with the virtual environment active:

```sh
python -m scripts.seed
```

This loads the included program catalog and generates its embeddings. Skip this step when connecting to an already initialized database. Embedding and model requests use your configured providers' API accounts.

### 3. Start the application

From `backend`:

```sh
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173). Vite forwards `/api` requests to FastAPI. Interactive API documentation is available at [localhost:8000/docs](http://localhost:8000/docs).

## Quality checks

From the repository root:

```sh
npm --prefix frontend run lint
npm --prefix frontend run build
```

From `backend`, with the virtual environment active:

```sh
python -m pytest -q
```

Tests cover profile validation, embeddings, retrieval, model response handling, and production routing. The test suite uses stubs and mocks, so it does not require live provider credentials.

## Run with Docker

From the repository root, after configuring the environment and database:

```sh
docker build -t prematching-agent .
docker run --rm --env-file backend/.env -p 8000:8000 prematching-agent
```

Open [localhost:8000](http://localhost:8000). The container serves the frontend and API together. `PORT` defaults to `8000`; `/health` is the health-check endpoint. `render.yaml` provides an optional hosting configuration.

For shared hosting, configure authentication and API usage limits appropriate to your audience. Verify program dates and requirements against the provider's website.

## Project structure

```text
backend/
  app/          API routes, schemas, retrieval, and model clients
  data/         Program catalog
  scripts/      Database schema, catalog seeding, and evaluation
  tests/        Backend and routing tests
frontend/
  src/          Pages, components, API client, and browser storage
  public/       Static assets
Dockerfile      Combined frontend and backend container
render.yaml     Optional Render configuration
```
