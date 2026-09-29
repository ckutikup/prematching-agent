import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { Program, ProgramMatch } from "../types";
import { FitScore } from "./FitScore";

interface Props {
  program: Program;
  match?: ProgramMatch;
}

export function ProgramCard({ program, match }: Props) {
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
        {match && <FitScore score={match.fit_score} />}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        <Chip>{program.format}</Chip>
        <Chip>{program.duration_weeks} wk</Chip>
        <Chip>{program.cost_model}</Chip>
        <Chip tone={program.selectivity.includes("selective") ? "warn" : "neutral"}>
          {program.selectivity}
        </Chip>
      </div>

      {match && (
        <>
          <p className="text-sm text-gray-700 mt-4 leading-relaxed">
            {match.why_it_fits}
          </p>
          {match.considerations && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              <span className="font-medium text-gray-700">Consider: </span>
              {match.considerations}
            </p>
          )}
        </>
      )}

      {!match && (
        <p className="text-sm text-gray-700 mt-4 leading-relaxed">
          {program.description}
        </p>
      )}

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

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warn";
}) {
  const styles =
    tone === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${styles}`}
    >
      {children}
    </span>
  );
}
