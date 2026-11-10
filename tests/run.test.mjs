import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createQuestionOrder, restoreQuestionOrder, modeLabel, runMode } from '../lib/run.ts';
import { readLibrary } from '../lib/study.ts';
const { prepareExamExport } = createRequire(import.meta.url)('../desktop/export.cjs');

test('practice order is unchanged and exam shuffle is a permutation without modifying the source', () => {
  const ids = ['question-0', 'question-1', 'question-2', 'question-3'];
  assert.deepEqual(createQuestionOrder(ids, 'practice', () => 0), ids);
  assert.deepEqual(createQuestionOrder(ids, 'exam', () => 0), ['question-1', 'question-2', 'question-3', 'question-0']);
  assert.deepEqual(ids, ['question-0', 'question-1', 'question-2', 'question-3']);
});
test('resuming an exam preserves the stored order and repairs invalid orders', () => {
  const ids = ['a', 'b', 'c'];
  assert.deepEqual(restoreQuestionOrder(ids, 'exam', ['c', 'a', 'b']), ['c', 'a', 'b']);
  assert.deepEqual(restoreQuestionOrder(ids, 'practice', ['c', 'a', 'b']), ids);
  const repaired = restoreQuestionOrder(ids, 'exam', ['a', 'a', 'missing']);
  assert.deepEqual([...repaired].sort(), ids);
});
test('mode and shuffled order survive library reloads, and old scores default to practice', () => {
  const progress = { attemptId: 'run', mode: 'exam', questionOrder: ['question-1', 'question-0'], currentIndex: 1, answers: { 'question-1': 0 }, isReviewing: false, updatedAt: '2026-10-27T10:00:00Z' };
  const [exam] = readLibrary(JSON.stringify([{ id: 'x', title: 'Modes', json: '{}', questionCount: 2, progress, attempts: [{ id: 'run', score: 1, total: 2, mode: 'exam', completedAt: '2026-10-27T10:00:00Z' }, { id: 'old', score: 2, total: 2, completedAt: '2026-10-27T09:00:00Z' }] }]));
  assert.deepEqual(exam.progress, progress);
  assert.equal(modeLabel(exam.attempts[0].mode), 'Exam Mode');
  assert.equal(modeLabel(exam.attempts[1].mode), 'Practice Mode');
  assert.equal(runMode(undefined), 'practice');
});
test('JSON export shares exam content, keeps links/media and excludes local run data', () => {
  const exam = { title: 'Share', description: 'Portable', questions: [{ question: 'Which?', images: ['https://example.com/picture.png'], options: ['A', 'B'], answer: 0 }], attempts: [{ score: 2 }], progress: { answer: 'private', flaggedQuestions: ['question-0'] }, gitCommit: 'private' };
  const exported = prepareExamExport({ title: '../Bad:/\\name*', json: JSON.stringify(exam) });
  assert.ok(exported.fileName.endsWith('.json'));
  assert.equal(/[<>:"/\\|?*]/.test(exported.fileName), false);
  assert.deepEqual(JSON.parse(exported.content), { title: exam.title, description: exam.description, questions: exam.questions });
  assert.throws(() => prepareExamExport({ title: 'Bad', json: '{broken' }));
  assert.throws(() => prepareExamExport({ title: 'Bad', json: '{}' }));
});
test('review flags survive saved sessions and version switching while invalid and duplicate IDs are repaired', async () => {
  const { restoreReviewFlags } = await import('../lib/run.ts');
  const { switchExamVersion } = await import('../lib/study.ts');
  const ids = ['question-0', 'question-1', 'question-2'];
  assert.deepEqual(restoreReviewFlags(ids, ['question-2', 'question-2', 'missing', null, 1, 'question-99']), ['question-2']);
  assert.deepEqual(restoreReviewFlags(ids, undefined), []);
  assert.deepEqual(restoreReviewFlags(ids, { 'question-1': true }), []);
  const progress = { attemptId: 'flagged-run', currentIndex: 1, answers: { 'question-0': 0 }, isReviewing: false, updatedAt: '2026-10-28T12:00:00Z', mode: 'exam', questionOrder: ['question-2', 'question-0', 'question-1'], flaggedQuestions: ['question-2', 'question-2', 7, 'invalid'] };
  const [exam] = readLibrary(JSON.stringify([{ id: 'flags', title: 'Flags', json: '{}', questionCount: 3, revision: 1, progress, attempts: [] }]));
  assert.deepEqual(exam.progress.flaggedQuestions, ['question-2']);
  assert.deepEqual(exam.progress.questionOrder, progress.questionOrder);
  const version2 = switchExamVersion(exam, { oid: 'b'.repeat(40), revision: 2, json: '{}' }, 'Flags', 3);
  assert.equal(version2.progress, undefined);
  const version1 = switchExamVersion(version2, { oid: 'a'.repeat(40), revision: 1, json: '{}' }, 'Flags', 3);
  assert.deepEqual(version1.progress.flaggedQuestions, ['question-2']);
  assert.deepEqual(version1.progress.answers, progress.answers);
});
test('focused practice selects missed/unanswered or marked questions in original order and freezes subset scope', async () => {
  const { focusedQuestions } = await import('../lib/run.ts');
  const questions = [{ id: 'question-0', answerIndex: 0 }, { id: 'question-1', answerIndex: 1 }, { id: 'question-2', answerIndex: 0 }];
  const progress = { answers: { 'question-0': 0, 'question-1': 0 }, isReviewing: true, flaggedQuestions: ['question-2', 'question-0', 'missing'] };
  assert.deepEqual(focusedQuestions(questions, progress, 'missed'), ['question-1', 'question-2']);
  assert.deepEqual(focusedQuestions(questions, progress, 'marked'), ['question-0', 'question-2']);
  assert.deepEqual(focusedQuestions(questions, { ...progress, isReviewing: false }, 'missed'), []);
  assert.deepEqual(focusedQuestions(questions, undefined, 'marked'), []);
  assert.deepEqual(focusedQuestions(questions, { ...progress, focusedQuestionIds: ['question-1'] }, 'missed'), ['question-1']);
});
test('focused sessions persist independently and focused scores are excluded from full-exam statistics', async () => {
  const { currentAttempts, switchExamVersion, reviseExam } = await import('../lib/study.ts');
  const progress = { attemptId: 'full', currentIndex: 1, answers: { 'question-0': 0 }, isReviewing: true, updatedAt: '2026-10-31T10:00:00Z' };
  const focusedProgress = { ...progress, attemptId: 'focus', focus: 'missed', mode: 'practice', focusedQuestionIds: ['question-1'], questionOrder: ['question-1'], answers: {}, isReviewing: false, currentIndex: 0 };
  const base = { id: 'x', title: 'Focus', json: '{}', questionCount: 2, revision: 1, progress, focusedProgress, attempts: [{ id: 'full', score: 1, total: 2, completedAt: '2026-10-31T10:00:00Z' }, { id: 'focus', focus: 'missed', score: 1, total: 1, completedAt: '2026-10-31T10:00:00Z' }] };
  const [exam] = readLibrary(JSON.stringify([base]));
  assert.deepEqual(exam.progress, progress); assert.deepEqual(exam.focusedProgress, focusedProgress);
  assert.deepEqual(currentAttempts(exam).map(attempt => attempt.id), ['full']);
  const switched = switchExamVersion(exam, { oid: 'b'.repeat(40), revision: 2, json: '{}' }, 'Focus', 2);
  assert.equal(switched.focusedProgress, undefined);
  const restored = switchExamVersion(switched, { oid: 'a'.repeat(40), revision: 1, json: '{}' }, 'Focus', 2);
  assert.deepEqual(restored.focusedProgress, focusedProgress); assert.deepEqual(restored.progress, progress);
  assert.equal(reviseExam(exam, '{}', 'Focus', 3, true).focusedProgress, undefined);
  assert.deepEqual(reviseExam(exam, '{}', 'Renamed', 2, false).focusedProgress, focusedProgress);
});
