import type { SavedExam, ExamProgress } from './study';

export function unfinishedSessions(library: SavedExam[]) {
  return library.flatMap(exam => [
    { exam, progress: exam.progress, focused: false },
    { exam, progress: exam.focusedProgress, focused: true },
  ]).filter((entry): entry is { exam: SavedExam; progress: ExamProgress; focused: boolean } =>
    !!entry.progress && !entry.progress.isReviewing && (!entry.focused || !!entry.progress.focus))
    .sort((a, b) => (Date.parse(b.progress.updatedAt) || 0) - (Date.parse(a.progress.updatedAt) || 0))
    .slice(0, 3)
    .map(entry => {
      const ids = entry.focused ? entry.progress.focusedQuestionIds : entry.progress.poolQuestionIds;
      const total = ids?.length ?? entry.exam.questionCount;
      const answered = ids ? ids.filter(id => entry.progress.answers[id] !== undefined).length : Math.min(total, Object.keys(entry.progress.answers).length);
      return { ...entry, total, answered };
    });
}
