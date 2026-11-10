const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { createBackupStore, validateBackup } = require('../desktop/backup.cjs');
const { createExamGit } = require('../desktop/exam-git.cjs');
const storage = { 'force-exam-library-v1': '[]', 'force-exam-folders-v1': '[]', 'force-exam-editor-new': '{"draft":"private"}' };
test('backup restores exact Git commits, old versions and private storage, and supports rollback', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'force-exam-backup-')), root = path.join(temp, 'repos');
  try {
    const git = createExamGit(root), backups = createBackupStore(root);
    const json = title => JSON.stringify({ title, questions: [{ question: 'Q', options: ['A', 'B'], answer: 0 }] });
    const first = await git.save('exam', { json: json('First'), revision: 1, newRevision: false });
    const second = await git.save('exam', { json: json('Second'), revision: 1, newRevision: true, basedOn: first.oid });
    const backup = await backups.capture(storage); assert.deepEqual(backup.storage, storage);
    await git.remove('exam'); const beginning = backups.begin(backup); await assert.rejects(backups.begin(backup), /in progress/); const token = await beginning; await assert.rejects(backups.capture(storage), /Finish restoring/); await backups.finish(token, true);
    assert.deepEqual((await git.list('exam')).map(version => version.oid), [second.oid, first.oid]);
    assert.equal((await git.read('exam', first.oid)).json, json('First'));
    await git.save('other', { json: json('Kept on rollback'), revision: 1, newRevision: false });
    const rollback = await backups.begin(backup); await backups.finish(rollback, false);
    assert.equal((await git.list('other')).length, 1);
    const damaged = structuredClone(backup); damaged.files[0].data = Buffer.from('wrong').toString('base64');
    assert.throws(() => validateBackup(damaged), /damaged/);
    assert.equal((await git.list('exam')).length, 2);
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
test('backup rejects traversal, absolute paths, duplicate paths, unrelated settings, and bad checksums', () => {
  const data = Buffer.from('test'), sha256 = crypto.createHash('sha256').update(data).digest('hex');
  for (const filePath of ['../escape', '/absolute', 'exam/.git/../../escape', 'exam/../../escape', 'exam/.git/../config', 'exam\\.git\\HEAD', 'exam/.git/CON', 'exam/.git/HEAD.']) assert.throws(() => validateBackup({ format: 'force-exam-backup', version: 1, storage, files: [{ path: filePath, data: data.toString('base64'), sha256 }] }));
  const file = { path: 'exam/.git/HEAD', data: data.toString('base64'), sha256 };
  assert.throws(() => validateBackup({ format: 'force-exam-backup', version: 1, storage, files: [file, { ...file, path: 'exam/.git/head' }] }), /duplicate/);
  assert.throws(() => validateBackup({ format: 'force-exam-backup', version: 1, storage: { ...storage, unrelated: 'bad' }, files: [] }), /settings/);
});
