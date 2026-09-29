from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from app import llm
from app.schemas import ChatTurn, StudentProfile


PROGRAMS = [
    {
        "slug": "alpha",
        "name": "Alpha",
        "host": "Alpha U",
        "subjects": ["biology"],
        "format": "residential",
        "grade_levels": ["rising junior"],
        "duration_weeks": 6,
        "cost_model": "free",
        "selectivity": "selective",
        "eligibility_note": "",
        "description": "A program.",
    },
    {
        "slug": "beta",
        "name": "Beta",
        "host": "Beta U",
        "subjects": ["math"],
        "format": "virtual",
        "grade_levels": ["rising junior"],
        "duration_weeks": 4,
        "cost_model": "tuition",
        "selectivity": "selective",
        "eligibility_note": "",
        "description": "Another program.",
    },
]


PROFILE = StudentProfile(
    name="Maya",
    grade_level="rising junior",
    interests=["biology"],
    location_flexibility="no preference",
)


def _fake_response(tool_input: dict):
    tool_block = SimpleNamespace(
        type="tool_use", name="rank_programs", input=tool_input
    )
    return SimpleNamespace(content=[tool_block])


@pytest.fixture
def mock_anthropic():
    client = MagicMock()
    with patch.object(llm, "get_client", return_value=client):
        yield client


class TestMatchPrograms:
    def test_sorts_matches_by_fit_score_desc(self, mock_anthropic):
        mock_anthropic.messages.create.return_value = _fake_response(
            {
                "summary": "ok",
                "matches": [
                    {"slug": "alpha", "fit_score": 60, "why_it_fits": "a"},
                    {"slug": "beta", "fit_score": 88, "why_it_fits": "b"},
                ],
            }
        )
        result = llm.match_programs(PROFILE, PROGRAMS)
        assert [m.slug for m in result.matches] == ["beta", "alpha"]
        assert result.matches[0].fit_score == 88

    def test_drops_invalid_slugs(self, mock_anthropic):
        mock_anthropic.messages.create.return_value = _fake_response(
            {
                "summary": "ok",
                "matches": [
                    {"slug": "alpha", "fit_score": 80, "why_it_fits": "a"},
                    {"slug": "not-in-catalog", "fit_score": 95, "why_it_fits": "x"},
                ],
            }
        )
        result = llm.match_programs(PROFILE, PROGRAMS)
        assert [m.slug for m in result.matches] == ["alpha"]

    def test_passes_tool_choice_to_force_structured_output(self, mock_anthropic):
        mock_anthropic.messages.create.return_value = _fake_response(
            {
                "summary": "ok",
                "matches": [{"slug": "alpha", "fit_score": 80, "why_it_fits": "a"}],
            }
        )
        llm.match_programs(PROFILE, PROGRAMS)
        kwargs = mock_anthropic.messages.create.call_args.kwargs
        assert kwargs["tool_choice"] == {"type": "tool", "name": "rank_programs"}

    def test_raises_when_no_tool_use_returned(self, mock_anthropic):
        text_only = SimpleNamespace(
            content=[SimpleNamespace(type="text", text="hi")]
        )
        mock_anthropic.messages.create.return_value = text_only
        with pytest.raises(RuntimeError):
            llm.match_programs(PROFILE, PROGRAMS)

    def test_returns_empty_matches_when_all_slugs_invalid(self, mock_anthropic):
        mock_anthropic.messages.create.return_value = _fake_response(
            {
                "summary": "ok",
                "matches": [
                    {"slug": "ghost", "fit_score": 90, "why_it_fits": "a"},
                ],
            }
        )
        result = llm.match_programs(PROFILE, PROGRAMS)
        assert result.matches == []
        assert result.summary == "ok"


class TestChatReply:
    def test_trims_history_to_window(self, mock_anthropic):
        mock_anthropic.messages.create.return_value = SimpleNamespace(
            content=[SimpleNamespace(type="text", text="reply")]
        )
        long_history = [
            ChatTurn(role="user" if i % 2 == 0 else "assistant", content=f"{i}")
            for i in range(100)
        ]
        llm.chat_reply(PROFILE, None, long_history, "next?")

        kwargs = mock_anthropic.messages.create.call_args.kwargs
        sent_messages = kwargs["messages"]
        # window (20) + the new user message
        assert len(sent_messages) == llm.CHAT_HISTORY_WINDOW + 1
        # last sent history turn should be the final one from the tail of input
        assert sent_messages[-2]["content"] == "99"
        assert sent_messages[-1]["content"] == "next?"

    def test_includes_program_context_when_provided(self, mock_anthropic):
        mock_anthropic.messages.create.return_value = SimpleNamespace(
            content=[SimpleNamespace(type="text", text="reply")]
        )
        program = PROGRAMS[0]
        llm.chat_reply(PROFILE, program, [], "hi")

        kwargs = mock_anthropic.messages.create.call_args.kwargs
        assert "Alpha" in kwargs["system"]

    def test_omits_program_context_when_none(self, mock_anthropic):
        mock_anthropic.messages.create.return_value = SimpleNamespace(
            content=[SimpleNamespace(type="text", text="reply")]
        )
        llm.chat_reply(PROFILE, None, [], "hi")

        kwargs = mock_anthropic.messages.create.call_args.kwargs
        assert "Program being discussed" not in kwargs["system"]
