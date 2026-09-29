import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Database,
  Search,
  MessageSquare,
  Activity,
} from "lucide-react";
import { api } from "../lib/api";

export function Home() {
  const [status, setStatus] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    api
      .health()
      .then((r) => setStatus(r.ok ? "ok" : "down"))
      .catch(() => setStatus("down"));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 pt-20 pb-16">
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-2.5 py-1 mb-6">
        <Sparkles className="w-3 h-3" />
        New · Pre-college programs
      </div>

      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 leading-[1.1]">
        Your AI counselor for
        <br />
        <span className="text-brand-700">pre-college programs.</span>
      </h1>

      <p className="mt-5 text-lg text-gray-600 max-w-xl leading-relaxed">
        Tell your Vantion counselor what you care about — interests, goals,
        constraints — and get real pre-college programs ranked against your
        profile, with honest tradeoffs. Not a generic list.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Link
          to="/intake"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-3 rounded-lg"
        >
          Get my matches <ArrowRight className="w-4 h-4" />
        </Link>
        <StatusBadge status={status} />
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-4">
        <Feature
          title="Grounded in a real catalog"
          body="Matches come from a vetted list of pre-college programs — MITES, RSI, SSP, PROMYS, Iowa Young Writers' Studio, and more."
        />
        <Feature
          title="Explained, not ranked blindly"
          body="Every match includes a 'why it fits' tied to your stated interests, plus honest tradeoffs about selectivity and cost."
        />
        <Feature
          title="Keep the conversation going"
          body="Ask follow-ups — 'how competitive?', 'cheaper alternatives?' — and your counselor answers in your context."
        />
      </div>

      <section className="mt-20">
        <h2 className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-4">
          Under the hood
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="grid md:grid-cols-4 gap-5">
            <Stage
              icon={<Database className="w-4 h-4" />}
              label="Curated catalog"
              body="20 pre-college programs in Supabase Postgres, each with subjects, cost model, eligibility, and selectivity."
            />
            <Stage
              icon={<Search className="w-4 h-4" />}
              label="Vector shortlist"
              body="Your profile is embedded with Voyage AI, then matched against program embeddings in pgvector to shortlist the top 10."
            />
            <Stage
              icon={<MessageSquare className="w-4 h-4" />}
              label="Claude ranks & explains"
              body="Sonnet 4.6 scores the shortlist with a tool-use schema, weighting grade fit, cost equity, and your stated goals."
            />
            <Stage
              icon={<Activity className="w-4 h-4" />}
              label="Observed end-to-end"
              body="Every match and chat call is traced in Langfuse with token usage — so regressions and hallucinations are visible."
            />
          </div>
          <p className="text-xs text-gray-500 mt-5 leading-relaxed">
            Built in 48 hours with FastAPI + Supabase + React — the same stack
            Vantion runs in production.
          </p>
        </div>
      </section>
    </div>
  );
}

function Stage({
  icon,
  label,
  body,
}: {
  icon: React.ReactNode;
  label: string;
  body: string;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-1.5 text-brand-700 bg-brand-50 border border-brand-200 rounded-md px-2 py-1 text-xs font-medium">
        {icon}
        {label}
      </div>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{body}</p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "checking" | "ok" | "down" }) {
  const dot = {
    checking: "bg-gray-300 animate-pulse",
    ok: "bg-emerald-500",
    down: "bg-red-500",
  }[status];
  const label = {
    checking: "Connecting…",
    ok: "Backend connected",
    down: "Backend offline",
  }[status];
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
}
