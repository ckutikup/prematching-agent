import pytest
from pydantic import ValidationError

from app.schemas import ChatRequest, ProgramMatch, StudentProfile


class TestStudentProfile:
    def _base(self, **overrides) -> dict:
        data = {
            "name": "Maya",
            "grade_level": "rising junior",
            "interests": ["biology"],
            "location_flexibility": "no preference",
        }
        data.update(overrides)
        return data

    def test_minimum_valid_profile(self):
        StudentProfile(**self._base())

    def test_rejects_empty_name(self):
        with pytest.raises(ValidationError):
            StudentProfile(**self._base(name=""))

    def test_rejects_empty_interests(self):
        with pytest.raises(ValidationError):
            StudentProfile(**self._base(interests=[]))

    def test_rejects_too_many_interests(self):
        with pytest.raises(ValidationError):
            StudentProfile(**self._base(interests=[f"i{i}" for i in range(9)]))

    def test_rejects_invalid_grade(self):
        with pytest.raises(ValidationError):
            StudentProfile(**self._base(grade_level="college junior"))

    @pytest.mark.parametrize("gpa", [-0.1, 4.01, 5.0, 10])
    def test_rejects_out_of_range_gpa(self, gpa):
        with pytest.raises(ValidationError):
            StudentProfile(**self._base(gpa=gpa))

    @pytest.mark.parametrize("gpa", [0.0, 2.5, 3.8, 4.0])
    def test_accepts_valid_gpa(self, gpa):
        StudentProfile(**self._base(gpa=gpa))

    def test_allows_optional_fields_null(self):
        p = StudentProfile(**self._base(gpa=None, budget_note=None, goals=None))
        assert p.gpa is None
        assert p.budget_note is None
        assert p.goals is None

    def test_cost_preference_defaults_to_no_preference(self):
        p = StudentProfile(**self._base())
        assert p.cost_preference == "no_preference"

    def test_rejects_invalid_cost_preference(self):
        with pytest.raises(ValidationError):
            StudentProfile(**self._base(cost_preference="cheap"))

    def test_accepts_valid_goal_tags(self):
        p = StudentProfile(
            **self._base(goal_tags=["research_experience", "strengthen_application"])
        )
        assert "research_experience" in p.goal_tags
        assert len(p.goal_tags) == 2

    def test_rejects_invalid_goal_tag(self):
        with pytest.raises(ValidationError):
            StudentProfile(**self._base(goal_tags=["world_domination"]))

    def test_goal_tags_default_empty(self):
        p = StudentProfile(**self._base())
        assert p.goal_tags == []

    def test_prior_experience_respects_max_length(self):
        with pytest.raises(ValidationError):
            StudentProfile(**self._base(prior_experience="x" * 501))


class TestProgramMatch:
    def test_rejects_score_above_100(self):
        with pytest.raises(ValidationError):
            ProgramMatch(slug="x", fit_score=101, why_it_fits="…")

    def test_rejects_negative_score(self):
        with pytest.raises(ValidationError):
            ProgramMatch(slug="x", fit_score=-1, why_it_fits="…")


class TestChatRequest:
    def _base(self, **overrides) -> dict:
        data = {
            "student": {
                "name": "Maya",
                "grade_level": "rising junior",
                "interests": ["biology"],
                "location_flexibility": "no preference",
            },
            "message": "How competitive?",
        }
        data.update(overrides)
        return data

    def test_accepts_empty_history(self):
        req = ChatRequest(**self._base())
        assert req.history == []

    def test_accepts_long_history_up_to_cap(self):
        history = [
            {"role": "user" if i % 2 == 0 else "assistant", "content": f"msg {i}"}
            for i in range(100)
        ]
        req = ChatRequest(**self._base(history=history))
        assert len(req.history) == 100

    def test_rejects_empty_message(self):
        with pytest.raises(ValidationError):
            ChatRequest(**self._base(message=""))
