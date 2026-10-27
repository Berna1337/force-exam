export type GitVersion = { oid: string; revision: number; basedOn: string | null; message: string; createdAt: string };
export type GitSnapshot = GitVersion & { json: string };
export type GitSave = { json: string; revision: number; newRevision: boolean; basedOn?: string };
declare global {
  interface Window {
    examGit?: {
      save: (id: string, data: GitSave) => Promise<GitVersion>;
      list: (id: string) => Promise<GitVersion[]>;
      read: (id: string, oid: string) => Promise<GitSnapshot>;
      remove: (id: string) => Promise<void>;
    };
  }
}
