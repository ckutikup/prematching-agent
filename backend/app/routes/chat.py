from fastapi import APIRouter, HTTPException

from app.db import get_supabase
from app.llm import chat_reply
from app.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    program = None
    if req.program_slug:
        res = (
            get_supabase()
            .table("programs")
            .select("*")
            .eq("slug", req.program_slug)
            .single()
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Program not found")
        program = res.data

    reply = chat_reply(req.student, program, req.history, req.message)
    return ChatResponse(reply=reply)
