const git = require('isomorphic-git');
const fs = require('node:fs');
const path = require('node:path');

function createExamGit(root) {
  const pending = new Map();
  const directory = (id) => {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid exam identity.');
    return path.join(root, id);
  };
  const queued = (id, task) => {
    const dir = directory(id);
    const result = (pending.get(id) || Promise.resolve()).catch(() => {}).then(() => task(dir));
    pending.set(id, result);
    void result.finally(() => { if (pending.get(id) === result) pending.delete(id); }).catch(() => {});
    return result;
  };
  const commits = async (dir) => {
    try { await fs.promises.access(path.join(dir, '.git', 'HEAD')); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
    try { return await git.log({ fs, dir }); }
    catch (error) { if (error.code === 'NotFoundError') return []; throw error; }
  };
  const blob = async (dir, oid, filepath) => {
    const result = await git.readBlob({ fs, dir, oid, filepath });
    return Buffer.from(result.blob).toString('utf8');
  };
  const history = async (dir) => Promise.all((await commits(dir)).map(async ({ oid, commit }) => ({
    oid, ...JSON.parse(await blob(dir, oid, 'version.json')),
    message: commit.message.split('\n')[0], createdAt: new Date(commit.author.timestamp * 1000).toISOString(),
  })));
  return {
    list: (id) => queued(id, history),
    read: (id, oid) => queued(id, async (dir) => {
      if (typeof oid !== 'string' || !/^[a-f0-9]{40}$/.test(oid)) throw new Error('Invalid version.');
      const versions = await history(dir);
      const version = versions.find((item) => item.oid === oid);
      if (!version) throw new Error('This version is not in this exam’s history.');
      return { ...version, json: await blob(dir, oid, 'exam.json') };
    }),
    save: (id, data) => queued(id, async (dir) => {
      if (!data || typeof data.json !== 'string' || Buffer.byteLength(data.json) > 20 * 1024 * 1024 ||
          !Number.isSafeInteger(data.revision) || data.revision < 1 || typeof data.newRevision !== 'boolean') throw new Error('Invalid exam snapshot.');
      const exam = JSON.parse(data.json);
      if (!exam || typeof exam.title !== 'string' || !Array.isArray(exam.questions) || !exam.questions.length) throw new Error('Invalid exam content.');
      await fs.promises.mkdir(dir, { recursive: true });
      await git.init({ fs, dir, defaultBranch: 'main' });
      const versions = await history(dir);
      if (data.basedOn && !versions.some((item) => item.oid === data.basedOn)) throw new Error('The base version is missing.');
      const head = versions[0];
      if (head && data.newRevision && head.basedOn === data.basedOn && head.revision > data.revision &&
          await blob(dir, head.oid, 'exam.json') === data.json) return head;
      const revision = data.newRevision ? Math.max(data.revision, ...versions.map((item) => item.revision)) + 1 : data.revision;
      if (head && head.revision === revision && await blob(dir, head.oid, 'exam.json') === data.json) return head;
      const metadata = { revision, basedOn: data.basedOn || null };
      await fs.promises.writeFile(path.join(dir, 'exam.json'), data.json);
      await fs.promises.writeFile(path.join(dir, 'version.json'), JSON.stringify(metadata, null, 2) + '\n');
      await git.add({ fs, dir, filepath: 'exam.json' });
      await git.add({ fs, dir, filepath: 'version.json' });
      const message = `Version ${revision} — ${exam.title.replace(/[\r\n]/g, ' ').slice(0, 200)}`;
      const oid = await git.commit({ fs, dir, message, author: { name: 'Force Exam', email: 'local@force-exam.invalid' } });
      return { oid, ...metadata, message, createdAt: new Date().toISOString() };
    }),
    remove: (id) => queued(id, (dir) => fs.promises.rm(dir, { recursive: true, force: true })),
  };
}
module.exports = { createExamGit };
