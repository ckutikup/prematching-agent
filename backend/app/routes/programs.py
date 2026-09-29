from fastapi import APIRouter, HTTPException

from app.db import get_supabase
from app.schemas import SaveProgramRequest, StudentProfile

router = APIRouter(prefix="/programs", tags=["programs"])


@router.get("")
def list_programs() -> list[dict]:
    res = get_supabase().table("programs").select("*").order("name").execute()
    return res.data or []


@router.get("/{slug}")
def get_program(slug: str) -> dict:
    res = get_supabase().table("programs").select("*").eq("slug", slug).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Program not found")
    return res.data


@router.post("/students")
def create_student(profile: StudentProfile) -> dict:
    payload = profile.model_dump()
    res = get_supabase().table("students").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create student")
    return res.data[0]


@router.post("/saved")
def save_program(req: SaveProgramRequest) -> dict:
    res = (
        get_supabase()
        .table("saved_programs")
        .upsert(req.model_dump(), on_conflict="student_id,program_slug")
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save program")
    return res.data[0]


@router.delete("/saved")
def unsave_program(student_id: str, program_slug: str) -> dict:
    (
        get_supabase()
        .table("saved_programs")
        .delete()
        .eq("student_id", student_id)
        .eq("program_slug", program_slug)
        .execute()
    )
    return {"ok": True}


@router.get("/saved/{student_id}")
def list_saved(student_id: str) -> list[dict]:
    res = (
        get_supabase()
        .table("saved_programs")
        .select("program_slug, note, created_at, programs(*)")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []
