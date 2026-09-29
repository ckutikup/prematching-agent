import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { api } from "../lib/api";
import { storage } from "../lib/storage";
import type {
  CostPreference,
  Format,
  GoalTag,
  GradeLevel,
  StudentProfile,
} from "../types";

const SUGGESTED_INTERESTS = [
  "Mathematics",
  "Computer Science",
  "Biology",
  "Engineering",
  "Creative Writing",
  "Economics",
  "Environmental Science",
  "Leadership",
  "Research",
  "Humanities",
];

const GRADES: GradeLevel[] = [
  "rising freshman",
  "rising sophomore",
  "rising junior",
  "rising senior",
];

const FORMATS: { value: Format; label: string }[] = [
  { value: "no preference", label: "No preference" },
  { value: "residential", label: "Residential" },
  { value: "virtual", label: "Virtual" },
  { value: "commuter", label: "Commuter" },
  { value: "hybrid", label: "Hybrid" },
];

const COST_OPTIONS: { value: CostPreference; label: string; hint: string }[] = [
  {
    value: "free_or_aid_only",
    label: "Free or with aid only",
    hint: "Full funding / stipend / need-based aid required",
  },
  {
    value: "prefer_low_cost",
    label: "Prefer low-cost",
    hint: "OK to pay some, but flag expensive ones",
  },
  {
    value: "open_to_tuition",
    label: "Open to tuition",
    hint: "Cost is not a major constraint",
  },
  {
    value: "no_preference",
    label: "No preference",
    hint: "Show me everything",
  },
];

const GOAL_OPTIONS: { value: GoalTag; label: string }[] = [
  { value: "research_experience", label: "Get real research experience" },
  { value: "explore_major", label: "Explore a potential major" },
  { value: "strengthen_application", label: "Strengthen my college app" },
  { value: "earn_credit", label: "Earn college credit" },
  { value: "campus_experience", label: "Experience campus life" },
];

const LOADING_STEPS = [
  "Reading your profile…",
  "Retrieving candidate programs from the catalog…",
  "Scoring fit against your interests and goals…",
  "Writing your counselor's notes…",
];

export function Intake() {
  const navigate = useNavigate();
  const [stored] = useState(() => storage.getStudent());
  const [name, setName] = useState(stored?.name ?? "");
  const [grade, setGrade] = useState<GradeLevel>(stored?.grade_level ?? "rising junior");
  const [interests, setInterests] = useState<string[]>(stored?.interests ?? []);
  const [interestInput, setInterestInput] = useState("");
  const [gpa, setGpa] = useState(stored?.gpa != null ? String(stored.gpa) : "");
  const [format, setFormat] = useState<Format>(stored?.location_flexibility ?? "no preference");
  const [costPref, setCostPref] = useState<CostPreference>(stored?.cost_preference ?? "no_preference");
  const [goalTags, setGoalTags] = useState<GoalTag[]>(stored?.goal_tags ?? []);
  const [budget, setBudget] = useState(stored?.budget_note ?? "");
  const [goals, setGoals] = useState(stored?.goals ?? "");
  const [priorExperience, setPriorExperience] = useState(stored?.prior_experience ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submitting) return;
    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, [submitting]);

  function addInterest(raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (interests.includes(value)) return;
    if (interests.length >= 8) return;
    setInterests([...interests, value]);
    setInterestInput("");
  }

  function removeInterest(value: string) {
    setInterests(interests.filter((i) => i !== value));
  }

  function toggleGoal(tag: GoalTag) {
    setGoalTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function validate(): string | null {
    if (!name.trim()) return "Please add your first name.";
    if (interests.length === 0) return "Please add at least one interest.";
    if (gpa) {
      const n = Number(gpa);
      if (Number.isNaN(n)) return "GPA should be a number between 0 and 4.";
      if (n < 0 || n > 4) return "GPA should be between 0 and 4.";
    }
    return null;
  }

  async function onSubmit() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    setLoadingStep(0);
    setError(null);

    const profile: StudentProfile = {
      name: name.trim(),
      grade_level: grade,
      interests,
      gpa: gpa ? Number(gpa) : null,
      location_flexibility: format,
      cost_preference: costPref,
      goal_tags: goalTags,
      budget_note: budget.trim() || null,
      goals: goals.trim() || null,
      prior_experience: priorExperience.trim() || null,
    };

    try {
      const student = await api.createStudent(profile);
      storage.setStudent(student);
      const matches = await api.match(profile);
      storage.setMatches(matches);
      navigate("/matches");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (submitting) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-700 animate-pulse" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Your counselor is reading…
            </h2>
          </div>
          <ul className="mt-6 space-y-2.5">
            {LOADING_STEPS.map((step, i) => (
              <li
                key={step}
                className={`flex items-center gap-2.5 text-sm transition-opacity ${
                  i <= loadingStep ? "text-gray-900" : "text-gray-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < loadingStep
                      ? "bg-brand-600"
                      : i === loadingStep
                        ? "bg-brand-600 animate-pulse"
                        : "bg-gray-300"
                  }`}
                />
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        Tell your counselor about you
      </h1>
      <p className="mt-2 text-gray-600">
        The more honest you are, the better your matches. Nothing here is shared.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mt-8 space-y-7"
      >
        <SectionHeader
          step={1}
          title="About you"
          hint="Basics so we can check eligibility."
        />

        <div className="grid grid-cols-2 gap-4">
          <Field label="First name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya"
              className="input"
            />
          </Field>
          <Field label="Grade next year">
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as GradeLevel)}
              className="input"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="GPA (optional)"
          hint="We use this to calibrate how realistic each program's selectivity is for you."
        >
          <input
            type="number"
            min="0"
            max="4"
            step="0.01"
            value={gpa}
            onChange={(e) => setGpa(e.target.value)}
            placeholder="3.8"
            className="input max-w-[140px]"
          />
        </Field>

        <SectionHeader
          step={2}
          title="What you're into"
          hint="Be specific — 'computational biology' beats 'science'."
        />

        <Field label="Interests" hint="Add 1-8.">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {interests.map((i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-brand-50 text-brand-800 border border-brand-200 rounded-full px-2.5 py-0.5 text-sm"
              >
                {i}
                <button
                  type="button"
                  onClick={() => removeInterest(i)}
                  className="text-brand-600 hover:text-brand-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addInterest(interestInput);
              }
            }}
            placeholder="Type and press Enter…"
            className="input"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED_INTERESTS.filter((s) => !interests.includes(s)).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addInterest(s)}
                  className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-2.5 py-1"
                >
                  + {s}
                </button>
              ),
            )}
          </div>
        </Field>

        <SectionHeader
          step={3}
          title="What you want from this summer"
          hint="Pick any that matter to you — we weight recommendations on these."
        />

        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => {
            const active = goalTags.includes(g.value);
            return (
              <button
                type="button"
                key={g.value}
                onClick={() => toggleGoal(g.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm border transition ${
                  active
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        <SectionHeader
          step={4}
          title="Practical fit"
          hint="Format and cost drive hard filters — answer honestly."
        />

        <Field label="Format preference">
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => {
              const active = format === f.value;
              return (
                <button
                  type="button"
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`rounded-full px-3.5 py-1.5 text-sm border transition ${
                    active
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label="Cost preference"
          hint="Vantion surfaces free and aid-available programs first when you ask."
        >
          <div className="grid sm:grid-cols-2 gap-2">
            {COST_OPTIONS.map((c) => {
              const active = costPref === c.value;
              return (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setCostPref(c.value)}
                  className={`text-left rounded-lg px-3.5 py-2.5 border transition ${
                    active
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      active ? "text-brand-800" : "text-gray-900"
                    }`}
                  >
                    {c.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.hint}</div>
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label="Budget note (optional)"
          hint="Anything numeric or specific — 'need full funding', 'up to $3k', 'travel-free'."
        >
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. need fully-funded programs"
            className="input"
          />
        </Field>

        <SectionHeader
          step={5}
          title="Context that sharpens the match"
          hint="Optional, but more context = better recommendations."
        />

        <Field
          label="Prior experience (optional)"
          hint="Coursework, awards, extracurriculars, lab experience — anything concrete."
        >
          <textarea
            value={priorExperience}
            onChange={(e) => setPriorExperience(e.target.value)}
            rows={2}
            placeholder="AP Bio, science fair regional finalist, 2 yrs of Python…"
            className="input"
          />
        </Field>

        <Field
          label="Anything else your counselor should know? (optional)"
          hint="What you're hoping for, what you're nervous about, constraints — in your own words."
        >
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={3}
            placeholder="I want to try real research before committing to a major…"
            className="input"
          />
        </Field>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-lg"
          >
            Get my matches
          </button>
          <p className="text-xs text-gray-500">
            Takes ~10 seconds. Your counselor reads every field.
          </p>
        </div>
      </form>

      <style>{`
        .input {
          display: block;
          width: 100%;
          border: 1px solid rgb(229 231 235);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: white;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          outline: none;
          border-color: var(--color-brand-400);
          box-shadow: 0 0 0 3px var(--color-brand-100);
        }
      `}</style>
    </div>
  );
}

function SectionHeader({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="border-t border-gray-100 pt-6">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-brand-100 text-brand-800 text-xs font-semibold">
          {step}
        </span>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1 ml-8.5 pl-0.5">{hint}</p>}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-1.5">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      {children}
    </div>
  );
}
