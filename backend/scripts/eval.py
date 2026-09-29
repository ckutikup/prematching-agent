"""Canonical eval suite for the match endpoint.

Runs a handful of student profiles through /match and asserts that the
recommendations obey the hard constraints we claim in the product:
grade-eligibility integrity, cost-preference equity, and subject alignment.

Run: `python -m scripts.eval` from backend/. Requires the API on :8000.
Exits 0 on all-pass, 1 on any failure — wire into CI or sanity-check
before a demo.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from typing import Callable

import httpx

BASE_URL = "http://localhost:8000"

GREEN = "\033[32m"
RED = "\033[31m"
DIM = "\033[2m"
BOLD = "\033[1m"
RESET = "\033[0m"


@dataclass
class Assertion:
    """A single check over the /match response."""

    description: str
    check: Callable[[dict], tuple[bool, str]]


@dataclass
class EvalCase:
    name: str
    profile: dict
    assertions: list[Assertion] = field(default_factory=list)


# --- assertion helpers ---------------------------------------------------


def top_n_slugs(response: dict, n: int = 3) -> list[str]:
    return [m["slug"] for m in response["matches"][:n]]


def top_n_fit(response: dict, n: int = 3) -> list[dict]:
    return response["matches"][:n]


RISING_SENIOR_ONLY = {
    "research-science-institute",
    "stanford-simr",
    "summer-science-program",
    "hutton-fisheries",
}

# "Cost-accessible" = no student is barred by sticker price. Includes truly
# free / stipended programs AND programs that document a need-based aid path.
# Explicitly excludes programs that only offer merit scholarships, since those
# are conditional and not equity-first. When `cost_preference=free_or_aid_only`,
# the top matches should live inside this set.
COST_ACCESSIBLE = {
    "mit-mites-summer",
    "research-science-institute",
    "tass",
    "nd-leadership-seminars",
    "boa-student-leaders",
    "stanford-simr",
    "hutton-fisheries",
    "nasa-sees",
    "girls-who-code-summer",
    "summer-science-program",
    "promys",
    "ross-mathematics-program",
    "sumac",
    "iowa-young-writers-studio",
    "kenyon-young-writers",
    "yygs",
    "economics-for-leaders",
    "cosmos",
    "brown-pre-college",
    # Intentionally excluded: columbia-summer-immersion (scholarships only,
    # merit-based — not a guaranteed equity path).
}


def no_rising_senior_only_in_top(n: int) -> Callable[[dict], tuple[bool, str]]:
    def check(r: dict) -> tuple[bool, str]:
        bad = [s for s in top_n_slugs(r, n) if s in RISING_SENIOR_ONLY]
        if bad:
            return False, f"top {n} contained rising-senior-only programs: {bad}"
        return True, f"no rising-senior-only programs in top {n}"

    return check


def top_n_all_cost_accessible(n: int) -> Callable[[dict], tuple[bool, str]]:
    def check(r: dict) -> tuple[bool, str]:
        slugs = top_n_slugs(r, n)
        bad = [s for s in slugs if s not in COST_ACCESSIBLE]
        if bad:
            return False, (
                f"top {n} included programs without a documented cost-access path: {bad}"
            )
        return True, f"top {n} are all cost-accessible (free, stipended, or need-based aid)"

    return check


def top_match_contains_any(expected_slugs: set[str], n: int = 3) -> Callable[[dict], tuple[bool, str]]:
    def check(r: dict) -> tuple[bool, str]:
        slugs = set(top_n_slugs(r, n))
        hit = slugs & expected_slugs
        if not hit:
            return False, (
                f"top {n} {slugs} did not include any of expected {expected_slugs}"
            )
        return True, f"top {n} included expected program(s): {hit}"

    return check


def every_match_has_reasoning() -> Callable[[dict], tuple[bool, str]]:
    def check(r: dict) -> tuple[bool, str]:
        missing = [
            m["slug"]
            for m in r["matches"]
            if not m.get("why_it_fits") or len(m["why_it_fits"].strip()) < 30
        ]
        if missing:
            return False, f"matches with missing/short why_it_fits: {missing}"
        return True, "every match has a substantive 'why it fits'"

    return check


def fit_scores_descending() -> Callable[[dict], tuple[bool, str]]:
    def check(r: dict) -> tuple[bool, str]:
        scores = [m["fit_score"] for m in r["matches"]]
        if scores != sorted(scores, reverse=True):
            return False, f"fit scores not descending: {scores}"
        return True, f"fit scores descending ({scores})"

    return check


# --- cases ---------------------------------------------------------------


CASES: list[EvalCase] = [
    EvalCase(
        name="Rising freshman — free/aid only — CS interest",
        profile={
            "name": "Eval-RF-CS",
            "grade_level": "rising freshman",
            "interests": ["computer science", "coding"],
            "location_flexibility": "no preference",
            "cost_preference": "free_or_aid_only",
            "goal_tags": ["explore_major"],
        },
        assertions=[
            Assertion(
                "no rising-senior-only programs in top 3",
                no_rising_senior_only_in_top(3),
            ),
            Assertion("every match has reasoning", every_match_has_reasoning()),
            Assertion("fit scores descending", fit_scores_descending()),
        ],
    ),
    EvalCase(
        name="Rising senior — biology research — free/aid only",
        profile={
            "name": "Eval-RS-Bio",
            "grade_level": "rising senior",
            "interests": ["biology", "biomedical research"],
            "gpa": 3.9,
            "location_flexibility": "residential",
            "cost_preference": "free_or_aid_only",
            "goal_tags": ["research_experience", "strengthen_application"],
            "prior_experience": "AP Biology, two-summer lab internship",
        },
        assertions=[
            Assertion(
                "top 3 includes a top-tier research program",
                top_match_contains_any(
                    {"research-science-institute", "stanford-simr", "summer-science-program"},
                    n=3,
                ),
            ),
            Assertion(
                "top 3 are all cost-accessible (equity signal honored)",
                top_n_all_cost_accessible(3),
            ),
            Assertion("every match has reasoning", every_match_has_reasoning()),
        ],
    ),
    EvalCase(
        name="Rising junior — creative writing — tuition OK",
        profile={
            "name": "Eval-RJ-Writing",
            "grade_level": "rising junior",
            "interests": ["creative writing", "fiction"],
            "location_flexibility": "residential",
            "cost_preference": "open_to_tuition",
            "goal_tags": ["explore_major", "campus_experience"],
        },
        assertions=[
            Assertion(
                "top 3 includes a writing-focused program",
                top_match_contains_any(
                    {"iowa-young-writers-studio", "kenyon-young-writers"},
                    n=3,
                ),
            ),
            Assertion("every match has reasoning", every_match_has_reasoning()),
            Assertion("fit scores descending", fit_scores_descending()),
        ],
    ),
]


# --- runner --------------------------------------------------------------


def run() -> int:
    total_pass = 0
    total_fail = 0

    for case in CASES:
        print(f"{BOLD}▸ {case.name}{RESET}")
        try:
            r = httpx.post(f"{BASE_URL}/match", json=case.profile, timeout=60)
            r.raise_for_status()
            response = r.json()
        except Exception as e:
            print(f"  {RED}✗ request failed: {e}{RESET}\n")
            total_fail += len(case.assertions)
            continue

        top_slugs = top_n_slugs(response, 3)
        print(f"  {DIM}top 3: {top_slugs}{RESET}")

        for a in case.assertions:
            ok, detail = a.check(response)
            if ok:
                print(f"  {GREEN}✓{RESET} {a.description} {DIM}— {detail}{RESET}")
                total_pass += 1
            else:
                print(f"  {RED}✗ {a.description}{RESET}")
                print(f"    {RED}{detail}{RESET}")
                total_fail += 1
        print()

    print(f"{BOLD}{total_pass} passed, {total_fail} failed{RESET}")
    return 0 if total_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(run())
