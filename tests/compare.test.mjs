import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeExam, questionContent } from '../lib/exam.ts';
import { compareExams } from '../lib/compare.ts';
const q = (id, question, options = ['One', 'Two'], answer = 0) => ({ id, question, options: options.map((text, index) => ({ id: `${id}-${index}`, text })), answer });
const exam = (questions, extra = {}) => normalizeExam({ title: 'Exam', questions, ...extra });

test('detects edited prompt, choices, correct answer, explanation and images', () => {
  const before = exam([q('a', 'Before?')]);
  const after = exam([{ ...q('a', 'After?', ['One', 'Changed'], 1), explanation: 'A reason', images: ['/sample-images/wide.svg'] }]);
  const result = compareExams(before, after);
  assert.equal(result.summary.changed, 1);
  assert.deepEqual(result.questions[0].fields, ['Question text', 'Question images', 'Answer choices', 'Correct answer', 'Explanation']);
  assert.equal(result.questions[0].answers[0].kind, 'changed');
  assert.equal(result.questions[0].answers[0].before.text, 'Two');
  assert.equal(result.questions[0].answers[0].after.text, 'Changed');
});
test('insertions do not mark every later question as moved', () => {
  const result = compareExams(exam([q('a', 'A?'), q('b', 'B?')]), exam([q('new', 'New?'), q('a', 'A?'), q('b', 'B?')]));
  assert.deepEqual(result.summary, { added: 1, removed: 0, changed: 0, moved: 0 });
  assert.equal(result.unchanged, 2);
});
test('reordering preserves identity, while replacing an identical question is added/removed', () => {
  const result = compareExams(exam([q('a', 'A?'), q('b', 'B?')]), exam([q('b', 'B?'), q('a', 'A?')]));
  assert.equal(result.summary.moved, 2);
  assert.equal(result.summary.changed, 0);
  const replaced = compareExams(exam([q('a', 'Same?')]), exam([q('new', 'Same?')]));
  assert.equal(replaced.summary.added, 1); assert.equal(replaced.summary.removed, 1);
});
test('correct-answer changes remain visible when choices move', () => {
  const original = q('a', 'Pick one?', ['First', 'Second'], 0);
  const next = { ...original, options: [...original.options].reverse(), answer: 1 };
  const result = compareExams(exam([original]), exam([next]));
  assert.ok(result.questions[0].fields.includes('Correct answer'));
  assert.equal(result.questions[0].answers.filter(answer => answer.kind === 'moved').length, 2);
});
test('legacy snapshots match by content and unchanged IDs do not affect quiz semantics', () => {
  const before = exam([{ question: 'Which number is one?', options: ['One', 'Two'], answer: 0 }]);
  const after = exam([q('a', 'Which number is the first?', ['One', 'Two'])]);
  assert.equal(compareExams(before, after).summary.changed, 1);
  const withIds = exam([q('a', 'Which number is one?', ['One', 'Two'])]);
  assert.equal(compareExams(before, withIds).unchanged, 1);
  assert.equal(JSON.stringify(questionContent(before)), JSON.stringify(questionContent(withIds)));
});
test('metadata-only edits and identical comparisons have no question changes', () => {
  const before = exam([q('a', 'A?')]);
  const after = exam([q('a', 'A?')], { title: 'New title', description: 'New description' });
  const result = compareExams(before, after);
  assert.equal(result.metadata.length, 2); assert.equal(result.questions.length, 0);
  assert.equal(compareExams(before, before).unchanged, 1);
});
