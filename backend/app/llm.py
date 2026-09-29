import json
from functools import lru_cache
from anthropic import Anthropic

from app.config import get_settings
from app.schemas import (
    ChatTurn,
    MatchResponse,
    ProgramMatch,
    StudentProfile,
)
from app.tracing import observation


@lru_cache
def get_client() -> Anthropic:
    return Anthropic(api_key=get_settings().anthropic_api_key)


MATCH_TOOL = {
    "name": "rank_programs",
    "description": (
        "Return ranked pre-college program matches for the student. "
        "Only include programs from the supplied catalog. Use the student's "
        "grade level, interests, format preference, and goals to score fit."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "One short paragraph (2-3 sentences) addressed to the student, summarizing the overall shape of their matches.",
            },
            "matches": {
                "type": "array",
                "minItems": 3,
                "maxItems": 8,
                "items": {
                    "type": "object",
                    "properties": {
                        "slug": {"type": "string"},
                        "fit_score": {"type": "integer", "minimum": 0, "maximum": 100},
                        "why_it_fits": {
                            "type": "string",
                            "description": "2-3 sentences, specific to this student's profile. Reference their stated interests or goals by name.",
                        },
                        "considerations": {
                            "type": "string",
                            "description": "Honest tradeoffs or things to watch out for (selectivity, cost, eligibility mismatch, etc.). Keep to 1-2 sentences.",
                        },
                    },
                    "required": ["slug", "fit_score", "why_it_fits"],
                },
            },
        },
        "required": ["summary", "matches"],
    },
}


def _catalog_for_prompt(programs: list[dict]) -> str:
    compact = [
        {
            "slug": p["slug"],
            "name": p["name"],
            "host": p["host"],
            "subjects": p["subjects"],
            "format": p["format"],
            "grade_levels": p["grade_levels"],
            "duration_weeks": p["duration_weeks"],
            "cost_model": p["cost_model"],
            "selectivity": p["selectivity"],
            "eligibility_note": p["eligibility_note"],
            "description": p["description"],
        }
        for p in programs
    ]
    return json.dumps(compact, indent=2)


MATCH_SYSTEM_PROMPT = """You are Vantion's AI counselor, helping a high school student find pre-college summer programs that genuinely fit them. Vantion's values — equity, empowerment, integrity — apply to every recommendation.

Principles:
- Ground every recommendation in the student's stated interests, grade level, goal_tags, cost_preference, format preference, and prior experience. Reason about each explicitly.
- Only return programs from the provided catalog. Never invent programs, deadlines, costs, or acceptance rates.
- Equity matters: if cost_preference is `free_or_aid_only`, treat tuition-based programs without documented aid as a hard strike and say so. If it's `prefer_low_cost`, still surface tuition programs but flag the cost in `considerations`.
- Be honest about fit. Call out selectivity, eligibility, and cost mismatches in `considerations` rather than hiding them.
- Score realistically: 95 = near-bespoke for this student; 80 = strong fit with one meaningful caveat; 60 = plausible but with real tradeoffs; <50 = mostly mismatched.
- Write `why_it_fits` as if speaking directly to the student, in a warm, specific voice. Reference their actual interests, goals, and prior experience by name.
- Programs whose grade eligibility excludes the student may still be listed with a ⚠️ eligibility mismatch call-out in `considerations` if they are highly relevant for future planning — but score them lower and say explicitly that they cannot apply this cycle.
- When goal_tags include `research_experience`, weight hands-on research programs higher than enrichment-only ones. When they include `earn_credit`, weight credit-bearing programs higher.
"""


def match_programs(student: StudentProfile, programs: list[dict]) -> MatchResponse:
    client = get_client()
    settings = get_settings()

    user_message = (
        f"Student profile:\n{student.model_dump_json(indent=2)}\n\n"
        f"Program catalog (use only these slugs):\n{_catalog_for_prompt(programs)}\n\n"
        "Call the rank_programs tool with your matches."
    )

    trace_input = {
        "student": student.model_dump(),
        "shortlisted_slugs": [p["slug"] for p in programs],
    }
    with observation(name="match_programs", input=trace_input) as span:
        with observation(
            name="claude-rank-programs",
            as_type="generation",
            input=[{"role": "user", "content": user_message}],
            model=settings.claude_model,
            model_parameters={"max_tokens": 2048, "tool": "rank_programs"},
        ) as gen:
            response = client.messages.create(
                model=settings.claude_model,
                max_tokens=2048,
                system=MATCH_SYSTEM_PROMPT,
                tools=[MATCH_TOOL],
                tool_choice={"type": "tool", "name": "rank_programs"},
                messages=[{"role": "user", "content": user_message}],
            )
            usage = getattr(response, "usage", None)
            gen.update(
                output=[
                    getattr(b, "input", None) or getattr(b, "text", None)
                    for b in response.content
                ],
                usage_details={
                    "input_tokens": getattr(usage, "input_tokens", 0),
                    "output_tokens": getattr(usage, "output_tokens", 0),
                } if usage else None,
            )

        for block in response.content:
            if block.type == "tool_use" and block.name == "rank_programs":
                data = block.input
                valid_slugs = {p["slug"] for p in programs}
                matches = [
                    ProgramMatch(**m)
                    for m in data["matches"]
                    if m.get("slug") in valid_slugs
                ]
                matches.sort(key=lambda m: m.fit_score, reverse=True)
                result = MatchResponse(matches=matches, summary=data["summary"])
                span.update(output={
                    "summary": result.summary,
                    "matches": [m.model_dump() for m in result.matches],
                })
                return result

        raise RuntimeError("Model did not return a tool_use block")


CHAT_SYSTEM_PROMPT = """You are Vantion's AI counselor continuing a conversation with a high school student about pre-college summer programs.

The student's profile and (optionally) the program they are asking about are provided as context. Use them to answer honestly and specifically.

Guardrails:
- Never fabricate program details, deadlines, costs, or acceptance rates. If you don't know, say so and point them to the program's official site.
- Keep answers focused and actionable. Default to 2-4 short paragraphs.
- When a student asks about chances of admission, be honest about selectivity without being discouraging; suggest reaches, matches, and safer alternatives when appropriate.
"""


CHAT_HISTORY_WINDOW = 20


def chat_reply(
    student: StudentProfile,
    program: dict | None,
    history: list[ChatTurn],
    message: str,
) -> str:
    client = get_client()
    settings = get_settings()

    context_parts = [f"Student profile:\n{student.model_dump_json(indent=2)}"]
    if program:
        context_parts.append(f"Program being discussed:\n{json.dumps(program, indent=2)}")
    context = "\n\n".join(context_parts)

    recent = history[-CHAT_HISTORY_WINDOW:]
    messages = [{"role": t.role, "content": t.content} for t in recent]
    messages.append({"role": "user", "content": message})

    trace_input = {
        "student_name": student.name,
        "program_slug": program["slug"] if program else None,
        "history_len": len(history),
        "message": message,
    }
    with observation(name="chat_reply", input=trace_input) as span:
        with observation(
            name="claude-chat",
            as_type="generation",
            input=messages,
            model=settings.claude_model,
            model_parameters={"max_tokens": 1024},
        ) as gen:
            response = client.messages.create(
                model=settings.claude_model,
                max_tokens=1024,
                system=f"{CHAT_SYSTEM_PROMPT}\n\n{context}",
                messages=messages,
            )
            usage = getattr(response, "usage", None)
            reply_text = next(
                (b.text for b in response.content if b.type == "text"), None
            )
            gen.update(
                output=reply_text,
                usage_details={
                    "input_tokens": getattr(usage, "input_tokens", 0),
                    "output_tokens": getattr(usage, "output_tokens", 0),
                } if usage else None,
            )

        if reply_text is None:
            raise RuntimeError("Model returned no text block")

        span.update(output=reply_text)
        return reply_text
