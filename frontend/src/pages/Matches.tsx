import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { storage } from "../lib/storage";
import { isFreeOrStipended } from "../lib/utils";
import { ProgramCard } from "../components/ProgramCard";
import type { MatchResponse, Program } from "../types";

export function Matches() {
  const navigate = useNavigate();
  const [matches] = useState<MatchResponse | null>(() => storage.getMatches());
  const [student] = useState(() => storage.getStudent());
  const [programs, setPrograms] = useState<Record<string, Program>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(() => student?.cost_preference === "free_or_aid_only");

  useEffect(() => {
    if (!matches || !student) {
      navigate("/intake");
      return;
    }
    api
      .listPrograms()
      .then((list) => {
        const byId: Record<string, Program> = {};
        list.forEach((p) => (byId[p.slug] = p));
        setPrograms(byId);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [navigate, matches, student]);

  const visible = useMemo(() => {
    if (!matches) return [];
    if (!freeOnly) return matches.matches;
    return matches.matches.filter((m) => {
      const prog = programs[m.slug];
      return prog && isFreeOrStipended(prog.cost_model);
    });
  }, [matches, programs, freeOnly]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-gray-500">Loading…</div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-red-700">{error}</div>
    );
  }

  if (!matches) return null;

  const hiddenCount = matches.matches.length - visible.length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <Link
          to="/intake"
          className="text-sm text-brand-700 hover:text-brand-800"
        >
          ← Edit profile
        </Link>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-brand-800 mb-1">
          Your counselor's read
        </h2>
        <p className="text-gray-900 leading-relaxed">{matches.summary}</p>
      </div>

      {matches.matches.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {visible.length}{" "}
            {visible.length === 1 ? "program" : "programs"} worth looking at
          </h1>
          <button
            type="button"
            onClick={() => setFreeOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border text-sm px-3 py-1.5 transition ${
              freeOnly
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
            }`}
            aria-pressed={freeOnly}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Free & stipended only
          </button>
        </div>
      )}

      {freeOnly && hiddenCount > 0 && (
        <p className="text-xs text-gray-500 mb-4">
          {hiddenCount} tuition-based{" "}
          {hiddenCount === 1 ? "program is" : "programs are"} hidden. Some offer
          need-based aid — turn the filter off to see them.
        </p>
      )}

      {matches.matches.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-900 font-medium">No strong matches yet.</p>
          <p className="text-sm text-gray-600 mt-1">
            Try broadening your interests or loosening your format preference,
            and run the match again.
          </p>
          <Link
            to="/intake"
            className="inline-block mt-4 text-brand-700 font-medium hover:text-brand-800"
          >
            Edit profile →
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-900 font-medium">
            No free or stipended matches in your current results.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Several of your matches offer need-based aid — turn off the filter
            to review them.
          </p>
          <button
            type="button"
            onClick={() => setFreeOnly(false)}
            className="inline-block mt-4 text-brand-700 font-medium hover:text-brand-800"
          >
            Show all matches →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((m) => {
            const program = programs[m.slug];
            if (!program) return null;
            return <ProgramCard key={m.slug} program={program} match={m} />;
          })}
        </div>
      )}
    </div>
  );
}
