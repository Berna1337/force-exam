import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanSettings, meetsPassingScore, cleanTags, selectPool, secondsRemaining, topicScores } from '../lib/session.ts';
import { normalizeExam, questionContent } from '../lib/exam.ts';
import { editExam, serializeExam } from '../lib/editor.ts';
import { focusedQuestions } from '../lib/run.ts';
import { readLibrary, currentAttempts } from '../lib/study.ts';
import { compareExams } from '../lib/compare.ts';
test('pools draw distinct questions in source order and honor topic filters without changing the bank', () => {
  const bank = [{ id: 'q0', tags: ['Cells'] }, { id: 'q1', tags: ['DNA'] }, { id: 'q2', tags: ['Cells'] }];
  assert.deepEqual(selectPool(bank, { topic: 'Cells' }), ['q0', 'q2']);
  const selected = selectPool(bank, { questionCount: 2 }, () => 0);
  assert.equal(selected.length, 2); assert.equal(new Set(selected).size, 2);
  assert.deepEqual(selected, bank.filter(question => selected.includes(question.id)).map(question => question.id));
  assert.deepEqual(selectPool(bank, { topic: 'missing' }), []);
  assert.deepEqual(bank.map(question => question.id), ['q0', 'q1', 'q2']);
});
test('deadlines are absolute and expired sessions stay expired across restarts', () => {
  assert.equal(secondsRemaining(undefined, 0), undefined);
  assert.equal(secondsRemaining(60000, 15000), 45); assert.equal(secondsRemaining(60000, 61000), 0);
  assert.deepEqual(cleanSettings({ durationMinutes: 999, questionCount: -1, feedback: 'yes' }), {});
  assert.deepEqual(cleanSettings({ durationMinutes: 30, questionCount: 10, feedback: true }), { durationMinutes: 30, questionCount: 10, feedback: true });
});
test('topics survive editing and comparisons without changing question grading or resetting study progress', () => {
  const exam = normalizeExam({ title: 'Topics', questions: [{ question: 'Q', options: ['A', 'B'], answer: 0, tags: [' Cells ', 'Cells', 'DNA'] }] });
  const edited = editExam(exam); const roundTrip = normalizeExam(JSON.parse(serializeExam(edited)));
  assert.deepEqual(roundTrip.questions[0].tags, ['Cells', 'DNA']);
  const before = normalizeExam({ title: 'Topics', questions: [{ question: 'Q', options: ['A', 'B'], answer: 0 }] });
  assert.deepEqual(questionContent(before), questionContent(exam));
  assert.deepEqual(compareExams(before, exam).questions[0].fields, ['Topics / tags']);
  assert.deepEqual(cleanTags([' A ', 'A', null]), ['A']);
  assert.deepEqual({ ...topicScores(exam.questions, { 'question-0': 0 }) }, { Cells: { correct: 1, total: 1 }, DNA: { correct: 1, total: 1 } });
});
test('timed pool and feedback metadata survives reloads and pools do not inflate full-run scores', () => {
  const progress = { attemptId: 'run', currentIndex: 0, answers: { 'question-1': 0 }, isReviewing: false, updatedAt: '2026-10-31T12:00:00Z', mode: 'exam', pool: true, poolQuestionIds: ['question-1'], questionOrder: ['question-1'], deadlineAt: 60000, settings: { durationMinutes: 1, questionCount: 1 }, revealedQuestions: ['question-1'] };
  const [exam] = readLibrary(JSON.stringify([{ id: 'x', title: 'Pool', json: '{}', questionCount: 2, progress, attempts: [{ id: 'p', score: 1, total: 1, pool: true, completedAt: progress.updatedAt }, { id: 'f', score: 1, total: 2, completedAt: progress.updatedAt }] }]));
  assert.deepEqual(exam.progress, progress); assert.deepEqual(currentAttempts(exam).map(attempt => attempt.id), ['f']);
});

test('focused practice from a pool does not treat unasked bank questions as missed', () => {
  const questions = [{ id: 'question-0', answerIndex: 0 }, { id: 'question-1', answerIndex: 1 }];
  assert.deepEqual(focusedQuestions(questions, { answers: { 'question-0': 0 }, isReviewing: true, poolQuestionIds: ['question-0'] }, 'missed'), []);
  assert.deepEqual(focusedQuestions(questions, { answers: {}, isReviewing: true, poolQuestionIds: ['question-0'] }, 'missed'), ['question-0']);
});

test('passing scores are optional, validated, and use exact scores at the boundary', () => {
  for (const passingScore of [undefined, 0, -1, 101, 70.5, '70', NaN]) {
    assert.equal(cleanSettings({ passingScore }).passingScore, undefined);
    assert.equal(meetsPassingScore(10, 10, passingScore), false);
  }
  assert.equal(cleanSettings({ passingScore: 70 }).passingScore, 70);
  assert.equal(meetsPassingScore(7, 10, 70), true);
  assert.equal(meetsPassingScore(8, 10, 70), true);
  assert.equal(meetsPassingScore(2, 3, 67), false);
  assert.equal(meetsPassingScore(3, 3, 100), true);
  assert.equal(meetsPassingScore(0, 0, 70), false);
});
test('both modes preserve passing targets in saved sessions and completed attempts', () => {
  for (const mode of ['practice', 'exam']) {
    const progress = { attemptId: 'pass', currentIndex: 0, answers: {}, isReviewing: true, updatedAt: '2026-11-08T12:00:00Z', mode, settings: { passingScore: 80 } };
    const attempt = { id: 'pass', mode, score: 4, total: 5, passingScore: 80, completedAt: progress.updatedAt };
    const [exam] = readLibrary(JSON.stringify([{ id: 'x', title: 'Pass', json: '{}', questionCount: 5, progress, attempts: [attempt] }]));
    assert.equal(cleanSettings(exam.progress.settings).passingScore, 80);
    assert.equal(exam.attempts[0].passingScore, 80);
  }
});

test('workspace shows only the three most recent unfinished sessions with pool progress', async () => {
  const { unfinishedSessions } = await import('../lib/workspace.ts');
  const progress = (day, extra = {}) => ({ attemptId: `run-${day}`, currentIndex: 0, answers: { 'question-0': 1 }, isReviewing: false, updatedAt: `2026-11-0${day}T12:00:00Z`, ...extra });
  const exams = [
    { id: 'a', questionCount: 30, progress: progress(1) },
    { id: 'b', questionCount: 30, progress: progress(3, { poolQuestionIds: ['question-0', 'question-2'] }), focusedProgress: progress(4, { focus: 'marked', focusedQuestionIds: ['question-2'] }) },
    { id: 'c', questionCount: 30, progress: progress(5, { isReviewing: true }) },
    { id: 'd', questionCount: 30, progress: progress(2) },
  ];
  const sessions = unfinishedSessions(exams);
  assert.deepEqual(sessions.map(item => [item.exam.id, item.focused]), [['b', true], ['b', false], ['d', false]]);
  assert.deepEqual(sessions.map(item => [item.answered, item.total]), [[0, 1], [1, 2], [1, 30]]);
  assert.deepEqual(unfinishedSessions([]), []);
});

test('exam passing defaults survive reloads and stay separate from attempt targets', () => {
  const base = { id: 'x', title: 'Default target', json: '{}', questionCount: 5, revision: 1, attempts: [], progress: { attemptId: 'run', currentIndex: 0, answers: {}, isReviewing: false, updatedAt: '2026-11-10T12:00:00Z', settings: { passingScore: 60 } } };
  const load = value => readLibrary(JSON.stringify([{ ...base, passingScore: value }]))[0];
  assert.equal(load(80).passingScore, 80);
  assert.equal(load(80).progress.settings.passingScore, 60);
  for (const invalid of [undefined, null, 0, 101, '80', 75.5]) assert.equal(load(invalid).passingScore, undefined);
  assert.equal(load(undefined).progress.settings.passingScore, 60);
});
