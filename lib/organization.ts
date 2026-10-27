import type { SavedExam } from "./study";
export const FOLDERS_KEY = "force-exam-folders-v1";
export type ExamFolder = { id: string; name: string; parentId?: string; archivedAt?: string };
export type LibraryView = "library" | "archive";
export type OrganizationAction = { type: "create"; parentId?: string; archived?: boolean } | { type: "rename"; folder: ExamFolder } | { type: "move-folder"; folder: ExamFolder } | { type: "move-exam"; exam: SavedExam };

export function folderContains(folders: ExamFolder[], parentId: string, folderId?: string): boolean {
  const visited = new Set<string>();
  while (folderId && !visited.has(folderId)) {
    if (folderId === parentId) return true;
    visited.add(folderId); folderId = folders.find(folder => folder.id === folderId)?.parentId;
  }
  return false;
}
export function folderArchived(folders: ExamFolder[], id?: string): boolean {
  const visited = new Set<string>();
  while (id && !visited.has(id)) {
    visited.add(id);
    const folder = folders.find(item => item.id === id);
    if (!folder) return false;
    if (folder.archivedAt) return true;
    id = folder.parentId;
  }
  return false;
}
export const examArchived = (exam: SavedExam, folders: ExamFolder[]) => !!exam.archivedAt || folderArchived(folders, exam.folderId);
export function folderPath(folders: ExamFolder[], id?: string): string {
  const names: string[] = [], visited = new Set<string>();
  while (id && !visited.has(id)) {
    visited.add(id); const folder = folders.find(item => item.id === id);
    if (!folder) break;
    names.unshift(folder.name); id = folder.parentId;
  }
  return names.join(" / ");
}
export function readFolders(json: string | null): ExamFolder[] {
  const parsed = JSON.parse(json ?? "[]");
  if (!Array.isArray(parsed)) throw new Error("Invalid folder list");
  const seen = new Set<string>();
  const folders: ExamFolder[] = parsed.filter(item => {
    if (!item || typeof item.id !== "string" || typeof item.name !== "string" || !item.name.trim() || seen.has(item.id)) return false;
    seen.add(item.id); return true;
  }).map(item => ({ id: item.id, name: item.name, parentId: typeof item.parentId === "string" ? item.parentId : undefined,
    archivedAt: typeof item.archivedAt === "string" && Number.isFinite(Date.parse(item.archivedAt)) ? item.archivedAt : undefined }));
  return folders.map(folder => ({ ...folder, parentId: !folder.parentId || !seen.has(folder.parentId) || folderContains(folders, folder.id, folder.parentId) ? undefined : folder.parentId }));
}
function validParent(folders: ExamFolder[], parentId?: string, movingId?: string, allowArchived = false) {
  if (!parentId) return;
  if (!folders.some(folder => folder.id === parentId) || (!allowArchived && folderArchived(folders, parentId))) throw new Error("Choose an active destination folder.");
  if (movingId && folderContains(folders, movingId, parentId)) throw new Error("A folder cannot be moved inside itself or its subfolders.");
}
function validName(folders: ExamFolder[], name: string, parentId?: string, exceptId?: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80 || /[/\\]/.test(trimmed)) throw new Error("Use a folder name of 1–80 characters without / or \\.");
  if (folders.some(folder => folder.id !== exceptId && folder.parentId === parentId && folder.name.toLowerCase() === trimmed.toLowerCase())) throw new Error("A folder with this name already exists here.");
  return trimmed;
}
export function createFolder(folders: ExamFolder[], id: string, name: string, parentId?: string, archived = false): ExamFolder[] {
  validParent(folders, parentId, undefined, archived); return [...folders, { id, name: validName(folders, name, parentId), parentId, ...(archived && !folderArchived(folders, parentId) ? { archivedAt: new Date().toISOString() } : {}) }];
}
export function renameFolder(folders: ExamFolder[], id: string, name: string): ExamFolder[] {
  const folder = folders.find(item => item.id === id); if (!folder) throw new Error("Folder not found.");
  const next = validName(folders, name, folder.parentId, id);
  return folders.map(item => item.id === id ? { ...item, name: next } : item);
}
export function moveFolder(folders: ExamFolder[], id: string, parentId?: string): ExamFolder[] {
  validParent(folders, parentId, id, true);
  const folder = folders.find(item => item.id === id); if (!folder) throw new Error("Folder not found.");
  if (parentId && folderArchived(folders, id) !== folderArchived(folders, parentId)) throw new Error("Move within the Library or Archive; use Archive or Restore to change location.");
  validName(folders, folder.name, parentId, id);
  const archivedAt = folder.archivedAt ?? (folderArchived(folders, id) ? new Date().toISOString() : undefined);
  return folders.map(item => item.id === id ? { ...item, parentId, archivedAt } : item);
}
export function restoreFolder(folders: ExamFolder[], id: string): ExamFolder[] {
  const folder = folders.find(item => item.id === id); if (!folder) throw new Error("Folder not found.");
  const parentId = folderArchived(folders, folder.parentId) ? undefined : folder.parentId;
  let name = folder.name, suffix = 2;
  while (folders.some(item => item.id !== id && item.parentId === parentId && item.name.toLowerCase() === name.toLowerCase())) name = `${folder.name} (${suffix++})`;
  return folders.map(item => item.id === id ? { ...item, parentId, name, archivedAt: undefined } : item);
}
export function moveExam(exam: SavedExam, folderId: string | undefined, folders: ExamFolder[]): SavedExam {
  validParent(folders, folderId, undefined, true);
  if (folderId && examArchived(exam, folders) !== folderArchived(folders, folderId)) throw new Error("Move within the Library or Archive; use Archive or Restore to change location.");
  return { ...exam, folderId, archivedAt: exam.archivedAt ?? (examArchived(exam, folders) ? new Date().toISOString() : undefined) };
}
export function restoreExam(exam: SavedExam, folders: ExamFolder[]): SavedExam {
  return { ...exam, archivedAt: undefined, folderId: folderArchived(folders, exam.folderId) ? undefined : exam.folderId };
}
export function folderEmpty(folders: ExamFolder[], exams: SavedExam[], id: string) {
  return !folders.some(folder => folder.parentId === id) && !exams.some(exam => exam.folderId === id);
}
