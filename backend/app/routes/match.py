from fastapi import APIRouter, HTTPException

from app.db import get_supabase
from app.llm import match_programs
from app.retrieval import shortlist_programs
from app.schemas import MatchResponse, StudentProfile

router = APIRouter(prefix="/match", tags=["match"])


@router.post("", response_model=MatchResponse)
def create_match(profile: StudentProfile) -> MatchResponse:
    # RAG step: pgvector shortlists the top-K programs by semantic similarity
    # so Claude ranks a focused candidate set instead of the full catalog.
    shortlisted = shortlist_programs(profile)

    if not shortlisted:
        # Cold start (no embeddings seeded yet) — use the full catalog so the
        # product still works during setup.
        res = get_supabase().table("programs").select("*").execute()
        shortlisted = res.data or []

    if not shortlisted:
        raise HTTPException(status_code=500, detail="Program catalog is empty")

    return match_programs(profile, shortlisted)
