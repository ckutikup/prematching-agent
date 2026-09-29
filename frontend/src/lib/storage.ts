import type { MatchResponse, StoredStudent } from "../types";

const STUDENT_KEY = "vantion.student";
const MATCHES_KEY = "vantion.matches";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const storage = {
  getStudent(): StoredStudent | null {
    return safeParse<StoredStudent>(localStorage.getItem(STUDENT_KEY));
  },
  setStudent(s: StoredStudent) {
    localStorage.setItem(STUDENT_KEY, JSON.stringify(s));
  },
  clearStudent() {
    localStorage.removeItem(STUDENT_KEY);
    sessionStorage.removeItem(MATCHES_KEY);
  },
  getMatches(): MatchResponse | null {
    return safeParse<MatchResponse>(sessionStorage.getItem(MATCHES_KEY));
  },
  setMatches(m: MatchResponse) {
    sessionStorage.setItem(MATCHES_KEY, JSON.stringify(m));
  },
};