from unittest.mock import MagicMock, patch

from app import retrieval
from app.schemas import StudentProfile


PROFILE = StudentProfile(
    name="Maya",
    grade_level="rising junior",
    interests=["biology", "research"],
    location_flexibility="no preference",
    goals="medical research career",
)


class TestShortlistPrograms:
    def test_returns_rows_from_rpc(self):
        fake_rows = [
            {"slug": "rsi", "name": "RSI", "similarity": 0.91},
            {"slug": "ssp", "name": "SSP", "similarity": 0.84},
        ]
        with patch.object(retrieval, "embed_query", return_value=[0.1] * 512), \
             patch.object(retrieval, "get_supabase") as mock_sb:
            mock_sb.return_value.rpc.return_value.execute.return_value = MagicMock(
                data=fake_rows
            )
            result = retrieval.shortlist_programs(PROFILE, k=2)

        assert [r["slug"] for r in result] == ["rsi", "ssp"]
        mock_sb.return_value.rpc.assert_called_once()
        call_args = mock_sb.return_value.rpc.call_args
        assert call_args.args[0] == "match_programs_by_embedding"
        assert call_args.args[1]["match_count"] == 2

    def test_returns_empty_when_no_embeddings_seeded(self):
        with patch.object(retrieval, "embed_query", return_value=[0.1] * 512), \
             patch.object(retrieval, "get_supabase") as mock_sb:
            mock_sb.return_value.rpc.return_value.execute.return_value = MagicMock(
                data=[]
            )
            result = retrieval.shortlist_programs(PROFILE)

        assert result == []

    def test_uses_configured_top_k_when_k_not_passed(self):
        with patch.object(retrieval, "embed_query", return_value=[0.1] * 512), \
             patch.object(retrieval, "get_supabase") as mock_sb, \
             patch.object(retrieval, "get_settings") as mock_settings:
            mock_settings.return_value.retrieval_top_k = 7
            mock_sb.return_value.rpc.return_value.execute.return_value = MagicMock(
                data=[]
            )
            retrieval.shortlist_programs(PROFILE)

            call_args = mock_sb.return_value.rpc.call_args
            assert call_args.args[1]["match_count"] == 7
