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
  const exam = { title: 'Share', description: 'Portable', questions: [{ question: 'Which?', images: ['https://example.com/picture.png'], options: ['A', 'B'], answer: 0 }], attempts: [{ score: 2 }], progress: { answer: 'private' }, gitCommit: 'private' };
  const exported = prepareExamExport({ title: '../Bad:/\\name*', json: JSON.stringify(exam) });
  assert.ok(exported.fileName.endsWith('.json'));
  assert.equal(/[<>:"/\\|?*]/.test(exported.fileName), false);
  assert.deepEqual(JSON.parse(exported.content), { title: exam.title, description: exam.description, questions: exam.questions });
  assert.throws(() => prepareExamExport({ title: 'Bad', json: '{broken' }));
  assert.throws(() => prepareExamExport({ title: 'Bad', json: '{}' }));
});
