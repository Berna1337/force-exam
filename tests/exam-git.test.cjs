const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { createExamGit } = require('../desktop/exam-git.cjs');
const content = (title) => JSON.stringify({ title, questions: [{ question: title, options: ['A', 'B'], answer: 0 }] });

test('Git snapshots support switching, editing an old snapshot, persistence, and deletion', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'exam-git-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = createExamGit(root);
  const first = await store.save('exam-1', { json: content('One'), revision: 1, newRevision: false });
  const second = await store.save('exam-1', { json: content('Two'), revision: 1, newRevision: true, basedOn: first.oid });
  assert.equal(second.revision, 2);
  assert.equal((await store.read('exam-1', first.oid)).json, content('One'));
  const third = await store.save('exam-1', { json: content('Edited one'), revision: 1, newRevision: true, basedOn: first.oid });
  assert.equal(third.revision, 3);
  assert.equal(third.basedOn, first.oid);
  assert.equal((await store.read('exam-1', second.oid)).json, content('Two'));
  const reopened = createExamGit(root);
  assert.deepEqual((await reopened.list('exam-1')).map(item => item.revision), [3, 2, 1]);
  const git = require('isomorphic-git');
  const commit = await git.readCommit({ fs: require('node:fs'), dir: path.join(root, 'exam-1'), oid: third.oid });
  assert.deepEqual(commit.commit.parent, [second.oid]);
  await reopened.remove('exam-1');
  assert.deepEqual(await reopened.list('exam-1'), []);
});

test('Git rejects unsafe identities and cross-exam reads, and serializes saves', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'exam-git-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = createExamGit(root);
  assert.throws(() => store.list('../escape'));
  const base = await store.save('exam-a', { json: content('A'), revision: 1, newRevision: false });
  await store.save('exam-b', { json: content('B'), revision: 1, newRevision: false });
  await assert.rejects(store.read('exam-b', base.oid));
  await assert.rejects(store.read('exam-a', '--bad-ref'));
  const [one, two] = await Promise.all([
    store.save('exam-a', { json: content('A2'), revision: 1, newRevision: true, basedOn: base.oid }),
    store.save('exam-a', { json: content('A3'), revision: 1, newRevision: true, basedOn: base.oid }),
  ]);
  assert.equal(one.revision, 2); assert.equal(two.revision, 3);
});
