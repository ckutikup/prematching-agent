"""RAG shortlist: pgvector similarity search over the program catalog."""

from app.config import get_settings
from app.db import get_supabase
from app.embeddings import embed_query, student_query_text
from app.schemas import StudentProfile


def shortlist_programs(student: StudentProfile, k: int | None = None) -> list[dict]:
    """Return the top-k programs most similar to the student's profile,
    ranked by cosine similarity. An empty result lets the calling route
    fall back to the full catalog when no embeddings have been seeded."""
    settings = get_settings()
    top_k = k or settings.retrieval_top_k

    query_vec = embed_query(student_query_text(student))

    res = get_supabase().rpc(
        "match_programs_by_embedding",
        {"query_embedding": query_vec, "match_count": top_k},
    ).execute()

    rows = res.data or []
    if not rows:
        # No embeddings seeded yet — caller will fall back to full catalog.
        return []
    return rows
