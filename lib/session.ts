export type RunSettings = { passingScore?: number; durationMinutes?: number; questionCount?: number; topic?: string; feedback?: boolean };
export function cleanSettings(value: unknown): RunSettings {
  const raw = (value && typeof value === 'object' ? value : {}) as RunSettings;
  return { ...(Number.isInteger(raw.passingScore) && raw.passingScore! >= 1 && raw.passingScore! <= 100 ? { passingScore: raw.passingScore } : {}), ...(Number.isInteger(raw.durationMinutes) && raw.durationMinutes! > 0 && raw.durationMinutes! <= 240 ? { durationMinutes: raw.durationMinutes } : {}),
    ...(Number.isInteger(raw.questionCount) && raw.questionCount! > 0 ? { questionCount: raw.questionCount } : {}),
    ...(typeof raw.topic === 'string' && raw.topic.trim() ? { topic: raw.topic.trim().slice(0, 60) } : {}), ...(raw.feedback === true ? { feedback: true } : {}) };
}
export function cleanTags(value: unknown): string[] {
  return Array.isArray(value) ? Array.from(new Set(value.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim().slice(0, 60)).filter(Boolean))).slice(0, 20) : [];
}
export function selectPool(questions: { id: string; tags?: string[] }[], settings: RunSettings, random = Math.random): string[] {
  const candidates = questions.filter(question => !settings.topic || question.tags?.includes(settings.topic));
  const count = Math.min(settings.questionCount ?? candidates.length, candidates.length);
  const shuffled = candidates.map(question => question.id);
  if (count < shuffled.length) for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  const selected = new Set(shuffled.slice(0, count));
  return candidates.filter(question => selected.has(question.id)).map(question => question.id);
}
export const secondsRemaining = (deadline: number | undefined, now = Date.now()) => deadline === undefined ? undefined : Math.max(0, Math.ceil((deadline - now) / 1000));
export function topicScores(questions: { id: string; tags?: string[]; answerIndex: number }[], answers: Record<string, number>) {
  const result: Record<string, { correct: number; total: number }> = Object.create(null);
  for (const question of questions) for (const tag of question.tags ?? []) { const score = result[tag] ?? { correct: 0, total: 0 }; score.total++; if (answers[question.id] === question.answerIndex) score.correct++; result[tag] = score; }
  return result;
}

export function meetsPassingScore(score: number, total: number, passingScore?: number): boolean {
  return passingScore !== undefined && Number.isInteger(passingScore) && passingScore >= 1 && passingScore <= 100 && total > 0 && score * 100 >= passingScore * total;
}
