import type { ExamFolder } from './organization';
import type { SavedExam } from './study';
export const COLLECTION_LIMIT = 100 * 1024 * 1024;
export type Collection = { format: 'force-exam-collection'; version: 1; rootFolderId: string; folders: ExamFolder[]; exams: { folderId: string; exam: { title: string; description?: string; questions: unknown[] } }[] };
export function parseCollection(json: string, validate: (value: unknown) => { title: string }): Collection {
  if (new TextEncoder().encode(json).length > COLLECTION_LIMIT) throw new Error('Collections must be smaller than 100 MB.');
  const value = JSON.parse(json);
  if (!value || value.format !== 'force-exam-collection' || value.version !== 1 || typeof value.rootFolderId !== 'string' || !Array.isArray(value.folders) || !value.folders.length || value.folders.length > 1000 || !Array.isArray(value.exams) || value.exams.length > 5000) throw new Error('Choose a valid Force Exam collection file.');
  const ids = new Set<string>();
  const folders: ExamFolder[] = value.folders.map((folder: ExamFolder) => {
    if (!folder || typeof folder.id !== 'string' || !folder.id || ids.has(folder.id) || typeof folder.name !== 'string' || !folder.name.trim() || folder.name.trim().length > 80 || /[/\\]/.test(folder.name) || (folder.parentId !== undefined && typeof folder.parentId !== 'string')) throw new Error('Invalid collection folder.');
    ids.add(folder.id); return { id: folder.id, name: folder.name.trim(), parentId: folder.parentId };
  });
  for (const folder of folders) {
    const visited = new Set<string>(); let current: ExamFolder | undefined = folder;
    while (current) {
      if (visited.has(current.id)) throw new Error('Collection folders contain a cycle.');
      visited.add(current.id);
      if (!current.parentId) { if (current.id !== value.rootFolderId) throw new Error('Collection folders must share one root.'); break; }
      const parent = folders.find(item => item.id === current!.parentId);
      if (!parent) throw new Error('Collection parent folder is missing.'); current = parent;
    }
    if (folders.some(other => other.id !== folder.id && other.parentId === folder.parentId && other.name.toLowerCase() === folder.name.toLowerCase())) throw new Error('Duplicate folder names in collection.');
  }
  if (!ids.has(value.rootFolderId) || folders.find(folder => folder.id === value.rootFolderId)?.parentId) throw new Error('Invalid collection root.');
  const exams = value.exams.map((entry: Collection['exams'][number]) => {
    if (!entry || !ids.has(entry.folderId)) throw new Error('An exam references a missing folder.');
    const normalized = validate(entry.exam);
    return { folderId: entry.folderId, exam: { title: normalized.title, ...(typeof entry.exam.description === 'string' ? { description: entry.exam.description } : {}), questions: entry.exam.questions } };
  });
  return { format: 'force-exam-collection', version: 1, rootFolderId: value.rootFolderId, folders, exams };
}
export function instantiateCollection(collection: Collection, existing: ExamFolder[], parentId: string | undefined, archived: boolean, uuid: () => string) {
  if (parentId && !existing.some(folder => folder.id === parentId)) throw new Error('Destination folder no longer exists.');
  const ids = new Map(collection.folders.map(folder => [folder.id, uuid()]));
  const root = collection.folders.find(folder => folder.id === collection.rootFolderId)!;
  let name = root.name, suffix = 2;
  while (existing.some(folder => folder.parentId === parentId && folder.name.toLowerCase() === name.toLowerCase())) name = `${root.name.slice(0, 70)} (${suffix++})`;
  const folders = collection.folders.map(folder => ({ id: ids.get(folder.id)!, name: folder.id === root.id ? name : folder.name, parentId: folder.id === root.id ? parentId : ids.get(folder.parentId!), ...(folder.id === root.id && archived && !parentId ? { archivedAt: new Date().toISOString() } : {}) }));
  const exams: SavedExam[] = collection.exams.map(entry => ({ id: uuid(), title: entry.exam.title, json: JSON.stringify(entry.exam, null, 2), questionCount: entry.exam.questions.length, folderId: ids.get(entry.folderId), attempts: [], revision: 1 }));
  return { folders, exams, rootId: ids.get(root.id)! };
}
