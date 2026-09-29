import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.routes import chat, match, programs

app = FastAPI(title="Vantion Pre-College Programs API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(programs.router)
app.include_router(match.router)
app.include_router(chat.router)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "version": app.version}


# Production serves the API and built React app from the same origin.
api = FastAPI(title=app.title, version=app.version)
api.include_router(programs.router)
api.include_router(match.router)
api.include_router(chat.router)
api.add_api_route("/health", health, methods=["GET"])
app.mount("/api", api)

frontend_dist = Path(os.environ.get(
    "FRONTEND_DIST", str(Path(__file__).resolve().parents[2] / "frontend" / "dist")
)).resolve()
if frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        candidate = (frontend_dist / path).resolve()
        if not candidate.is_relative_to(frontend_dist):
            raise HTTPException(status_code=404)
        if candidate.is_file():
            return FileResponse(candidate)
        if Path(path).suffix:
            raise HTTPException(status_code=404)
        return FileResponse(frontend_dist / "index.html")
