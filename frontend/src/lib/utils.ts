import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

/** True when a program requires no out-of-pocket tuition — free, fully-covered,
 * or pays the student (stipend / paid internship). "Tuition with aid available"
 * does NOT qualify: aid is conditional, and Vantion's equity filter is meant to
 * surface programs that are unambiguously accessible. */
export function isFreeOrStipended(costModel: string): boolean {
  const c = costModel.toLowerCase();
  if (c.startsWith("free")) return true;
  if (c.includes("stipend")) return true;
  if (c.includes("paid internship")) return true;
  return false;
}
