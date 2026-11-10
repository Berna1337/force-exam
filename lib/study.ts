export const LIBRARY_KEY = "force-exam-library-v1";

export type ExamProgress = {
  mode?: RunMode;
  pool?: boolean;
  feedback?: boolean;
  focus?: FocusKind;
  questionOrder?: string[];
  settings?: RunSettings;
  poolQuestionIds?: string[];
  deadlineAt?: number;
  revealedQuestions?: string[];
  flaggedQuestions?: string[];
  focusedQuestionIds?: string[];
  attemptId: string;
  currentIndex: number;
  answers: Record<string, number>;
  isReviewing: boolean;
  updatedAt: string;
};

export type ExamAttempt = {
  passingScore?: number;
  mode?: RunMode;
  pool?: boolean;
  feedback?: boolean;
  focus?: FocusKind;
  id: string;
  topics?: Record<string, { correct: number; total: number }>;
  timedOut?: boolean;
  durationMinutes?: number;
  completedAt: string;
  score: number;
  total: number;
  revision?: number;
};

export type SavedExam = {
  passingScore?: number;
  folderId?: string;
  archivedAt?: string;
  id: string;
  title: string;
  json: string;
  questionCount: number;
  progress?: ExamProgress;
  focusedProgress?: ExamProgress;
  focusedProgressByRevision?: Record<string, ExamProgress>;
  attempts: ExamAttempt[];
  revision: number;
  gitCommit?: string;
  progressByRevision?: Record<string, ExamProgress>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function readProgress(value: unknown): ExamProgress | undefined {
  if (!isRecord(value) || typeof value.attemptId !== "string" || !Number.isInteger(value.currentIndex) ||
      typeof value.isReviewing !== "boolean" || typeof value.updatedAt !== "string" || !isRecord(value.answers)) return;
  const answers = Object.fromEntries(Object.entries(value.answers).filter(([key, answer]) =>
    /^question-\d+$/.test(key) && typeof answer === "number" && Number.isInteger(answer) && answer >= 0));
  return { attemptId: value.attemptId, currentIndex: value.currentIndex as number,
    answers: answers as Record<string, number>, isReviewing: value.isReviewing, updatedAt: value.updatedAt,
    ...(value.pool === true ? { pool: true } : {}), ...(value.feedback === true ? { feedback: true } : {}),
    ...(isRecord(value.settings) ? { settings: value.settings as RunSettings } : {}),
    ...(typeof value.deadlineAt === "number" && Number.isFinite(value.deadlineAt) ? { deadlineAt: value.deadlineAt } : {}),
    ...(Array.isArray(value.poolQuestionIds) ? { poolQuestionIds: value.poolQuestionIds.filter((id): id is string => typeof id === "string" && /^question-\d+$/.test(id)) } : {}),
    ...(Array.isArray(value.revealedQuestions) ? { revealedQuestions: value.revealedQuestions.filter((id): id is string => typeof id === "string" && /^question-\d+$/.test(id)) } : {}),
    ...(value.focus === "missed" || value.focus === "marked" ? { focus: value.focus } : {}),
    ...(Array.isArray(value.focusedQuestionIds) ? { focusedQuestionIds: Array.from(new Set(value.focusedQuestionIds.filter((id): id is string => typeof id === "string" && /^question-\d+$/.test(id)))) } : {}),
    ...(value.mode === "exam" || value.mode === "practice" ? { mode: value.mode } : {}),
    ...(Array.isArray(value.questionOrder) && value.questionOrder.every((id) => typeof id === "string") ? { questionOrder: value.questionOrder } : {}),
    ...(Array.isArray(value.flaggedQuestions) ? { flaggedQuestions: Array.from(new Set(value.flaggedQuestions.filter((id): id is string => typeof id === "string" && /^question-\d+$/.test(id)))) } : {}),
  };
}

function isAttempt(value: unknown): value is ExamAttempt {
  return isRecord(value) && typeof value.id === "string" && typeof value.completedAt === "string" &&
    Number.isFinite(Date.parse(value.completedAt)) && Number.isInteger(value.score) &&
    Number.isInteger(value.total) && (value.total as number) > 0 &&
    (value.score as number) >= 0 && (value.score as number) <= (value.total as number);
}

// Existing libraries without progress/history keep their exams when upgraded.
export function readLibrary(json: string | null): SavedExam[] {
  const stored: unknown = JSON.parse(json ?? "[]");
  if (!Array.isArray(stored)) throw new Error("Invalid exam library");
  return stored.filter((item) => isRecord(item) && typeof item.id === "string" &&
    typeof item.title === "string" && typeof item.json === "string" &&
    typeof item.questionCount === "number" && Number.isInteger(item.questionCount) && item.questionCount > 0).map((item) => ({
      id: item.id, title: item.title, json: item.json, questionCount: item.questionCount,
      ...(typeof item.passingScore === "number" && Number.isInteger(item.passingScore) && item.passingScore >= 1 && item.passingScore <= 100 ? { passingScore: item.passingScore } : {}),
      folderId: typeof item.folderId === "string" ? item.folderId : undefined,
      archivedAt: typeof item.archivedAt === "string" && Number.isFinite(Date.parse(item.archivedAt)) ? item.archivedAt : undefined,
      progress: readProgress(item.progress),
      focusedProgress: readProgress(item.focusedProgress),
      focusedProgressByRevision: isRecord(item.focusedProgressByRevision) ? Object.fromEntries(Object.entries(item.focusedProgressByRevision).filter(([key]) => /^[1-9]\d*$/.test(key)).map(([key, value]) => [key, readProgress(value)]).filter(([, value]) => value)) : {},
      attempts: Array.isArray(item.attempts) ? item.attempts.filter(isAttempt) : [],
      revision: Number.isInteger(item.revision) && item.revision > 0 ? item.revision : 1,
      gitCommit: typeof item.gitCommit === "string" && /^[a-f0-9]{40}$/.test(item.gitCommit) ? item.gitCommit : undefined,
      progressByRevision: isRecord(item.progressByRevision) ? Object.fromEntries(Object.entries(item.progressByRevision)
        .filter(([key]) => /^[1-9]\d*$/.test(key)).map(([key, value]) => [key, readProgress(value)]).filter(([, value]) => value)) : {},
    }));
}

export function progressLabel(exam: SavedExam) {
  if (exam.progress?.isReviewing) return "View last result";
  if (exam.progress) return `Resume · ${Object.keys(exam.progress.answers).length}/${exam.progress.poolQuestionIds?.length ?? exam.questionCount} answered`;
  return "Start practice";
}

export function percentage(attempt: ExamAttempt) {
  return Math.round(attempt.score / attempt.total * 100);
}

export function currentAttempts(exam: SavedExam) {
  return exam.attempts.filter((attempt) => !attempt.focus && !attempt.pool && (attempt.revision ?? 1) === exam.revision);
}

export function reviseExam(exam: SavedExam, json: string, title: string, questionCount: number, questionsChanged: boolean): SavedExam {
  return { ...exam, json, title, questionCount,
    revision: exam.revision + (questionsChanged ? 1 : 0),
    progressByRevision: rememberProgress(exam),
    focusedProgressByRevision: rememberFocusedProgress(exam),
    focusedProgress: questionsChanged ? undefined : exam.focusedProgress,
    progress: questionsChanged ? undefined : exam.progress };
}

export function rememberProgress(exam: SavedExam): Record<string, ExamProgress> {
  return { ...exam.progressByRevision, ...(exam.progress ? { [exam.revision]: exam.progress } : {}) };
}

export function rememberFocusedProgress(exam: SavedExam): Record<string, ExamProgress> {
  return { ...exam.focusedProgressByRevision, ...(exam.focusedProgress ? { [exam.revision]: exam.focusedProgress } : {}) };
}
export function switchExamVersion(exam: SavedExam, snapshot: { oid: string; revision: number; json: string }, title: string, questionCount: number): SavedExam {
  const progressByRevision = rememberProgress(exam);
  return { ...exam, json: snapshot.json, title, questionCount, revision: snapshot.revision, gitCommit: snapshot.oid,
    progressByRevision, progress: progressByRevision[snapshot.revision],
    focusedProgressByRevision: rememberFocusedProgress(exam), focusedProgress: rememberFocusedProgress(exam)[snapshot.revision] };
}
import type { FocusKind, RunMode } from "./run";

import type { RunSettings } from "./session";
