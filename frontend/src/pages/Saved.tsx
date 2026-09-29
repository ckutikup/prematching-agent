import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2, StickyNote } from "lucide-react";
import { api } from "../lib/api";
import { storage } from "../lib/storage";
import type { SavedEntry } from "../types";

export function Saved() {
  const [studentId] = useState(() => storage.getStudent()?.id ?? null);
  const [entries, setEntries] = useState<SavedEntry[] | null>(() => studentId ? null : []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    api
      .listSaved(studentId)
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [studentId]);

  async function handleUnsave(slug: string) {
    if (!studentId || !entries) return;
    const prev = entries;
    setEntries(entries.filter((e) => e.program_slug !== slug));
    try {
      await api.unsave(studentId, slug);
    } catch (e) {
      setEntries(prev);
      setError(e instanceof Error ? e.message : "Failed to remove");
    }
  }

  async function handleSaveNote(slug: string, note: string) {
    if (!studentId || !entries) return;
    await api.save(studentId, slug, note);
    setEntries(
      entries.map((e) =>
        e.program_slug === slug ? { ...e, note: note || null } : e,
      ),
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-red-700">{error}</div>
    );
  }

  if (entries === null) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-gray-500">Loading…</div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Nothing saved yet
        </h1>
        <p className="mt-2 text-gray-600">
          Find a program you like and hit Save — it'll show up here with your notes.
        </p>
        <Link
          to="/intake"
          className="inline-block mt-6 bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-lg"
        >
          Find matches
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1">
        Your shortlist
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {entries.length} {entries.length === 1 ? "program" : "programs"} saved.
        Add a note to remember why each one caught your eye.
      </p>
      <div className="space-y-4">
        {entries.map((entry) => (
          <SavedRow
            key={entry.program_slug}
            entry={entry}
            onUnsave={() => handleUnsave(entry.program_slug)}
            onSaveNote={(note) => handleSaveNote(entry.program_slug, note)}
          />
        ))}
      </div>
    </div>
  );
}

function SavedRow({
  entry,
  onUnsave,
  onSaveNote,
}: {
  entry: SavedEntry;
  onUnsave: () => void;
  onSaveNote: (note: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.note ?? "");
  const [saving, setSaving] = useState(false);
  const program = entry.programs;

  async function submit() {
    setSaving(true);
    try {
      await onSaveNote(draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to={`/program/${program.slug}`}
            className="text-lg font-semibold text-gray-900 hover:text-brand-700"
          >
            {program.name}
          </Link>
          <p className="text-sm text-gray-500 mt-0.5">{program.host}</p>
        </div>
        <button
          type="button"
          onClick={onUnsave}
          aria-label="Remove from shortlist"
          title="Remove from shortlist"
          className="shrink-0 text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        <Chip>{program.format}</Chip>
        <Chip>{program.duration_weeks} wk</Chip>
        <Chip>{program.cost_model}</Chip>
      </div>

      <div className="mt-4">
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. deadline Feb 15, ask Mr. Patel for rec letter"
              className="w-full rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 px-3 py-2 text-sm outline-none"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="text-sm font-medium bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white rounded-md px-3 py-1.5"
              >
                {saving ? "Saving…" : "Save note"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(entry.note ?? "");
                  setEditing(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : entry.note ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full text-left bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 hover:border-amber-300"
          >
            <div className="flex items-start gap-2">
              <StickyNote className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {entry.note}
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1.5"
          >
            <StickyNote className="w-3.5 h-3.5" />
            Add a note
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <Link
          to={`/program/${program.slug}`}
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          View details →
        </Link>
        {program.url && (
          <a
            href={program.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
          >
            Official site <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </article>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 text-gray-700 px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}
