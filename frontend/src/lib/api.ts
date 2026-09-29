import type {
  ChatTurn,
  MatchResponse,
  Program,
  SavedEntry,
  StoredStudent,
  StudentProfile,
} from "../types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

export const api = {
  health: () => request<{ ok: boolean; version: string }>("/health"),

  listPrograms: () => request<Program[]>("/programs"),
  getProgram: (slug: string) => request<Program>(`/programs/${slug}`),

  createStudent: (profile: StudentProfile) =>
    request<StoredStudent>("/programs/students", {
      method: "POST",
      body: JSON.stringify(profile),
    }),

  match: (profile: StudentProfile) =>
    request<MatchResponse>("/match", {
      method: "POST",
      body: JSON.stringify(profile),
    }),

  chat: (args: {
    student: StudentProfile;
    program_slug?: string | null;
    history: ChatTurn[];
    message: string;
  }) =>
    request<{ reply: string }>("/chat", {
      method: "POST",
      body: JSON.stringify(args),
    }),

  save: (student_id: string, program_slug: string, note?: string) =>
    request<unknown>("/programs/saved", {
      method: "POST",
      body: JSON.stringify({ student_id, program_slug, note: note ?? null }),
    }),

  unsave: (student_id: string, program_slug: string) =>
    request<unknown>(
      `/programs/saved?student_id=${student_id}&program_slug=${program_slug}`,
      { method: "DELETE" },
    ),

  listSaved: (student_id: string) =>
    request<SavedEntry[]>(`/programs/saved/${student_id}`),
};
