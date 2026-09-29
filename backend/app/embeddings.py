"""Voyage AI embeddings client. Used for RAG over the program catalog."""

from functools import lru_cache

import voyageai

from app.config import get_settings
from app.schemas import StudentProfile


@lru_cache
def get_voyage_client() -> voyageai.Client:
    settings = get_settings()
    if not settings.voyage_api_key:
        raise RuntimeError(
            "VOYAGE_API_KEY is not configured. Embeddings/RAG require it."
        )
    return voyageai.Client(api_key=settings.voyage_api_key)


def program_text(program: dict) -> str:
    """Flatten a program row into the text we embed. Keep this stable —
    changing it invalidates every embedding already stored in the DB."""
    subjects = ", ".join(program.get("subjects") or [])
    grades = ", ".join(program.get("grade_levels") or [])
    parts = [
        f"{program['name']} at {program['host']}",
        f"Subjects: {subjects}" if subjects else "",
        f"Format: {program['format']}",
        f"Eligible grades: {grades}" if grades else "",
        f"Selectivity: {program['selectivity']}",
        f"Cost model: {program['cost_model']}",
        program.get("eligibility_note") or "",
        program["description"],
    ]
    return "\n".join(p for p in parts if p)


def student_query_text(student: StudentProfile) -> str:
    interests = ", ".join(student.interests)
    parts = [
        f"Grade: {student.grade_level}",
        f"Interests: {interests}",
        f"Format preference: {student.location_flexibility}",
        f"Cost preference: {student.cost_preference}",
    ]
    if student.goal_tags:
        parts.append(f"Goals: {', '.join(student.goal_tags)}")
    if student.goals:
        parts.append(f"Notes on goals: {student.goals}")
    if student.budget_note:
        parts.append(f"Budget: {student.budget_note}")
    if student.prior_experience:
        parts.append(f"Prior experience: {student.prior_experience}")
    return "\n".join(parts)


def embed_documents(texts: list[str]) -> list[list[float]]:
    result = get_voyage_client().embed(
        texts, model=get_settings().voyage_model, input_type="document"
    )
    return result.embeddings


def embed_query(text: str) -> list[float]:
    result = get_voyage_client().embed(
        [text], model=get_settings().voyage_model, input_type="query"
    )
    return result.embeddings[0]
