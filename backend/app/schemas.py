from typing import Literal
from pydantic import BaseModel, Field


GradeLevel = Literal[
    "rising freshman",
    "rising sophomore",
    "rising junior",
    "rising senior",
]

Format = Literal[
    "residential",
    "virtual",
    "hybrid",
    "commuter",
    "no preference",
]

CostPreference = Literal[
    "free_or_aid_only",
    "prefer_low_cost",
    "open_to_tuition",
    "no_preference",
]

GoalTag = Literal[
    "explore_major",
    "strengthen_application",
    "research_experience",
    "earn_credit",
    "campus_experience",
]


class StudentProfile(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    grade_level: GradeLevel
    interests: list[str] = Field(min_length=1, max_length=8)
    gpa: float | None = Field(default=None, ge=0.0, le=4.0)
    location_flexibility: Format = "no preference"
    cost_preference: CostPreference = "no_preference"
    goal_tags: list[GoalTag] = Field(default_factory=list, max_length=5)
    budget_note: str | None = Field(default=None, max_length=200)
    goals: str | None = Field(default=None, max_length=400)
    prior_experience: str | None = Field(default=None, max_length=500)


class ProgramMatch(BaseModel):
    slug: str
    fit_score: int = Field(ge=0, le=100)
    why_it_fits: str
    considerations: str | None = None


class MatchResponse(BaseModel):
    matches: list[ProgramMatch]
    summary: str


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    student: StudentProfile
    program_slug: str | None = None
    history: list[ChatTurn] = Field(default_factory=list, max_length=200)
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    reply: str


class SaveProgramRequest(BaseModel):
    student_id: str
    program_slug: str
    note: str | None = Field(default=None, max_length=500)
