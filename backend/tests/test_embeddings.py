from app.embeddings import program_text, student_query_text
from app.schemas import StudentProfile


SAMPLE_PROGRAM = {
    "slug": "rsi",
    "name": "Research Science Institute",
    "host": "MIT",
    "subjects": ["biology", "math"],
    "format": "residential",
    "grade_levels": ["rising senior"],
    "duration_weeks": 6,
    "cost_model": "free",
    "selectivity": "highly selective",
    "application_window": "Dec–Jan",
    "eligibility_note": "US and international",
    "url": "https://example.com",
    "description": "Intensive summer research program.",
}


class TestProgramText:
    def test_includes_key_fields_for_embedding(self):
        text = program_text(SAMPLE_PROGRAM)
        assert "Research Science Institute" in text
        assert "MIT" in text
        assert "biology" in text
        assert "residential" in text
        assert "highly selective" in text
        assert "Intensive summer research program." in text

    def test_handles_missing_optional_fields(self):
        minimal = {
            "slug": "x",
            "name": "X",
            "host": "Y",
            "subjects": [],
            "format": "virtual",
            "grade_levels": [],
            "duration_weeks": 1,
            "cost_model": "free",
            "selectivity": "open",
            "eligibility_note": None,
            "description": "desc",
        }
        text = program_text(minimal)
        assert "X at Y" in text
        assert "desc" in text


class TestStudentQueryText:
    def test_includes_interests_and_goals(self):
        profile = StudentProfile(
            name="Maya",
            grade_level="rising junior",
            interests=["biology", "chemistry"],
            location_flexibility="no preference",
            goals="pre-med",
        )
        text = student_query_text(profile)
        assert "biology, chemistry" in text
        assert "pre-med" in text
        assert "rising junior" in text

    def test_omits_empty_optional_fields(self):
        profile = StudentProfile(
            name="Maya",
            grade_level="rising junior",
            interests=["biology"],
            location_flexibility="no preference",
        )
        text = student_query_text(profile)
        assert "Goals" not in text
        assert "Budget" not in text