export type RunMode = "practice" | "exam";
export const runMode = (value?: string): RunMode => value === "exam" ? "exam" : "practice";
export const modeLabel = (value?: string) => runMode(value) === "exam" ? "Exam Mode" : "Practice Mode";

export function createQuestionOrder(ids: string[], mode: RunMode, random = Math.random): string[] {
  const order = [...ids];
  if (mode === "exam") {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  return order;
}

export function restoreQuestionOrder(ids: string[], mode: RunMode, saved?: string[]) {
  if (mode === "practice") return [...ids];
  if (saved && saved.length === ids.length && new Set(saved).size === ids.length && saved.every((id) => ids.includes(id))) return [...saved];
  return createQuestionOrder(ids, mode);
}
