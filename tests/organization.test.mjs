import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFolder, examArchived, folderArchived, folderContains, folderEmpty, folderPath, moveExam, moveFolder, readFolders, renameFolder, restoreExam, restoreFolder } from '../lib/organization.ts';
import { readLibrary } from '../lib/study.ts';
const exam = { id: 'exam', title: 'Organized', json: '{"questions":[]}', questionCount: 2, revision: 3, gitCommit: 'a'.repeat(40), progress: { attemptId: 'run', currentIndex: 1, answers: { 'question-0': 0 }, isReviewing: false, updatedAt: '2026-10-27T10:00:00Z' }, attempts: [{ id: 'run1', score: 1, total: 2, mode: 'exam', revision: 3, completedAt: '2026-10-27T09:00:00Z' }] };
const tree = () => createFolder(createFolder([], 'parent', 'Courses'), 'child', 'Biology', 'parent');

test('nested folders persist and rename without changing their identities or contents', () => {
  const folders = readFolders(JSON.stringify(tree()));
  assert.equal(folderPath(folders, 'child'), 'Courses / Biology');
  assert.equal(folderContains(folders, 'parent', 'child'), true);
  const renamed = renameFolder(folders, 'child', 'Chemistry');
  assert.equal(folderPath(renamed, 'child'), 'Courses / Chemistry');
  assert.throws(() => createFolder(renamed, 'duplicate', 'Chemistry', 'parent'), /already exists/);
});
test('moving folders prevents cycles and removing folders requires them to be empty', () => {
  const folders = tree();
  assert.throws(() => moveFolder(folders, 'parent', 'child'), /itself or its subfolders/);
  assert.throws(() => moveFolder(folders, 'child', 'child'), /itself or its subfolders/);
  assert.equal(folderEmpty(folders, [], 'parent'), false);
  assert.equal(folderEmpty(folders, [{ ...exam, folderId: 'child' }], 'child'), false);
  assert.equal(folderEmpty(folders, [], 'child'), true);
  assert.equal(folderPath(moveFolder(folders, 'child'), 'child'), 'Biology');
});
test('moving and restoring exams preserve content, Git versions, run scores and saved answers', () => {
  const folders = tree();
  const moved = moveExam(exam, 'child', folders);
  assert.equal(moved.folderId, 'child');
  assert.deepEqual(moved.progress, exam.progress); assert.deepEqual(moved.attempts, exam.attempts);
  const archived = { ...moved, archivedAt: '2026-10-27T11:00:00Z' };
  const restored = restoreExam(archived, folders);
  assert.equal(restored.archivedAt, undefined); assert.equal(restored.folderId, 'child');
  assert.equal(restored.json, exam.json); assert.equal(restored.gitCommit, exam.gitCommit);
  const [reloaded] = readLibrary(JSON.stringify([archived]));
  assert.equal(reloaded.archivedAt, archived.archivedAt); assert.equal(reloaded.folderId, 'child');
});
test('archiving a folder hides descendants, while restoring a single exam does not restore siblings', () => {
  const folders = tree().map(folder => folder.id === 'parent' ? { ...folder, archivedAt: '2026-10-27T11:00:00Z' } : folder);
  const nested = { ...exam, folderId: 'child' };
  assert.equal(folderArchived(folders, 'child'), true); assert.equal(examArchived(nested, folders), true);
  const restored = restoreExam(nested, folders);
  assert.equal(restored.folderId, undefined); assert.equal(examArchived(restored, folders), false);
  assert.equal(folderArchived(folders, 'parent'), true);
  const moved = moveExam(nested, undefined, folders);
  assert.equal(examArchived(moved, folders), true, 'Moving is not an implicit restore');
  assert.equal(folderArchived(restoreFolder(folders, 'child'), 'child'), false);
  assert.equal(folderArchived(restoreFolder(folders, 'child'), 'parent'), true);
  assert.equal(folderArchived(restoreFolder(folders, 'parent'), 'child'), false);
});
test('old libraries remain unfiled and cyclic folder data is made navigable', () => {
  const [legacy] = readLibrary(JSON.stringify([exam]));
  assert.equal(legacy.folderId, undefined); assert.equal(examArchived(legacy, []), false);
  assert.throws(() => readFolders('{}'));
  const repaired = readFolders(JSON.stringify([{ id: 'a', name: 'A', parentId: 'b' }, { id: 'b', name: 'B', parentId: 'a' }]));
  assert.equal(repaired.every(folder => !folder.parentId), true);
});
test('archived exams and folders can move between archived destinations and root without restoring', () => {
  let folders = tree().map(folder => folder.id === 'parent' ? { ...folder, archivedAt: '2026-10-27T11:00:00Z' } : folder);
  folders = createFolder(folders, 'target', 'Past courses', undefined, true);
  const movedExam = moveExam({ ...exam, folderId: 'child' }, 'target', folders);
  assert.equal(examArchived(movedExam, folders), true);
  assert.equal(moveExam(movedExam, undefined, folders).archivedAt, movedExam.archivedAt);
  folders = moveFolder(folders, 'child', 'target');
  assert.equal(folderArchived(folders, 'child'), true);
  folders = moveFolder(folders, 'child'); assert.ok(folders.find(folder => folder.id === 'child').archivedAt);
  assert.throws(() => moveFolder(folders, 'target', 'target'), /itself/);
  assert.throws(() => moveExam(exam, 'target', folders), /Archive or Restore/);
});
test('subfolders created in Archive inherit their parent status and restore with the parent', () => {
  let folders = createFolder([], 'archive', 'Old', undefined, true);
  folders = createFolder(folders, 'child', 'Organized', 'archive', true);
  assert.equal(folderArchived(folders, 'child'), true);
  assert.equal(folders.find(folder => folder.id === 'child').archivedAt, undefined);
  assert.equal(folderArchived(restoreFolder(folders, 'archive'), 'child'), false);
});
