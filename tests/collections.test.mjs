import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCollection, instantiateCollection } from '../lib/collections.ts';
import { normalizeExam } from '../lib/exam.ts';
import { prepareCollectionExport } from '../desktop/export.cjs';
const image = 'data:image/png;base64,aGVsbG8=';
const fixture = () => ({ format: 'force-exam-collection', version: 1, rootFolderId: 'root', folders: [{ id: 'root', name: 'Courses', archivedAt: 'private' }, { id: 'child', name: 'Biology', parentId: 'root' }, { id: 'empty', name: 'Empty', parentId: 'child' }], exams: [{ folderId: 'child', exam: { title: 'Exam', questions: [{ question: 'Picture?', images: [image], options: ['Yes', 'No'], answer: 0 }], attempts: ['private'], progress: 'private' } }] });
test('collection round trip preserves nested and empty folders and embedded images without private data', () => {
  const parsed = parseCollection(JSON.stringify(fixture()), normalizeExam);
  const output = prepareCollectionExport({ title: 'Courses', json: JSON.stringify(parsed) });
  assert.equal(output.fileName, 'Force-Exam-Collection-Courses.json');
  const again = parseCollection(output.content, normalizeExam);
  assert.equal(again.folders.length, 3); assert.equal(again.exams[0].exam.questions[0].images[0], image);
  assert.equal(output.content.includes('private'), false);
  let id = 0; const copy = instantiateCollection(again, [{ id: 'existing', name: 'courses' }], undefined, true, () => `new-${++id}`);
  assert.equal(copy.folders[0].name, 'Courses (2)'); assert.ok(copy.folders[0].archivedAt);
  assert.equal(copy.folders[1].parentId, copy.rootId); assert.equal(copy.folders[2].parentId, copy.folders[1].id);
  assert.equal(copy.exams[0].folderId, copy.folders[1].id); assert.deepEqual(copy.exams[0].attempts, []); assert.equal(copy.exams[0].revision, 1);
  assert.equal(copy.exams[0].progress, undefined);
});
test('invalid references, cycles, duplicate folders, bad exams and unsupported formats are rejected', () => {
  for (const mutate of [v => v.version = 2, v => v.folders.push(v.folders[0]), v => v.folders[1].parentId = 'missing', v => v.folders[0].parentId = 'child', v => v.folders[1].parentId = undefined, v => v.exams[0].folderId = 'missing', v => v.exams[0].exam.questions[0].answer = 9, v => v.folders[1].name = '../escape']) {
    const value = fixture(); mutate(value); assert.throws(() => parseCollection(JSON.stringify(value), normalizeExam));
  }
  assert.throws(() => instantiateCollection(parseCollection(JSON.stringify(fixture()), normalizeExam), [], 'missing', false, () => 'new'));
});
