import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readLibrary, percentage, progressLabel } from '../lib/study.ts';

const exam = { id: 'legacy', title: 'Existing exam', json: '{}', questionCount: 3 };
test('upgrades existing libraries without removing exams', () => {
  const [restored] = readLibrary(JSON.stringify([exam]));
  assert.equal(restored.title, exam.title);
  assert.deepEqual(restored.attempts, []);
  assert.equal(restored.progress, undefined);
});
test('restores progress and drops malformed answers and score records', () => {
  const [restored] = readLibrary(JSON.stringify([{ ...exam,
    progress: { attemptId: 'session', currentIndex: 2, answers: { 'question-0': 1, 'question-1': -1, anything: 2 }, isReviewing: false, updatedAt: '2026-10-27T10:00:00Z' },
    attempts: [{ id: 'valid', score: 2, total: 3, completedAt: '2026-10-27T10:00:00Z' }, { id: 'invalid', score: 9, total: 3, completedAt: 'bad' }],
  }]));
  assert.deepEqual(restored.progress.answers, { 'question-0': 1 });
  assert.equal(restored.attempts.length, 1);
  assert.equal(percentage(restored.attempts[0]), 67);
  assert.equal(progressLabel(restored), 'Resume · 1/3 answered');
  restored.progress.isReviewing = true;
  assert.equal(progressLabel(restored), 'View last result');
});
test('invalid top-level storage is reported rather than silently overwritten', () => {
  assert.throws(() => readLibrary('{broken'));
  assert.throws(() => readLibrary('{}'));
  assert.deepEqual(readLibrary(null), []);
});

test('question edits keep historical scores and start a new version', async () => {
  const { reviseExam, currentAttempts } = await import('../lib/study.ts');
  const [original] = readLibrary(JSON.stringify([{ ...exam, progress: { attemptId: 'a', currentIndex: 1, answers: { 'question-0': 1 }, isReviewing: false, updatedAt: '2026-10-27T10:00:00Z' }, attempts: [{ id: 'a', score: 2, total: 3, completedAt: '2026-10-27T10:00:00Z' }] }]));
  const renamed = reviseExam(original, '{}', 'Renamed', 3, false);
  assert.deepEqual(renamed.progress, original.progress);
  assert.equal(renamed.revision, 1);
  const changed = reviseExam(original, '{}', 'Updated', 4, true);
  assert.equal(changed.revision, 2);
  assert.equal(changed.progress, undefined);
  assert.equal(changed.attempts.length, 1);
  assert.deepEqual(currentAttempts(changed), []);
});

test('visual editing round-trips legacy exams including answer images and captions', async () => {
  const { normalizeExam, questionContent } = await import('../lib/exam.ts');
  const { editExam, serializeExam } = await import('../lib/editor.ts');
  const normalized = normalizeExam({ title: 'Legacy exam', description: 'Description', questions: [{
    prompt: 'Choose an answer', questionImageUrls: ['/sample-images/wide.svg'], imageCaption: 'Question caption',
    options: [{ label: 'First', imageUrl: '/sample-images/tall.svg', imageAlt: 'Portrait', imageDescription: 'Answer caption' }, 'Second'],
    correctAnswer: 'B', explanation: 'Because it is second.',
  }] });
  assert.equal(JSON.stringify(questionContent(normalizeExam(JSON.parse(serializeExam(editExam(normalized)))))), JSON.stringify(questionContent(normalized)));
});

test('removing choices keeps the correct answer aligned and requires reselecting a removed answer', async () => {
  const { newQuestion, newOption, removeOption, duplicateQuestion } = await import('../lib/editor.ts');
  const question = newQuestion();
  question.options.push(newOption());
  question.answerIndex = 2;
  const removedFirst = removeOption(question, 0);
  assert.equal(removedFirst.answerIndex, 1);
  const removedCorrect = removeOption(question, 2);
  assert.equal(removedCorrect.answerIndex, -1);
  const copy = duplicateQuestion(question);
  assert.notEqual(copy.id, question.id);
  assert.notEqual(copy.options[0].id, question.options[0].id);
  assert.equal(copy.answerIndex, 2);
});

test('incomplete drafts restore only against their original source', async () => {
  const { newExam, readDraft } = await import('../lib/editor.ts');
  const draft = newExam();
  draft.title = 'Work in progress';
  const json = JSON.stringify({ sourceJson: null, draft });
  assert.deepEqual(readDraft(json), draft);
  assert.equal(readDraft(json, 'changed-source'), undefined);
  assert.equal(readDraft('{"sourceJson":null,"draft":{"questions":[]}}'), undefined);
});

test('switching snapshots restores progress per question version without losing scores', async () => {
  const { switchExamVersion } = await import('../lib/study.ts');
  const progress = { attemptId: 'one', currentIndex: 2, answers: { 'question-0': 1 }, isReviewing: false, updatedAt: '2026-10-27T10:00:00Z' };
  const [original] = readLibrary(JSON.stringify([{ ...exam, progress, attempts: [{ id: 'a', score: 2, total: 3, completedAt: '2026-10-27T10:00:00Z' }] }]));
  const second = switchExamVersion(original, { oid: 'b'.repeat(40), revision: 2, json: '{"title":"Second"}' }, 'Second', 5);
  assert.equal(second.progress, undefined);
  assert.equal(second.attempts.length, 1);
  second.progress = { ...progress, attemptId: 'two', currentIndex: 4 };
  const first = switchExamVersion(second, { oid: 'a'.repeat(40), revision: 1, json: '{}' }, 'First', 3);
  assert.deepEqual(first.progress, progress);
  const restoredSecond = switchExamVersion(first, { oid: 'b'.repeat(40), revision: 2, json: '{"title":"Second"}' }, 'Second', 5);
  assert.equal(restoredSecond.progress.attemptId, 'two');
  const [reopened] = readLibrary(JSON.stringify([restoredSecond]));
  assert.equal(reopened.gitCommit, 'b'.repeat(40));
  assert.deepEqual(reopened.progressByRevision['1'], progress);
});
