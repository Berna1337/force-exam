export type RunMode = "practice" | "exam";
export const runMode = (value?: string): RunMode => value === "exam" ? "exam" : "practice";
export const modeLabel = (value?: string) => runMode(value) === "exam" ? "Exam Mode" : "Practice Mode";

export function restoreReviewFlags(ids: string[], saved: unknown): string[] {
  if (!Array.isArray(saved)) return [];
  const flags = new Set(saved.filter((id): id is string => typeof id === "string"));
  return ids.filter(id => flags.has(id));
}

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

export type FocusKind = "missed" | "marked";
export const sessionLabel = (mode?: string, focus?: FocusKind, pool?: boolean) => focus ? `Focused practice · ${focus === "missed" ? "Missed" : "Marked"}` : modeLabel(mode) + (pool ? " · Question pool" : "");
export function focusedQuestions(questions: { id: string; answerIndex: number }[], progress: { isReviewing: boolean; answers: Record<string, number>; flaggedQuestions?: string[]; focusedQuestionIds?: string[]; poolQuestionIds?: string[] } | undefined, kind: FocusKind): string[] {
  if (!progress) return [];
  if (kind === "marked") return restoreReviewFlags(questions.map(question => question.id), progress.flaggedQuestions);
  if (!progress.isReviewing) return [];
  const asked = progress.focusedQuestionIds ?? progress.poolQuestionIds;
  return questions.filter(question => (!asked || asked.includes(question.id)) && progress.answers[question.id] !== question.answerIndex).map(question => question.id);
}
