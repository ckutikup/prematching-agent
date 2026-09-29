import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bookmark, BookmarkCheck, ExternalLink, TrendingUp } from "lucide-react";
import { api } from "../lib/api";
import { storage } from "../lib/storage";
import { ChatPanel } from "../components/ChatPanel";
import type { Program, StoredStudent } from "../types";

const IMPACT_PROMPT =
  "Return exactly 2-3 short bullets (one sentence each, starting with '• '). " +
  "Focus on how this specific program would strengthen my college application " +
  "narrative given my stated interests, goals, and prior experience. " +
  "Be concrete — name the skill, signal, or story it adds. " +
  "No preamble, no closing summary — bullets only.";

export function ProgramDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [student, setStudent] = useState<StoredStudent | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impact, setImpact] = useState<string | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const s = storage.getStudent();
    setStudent(s);

    api
      .getProgram(slug)
      .then(setProgram)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));

    if (s) {
      api.listSaved(s.id).then((list) => {
        setSaved(list.some((e) => e.program_slug === slug));
      });

      setImpactLoading(true);
      api
        .chat({
          student: s,
          program_slug: slug,
          history: [],
          message: IMPACT_PROMPT,
        })
        .then((r) => setImpact(r.reply))
        .catch(() => setImpact(null))
        .finally(() => setImpactLoading(false));
    }
  }, [slug]);

  async function toggleSave() {
    if (!student || !program || saving) return;
    setSaving(true);
    try {
      if (saved) {
        await api.unsave(student.id, program.slug);
        setSaved(false);
      } else {
        await api.save(student.id, program.slug);
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 text-gray-500">Loading…</div>
    );
  }

  if (error || !program) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 text-red-700">
        {error ?? "Program not found"}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link
        to="/matches"
        className="text-sm text-brand-700 hover:text-brand-800"
      >
        ← Back to matches
      </Link>

      <div className="grid md:grid-cols-[1fr_400px] gap-8 mt-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {program.name}
              </h1>
              <p className="text-gray-600 mt-1">{program.host}</p>
            </div>
            {student && (
              <button
                onClick={toggleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-sm font-medium border border-gray-200 hover:border-brand-300 px-3 py-2 rounded-lg bg-white"
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-brand-600" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Stat label="Format" value={program.format} />
            <Stat label="Duration" value={`${program.duration_weeks} weeks`} />
            <Stat label="Cost" value={program.cost_model} />
            <Stat label="Selectivity" value={program.selectivity} />
          </div>

          {(impact || impactLoading) && (
            <section className="mt-8 bg-brand-50 border border-brand-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-brand-700" />
                <h2 className="text-sm font-semibold text-brand-900">
                  How this strengthens your application
                </h2>
              </div>
              {impactLoading ? (
                <p className="text-sm text-gray-500 italic">
                  Your counselor is thinking…
                </p>
              ) : (
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                  {impact}
                </div>
              )}
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-gray-700 leading-relaxed">{program.description}</p>
          </section>

          <section className="mt-6">
            <h2 className="font-semibold text-gray-900 mb-2">Subjects</h2>
            <div className="flex flex-wrap gap-1.5">
              {program.subjects.map((s) => (
                <span
                  key={s}
                  className="text-sm bg-gray-100 text-gray-800 rounded-md px-2.5 py-1"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>

          {program.eligibility_note && (
            <section className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-2">Eligibility</h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                {program.eligibility_note}
              </p>
            </section>
          )}

          {program.application_window && (
            <section className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-2">
                Application window
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                {program.application_window}
              </p>
              {program.url && (
                <a
                  href={program.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-700 hover:text-brand-800 mt-2"
                >
                  Check current deadlines <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </section>
          )}
        </div>

        <div className="md:sticky md:top-6 self-start">
          {student ? (
            <ChatPanel student={student} programSlug={program.slug} />
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-600">
              <Link to="/intake" className="text-brand-700 font-medium">
                Tell us about you
              </Link>{" "}
              to chat with your counselor about this program.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900 mt-0.5 capitalize">
        {value}
      </div>
    </div>
  );
}
