const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const LIMIT = 250 * 1024 * 1024;
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
function validateBackup(value) {
  if (!value || value.format !== 'force-exam-backup' || value.version !== 1 || !value.storage || typeof value.storage !== 'object' || Array.isArray(value.storage) || !Array.isArray(value.files) || value.files.length > 100000) throw new Error('Choose a valid Force Exam backup.');
  let size = 0; const names = new Set();
  for (const [key, text] of Object.entries(value.storage)) {
    if (!key.startsWith('force-exam-') || typeof text !== 'string') throw new Error('Invalid backup settings.');
    size += Buffer.byteLength(text);
  }
  if (!Object.hasOwn(value.storage, 'force-exam-library-v1') || !Object.hasOwn(value.storage, 'force-exam-folders-v1')) throw new Error('Backup is missing its library or folders.');
  for (const file of value.files) {
    if (!file || typeof file.path !== 'string' || file.path.length > 512 || !/^[a-zA-Z0-9_-]+\/(?:exam\.json|version\.json|\.git\/[a-zA-Z0-9._/-]+)$/.test(file.path) || file.path.split('/').some(part => part === '..' || part === '.' || !part || part.endsWith('.') || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part)) || names.has(file.path.toLowerCase()) || typeof file.data !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.data)) throw new Error('Invalid or duplicate backup file path.');
    names.add(file.path.toLowerCase()); size += file.data.length;
    if (size > LIMIT) throw new Error('Backups must be smaller than 250 MB.');
    if (hash(Buffer.from(file.data, 'base64')) !== file.sha256) throw new Error('A backup file is damaged.');
  }
  if (size > LIMIT) throw new Error('Backups must be smaller than 250 MB.');
  return value;
}
function createBackupStore(root) {
  let pending, starting = false;
  const exists = async file => { try { await fs.access(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
  return {
    isRestoring: () => !!pending || starting,
    async capture(storage) {
      if (pending || starting) throw new Error('Finish restoring before creating another backup.');
      const files = [];
      const walk = async (directory, prefix = '') => {
        for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
          const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) await walk(path.join(directory, entry.name), relative);
          else if (entry.isFile()) { const data = await fs.readFile(path.join(directory, entry.name)); files.push({ path: relative, data: data.toString('base64'), sha256: hash(data) }); }
          else throw new Error('Unexpected link in exam history; backup stopped.');
        }
      };
      if (await exists(root)) await walk(root);
      const backup = validateBackup({ format: 'force-exam-backup', version: 1, createdAt: new Date().toISOString(), storage, files });
      if (Buffer.byteLength(JSON.stringify(backup)) > LIMIT) throw new Error('Backup exceeds 250 MB.');
      return backup;
    },
    async begin(backup) {
      if (pending || starting) throw new Error('Another restore is in progress.');
      validateBackup(backup); starting = true;
      const token = crypto.randomUUID(), staging = `${root}-restore-${token}`, previous = `${root}-previous-${token}`;
      let moved = false;
      try {
        await fs.mkdir(staging, { recursive: true });
        for (const file of backup.files) { const destination = path.join(staging, ...file.path.split('/')); await fs.mkdir(path.dirname(destination), { recursive: true }); await fs.writeFile(destination, Buffer.from(file.data, 'base64'), { mode: 0o600 }); }
        if (await exists(root)) { await fs.rename(root, previous); moved = true; }
        await fs.rename(staging, root);
        pending = { token, previous, moved }; starting = false; return token;
      } catch (error) { starting = false; if (moved) await fs.rename(previous, root); await fs.rm(staging, { recursive: true, force: true }); throw error; }
    },
    async finish(token, commit) {
      if (!pending || pending.token !== token) throw new Error('Invalid restore transaction.');
      const current = pending;
      if (commit) await fs.rm(current.previous, { recursive: true, force: true }).catch(() => {});
      else { await fs.rm(root, { recursive: true, force: true }); if (current.moved) await fs.rename(current.previous, root); }
      pending = undefined;
    },
  };
}
module.exports = { createBackupStore, validateBackup, LIMIT };
