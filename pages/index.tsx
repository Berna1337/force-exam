import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import {
  AddIcon, ChevronRightIcon, CloseIcon, HamburgerIcon,
  EditIcon, SearchIcon, SmallCloseIcon, ViewIcon,
} from "@chakra-ui/icons";
import {
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  Box, Button, Flex, Heading, HStack, IconButton,
  SimpleGrid, Text, Tooltip, useToast,
} from "@chakra-ui/react";
import ExamRunner from "../components/ExamRunner";
import ExamDetails from "../components/ExamDetails";
import ExamOverview from "../components/ExamOverview";
import ExamEditor from "../components/ExamEditor";
import TitleBar from "../components/TitleBar";
import { normalizeExam, questionContent } from "../lib/exam";
import { draftKey } from "../lib/editor";
import { currentAttempts, ExamAttempt, ExamProgress, LIBRARY_KEY, percentage, progressLabel, readLibrary, reviseExam, SavedExam, switchExamVersion } from "../lib/study";
import type { GitVersion } from "../lib/git";
import { runMode, type RunMode } from "../lib/run";
import { makeExamPortable } from "../lib/images";
import LibrarySidebar, { ArchiveGlyph, FolderGlyph } from "../components/LibrarySidebar";
import CollectionDialog from "../components/CollectionDialog";
import { parseCollection, instantiateCollection, type Collection } from "../lib/collections";
import { exportCollectionFile } from "../lib/export";
import OrganizationDialog from "../components/OrganizationDialog";
import ExamOrganizationBar from "../components/ExamOrganizationBar";
import { createFolder, examArchived, folderArchived, folderContains, folderEmpty, folderPath, FOLDERS_KEY, moveExam, moveFolder, readFolders, renameFolder, restoreExam, restoreFolder, type ExamFolder, type LibraryView, type OrganizationAction } from "../lib/organization";

type WorkspaceTab = { id: string; title: string; initialJson?: string; initialProgress?: ExamProgress; libraryId?: string; kind?: "editor" | "overview"; gitCommit?: string; initialMode?: RunMode; folderId?: string };

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [library, setLibrary] = useState<SavedExam[]>([]);
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const [activeId, setActiveId] = useState("home");
  const [storageError, setStorageError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<SavedExam[]>([]);
  const [folders, setFolders] = useState<ExamFolder[]>([]);
  const foldersRef = useRef<ExamFolder[]>([]);
  const [libraryView, setLibraryView] = useState<LibraryView>("library");
  const [selectedFolderId, setSelectedFolderId] = useState<string>();
  const contextRef = useRef({ libraryView, selectedFolderId });
  contextRef.current = { libraryView, selectedFolderId };
  const [organizationAction, setOrganizationAction] = useState<OrganizationAction | null>(null);
  const [collectionImportOpen, setCollectionImportOpen] = useState(false);
  const [exportingCollection, setExportingCollection] = useState(false);
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState<SavedExam | null>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const exams = readLibrary(localStorage.getItem(LIBRARY_KEY));
      libraryRef.current = exams;
      setLibrary(exams);
    } catch {
      setStorageError("Your saved exam library could not be read. You can still open exam files.");
    }
    try {
      const storedFolders = readFolders(localStorage.getItem(FOLDERS_KEY));
      foldersRef.current = storedFolders; setFolders(storedFolders);
    } catch { setStorageError("Folders could not be read. Your exams are still available in the library."); }
  }, []);

  const destinationFolder = useCallback((id = contextRef.current.selectedFolderId) => contextRef.current.libraryView === "library" && id && foldersRef.current.some(folder => folder.id === id) && !folderArchived(foldersRef.current, id) ? id : undefined, []);
  const showLibrary = (view: LibraryView, folderId?: string) => {
    setLibraryView(view); setSelectedFolderId(folderId); setSearch(""); setActiveId("home");
  };

  const newImport = useCallback(() => {
    const id = crypto.randomUUID();
    setTabs((current) => [...current, { id, title: "Import exam", folderId: destinationFolder() }]);
    setActiveId(id);
  }, [destinationFolder]);

  const openEditor = (exam?: SavedExam) => {
    if (exam && examArchived(exam, foldersRef.current)) { setStorageError("Restore this exam from the archive before editing it."); return; }
    const existing = tabs.find((tab) => tab.kind === "editor" && tab.libraryId === exam?.id);
    if (existing) return setActiveId(existing.id);
    const id = crypto.randomUUID();
    setTabs((current) => [...current, { id, title: exam ? `Edit: ${exam.title}` : "New exam", kind: "editor", libraryId: exam?.id, initialJson: exam?.json, gitCommit: exam?.gitCommit, folderId: exam?.folderId ?? destinationFolder() }]);
    setActiveId(id);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "o") {
        event.preventDefault();
        newImport();
      }
      if (event.key === "\\") {
        event.preventDefault();
        setSidebarOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [newImport]);

  const closeTab = (id: string) => {
    const index = tabs.findIndex((tab) => tab.id === id);
    const remaining = tabs.filter((tab) => tab.id !== id);
    setTabs(remaining);
    if (activeId === id) setActiveId(remaining[Math.max(0, index - 1)]?.id ?? "home");
  };

  const openExam = (exam: SavedExam) => {
    const existing = tabs.find((tab) => tab.libraryId === exam.id && tab.kind === "overview");
    if (existing) return setActiveId(existing.id);
    const id = crypto.randomUUID();
    setTabs((current) => [...current, { id, title: exam.title, libraryId: exam.id, kind: "overview" }]);
    setActiveId(id);
  };

  const startPractice = (exam: SavedExam, fresh: boolean, mode: RunMode) => {
    if (examArchived(exam, foldersRef.current)) { setStorageError("Restore this exam before starting a study session."); return; }
    const existing = tabs.find((tab) => tab.libraryId === exam.id && !tab.kind);
    if (existing && !fresh && runMode(exam.progress?.mode ?? existing.initialMode) === mode) return setActiveId(existing.id);
    let progress = exam.progress;
    if (fresh) {
      progress = undefined;
      const progressByRevision = { ...exam.progressByRevision };
      delete progressByRevision[exam.revision];
      commitLibrary(libraryRef.current.map((item) => item.id === exam.id ? { ...item, progress: undefined, progressByRevision } : item));
    }
    const id = crypto.randomUUID();
    setTabs((current) => [...current.filter((tab) => tab.id !== existing?.id), {
      id, title: `${exam.title} · ${mode === "exam" ? "Exam" : "Practice"}`, libraryId: exam.id, initialJson: exam.json, initialProgress: progress, initialMode: mode,
    }]);
    setActiveId(id);
  };

  const commitLibrary = (next: SavedExam[]) => {
    libraryRef.current = next;
    setLibrary(next);
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError("Changes could not be saved to this device. Keep this window open and keep your original exam files.");
    }
  };

  const saveExam = async (tabId: string, title: string, json: string, questionCount: number) => {
    const matchingExam = libraryRef.current.find((exam) => exam.json === json);
    if (matchingExam) {
      // Reimporting opens the existing overview without changing its saved session.
      setTabs((current) => current.filter((tab) => tab.id !== tabId));
      openExam(matchingExam);
      return false;
    }
    const id = tabId;
    const snapshot = await window.examGit?.save(id, { json, revision: 1, newRevision: false });
    const sourceFolder = tabsRef.current.find(tab => tab.id === tabId)?.folderId;
    const folderId = sourceFolder && !folderArchived(foldersRef.current, sourceFolder) && foldersRef.current.some(folder => folder.id === sourceFolder) ? sourceFolder : undefined;
    const next = [{ id, title, json, questionCount, attempts: [], revision: 1, gitCommit: snapshot?.oid, folderId }, ...libraryRef.current];
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(next)); }
    catch {
      if (snapshot) await window.examGit?.remove(id).catch(() => {});
      throw new Error("The exam and images could not be saved. Try smaller images or free up local storage. Your import is still open.");
    }
    libraryRef.current = next; setLibrary(next); setStorageError("");
    setTabs((current) => current.map((item) => item.id === tabId ? { ...item, title, libraryId: id, kind: "overview" } : item));
    setActiveId(tabId);
    setLibraryView("library"); setSelectedFolderId(folderId);
    return true;
  };

  const saveEditor = async (tab: WorkspaceTab, json: string) => {
    const normalized = normalizeExam(JSON.parse(json));
    const original = libraryRef.current.find((exam) => exam.id === tab.libraryId);
    if (tab.libraryId && (!original || original.json !== tab.initialJson)) {
      setStorageError("This exam changed while the editor was open. Close and reopen the editor before saving.");
      return false;
    }
    const changed = !!original && JSON.stringify(questionContent(normalizeExam(JSON.parse(original.json)))) !== JSON.stringify(questionContent(normalized));
    json = (await makeExamPortable(json)).json;
    if (original && libraryRef.current.find((exam) => exam.id === original.id)?.json !== original.json) throw new Error("The exam changed while images were downloading. Reopen the editor before saving again.");
    const baseline = original && !original.gitCommit ? await window.examGit?.save(original.id, { json: original.json, revision: original.revision, newRevision: false }) : undefined;
    const snapshot = await window.examGit?.save(original?.id ?? tab.id, {
      json, revision: original?.revision ?? 1, newRevision: changed, basedOn: original?.gitCommit ?? baseline?.oid,
    });
    const latest = original ? libraryRef.current.find((exam) => exam.id === original.id) : undefined;
    if (original && (!latest || latest.json !== original.json)) throw new Error("The exam changed while saving. Reopen the editor before saving again.");
    const saved: SavedExam = latest ? reviseExam(latest, json, normalized.title, normalized.questions.length, changed) : {
      id: tab.id, title: normalized.title, json, questionCount: normalized.questions.length, attempts: [], revision: 1,
      folderId: tab.folderId && !folderArchived(foldersRef.current, tab.folderId) && foldersRef.current.some(folder => folder.id === tab.folderId) ? tab.folderId : undefined,
    };
    if (snapshot) { saved.gitCommit = snapshot.oid; saved.revision = snapshot.revision; }
    const next = [saved, ...libraryRef.current.filter((exam) => exam.id !== saved.id)];
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
    } catch {
      setStorageError("The exam could not be saved. Your editor is still open; try smaller images or free up local storage.");
      return false;
    }
    libraryRef.current = next;
    setLibrary(next);
    setStorageError("");
    if (!original) { setLibraryView("library"); setSelectedFolderId(saved.folderId); }
    const id = crypto.randomUUID();
    setTabs((current) => [...current.filter((item) => item.id !== tab.id && item.libraryId !== saved.id), {
      id, title: saved.title, libraryId: saved.id, kind: "overview",
    }]);
    setActiveId(id);
    return true;
  };

  const ensureGitHistory = async (id: string) => {
    const exam = libraryRef.current.find((item) => item.id === id);
    if (!exam || exam.gitCommit || !window.examGit) return;
    const snapshot = await window.examGit.save(id, { json: exam.json, revision: exam.revision, newRevision: false });
    commitLibrary(libraryRef.current.map((item) => item.id === id && item.json === exam.json ? { ...item, gitCommit: snapshot.oid } : item));
  };

  const switchVersion = async (examId: string, version: GitVersion) => {
    const selected = libraryRef.current.find(exam => exam.id === examId);
    if (selected && examArchived(selected, foldersRef.current)) throw new Error("Restore the exam before switching its selected version. You can still compare snapshots in the archive.");
    if (tabs.some((tab) => tab.libraryId === examId && tab.kind === "editor")) throw new Error("Close this exam’s editor before switching versions. Its draft will be kept.");
    if (!window.examGit) throw new Error("Git history is available in the desktop app.");
    const snapshot = await window.examGit.read(examId, version.oid);
    const normalized = normalizeExam(JSON.parse(snapshot.json));
    const original = libraryRef.current.find((item) => item.id === examId);
    if (!original) throw new Error("This exam is no longer in the library.");
    const saved = switchExamVersion(original, snapshot, normalized.title, normalized.questions.length);
    const next = libraryRef.current.map((item) => item.id === examId ? saved : item);
    // Persist first: a failed switch keeps the active session untouched.
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
    libraryRef.current = next;
    setLibrary(next);
    setStorageError("");
    const id = crypto.randomUUID();
    setTabs((current) => [...current.filter((tab) => tab.libraryId !== examId), {
      id, title: saved.title, libraryId: saved.id, kind: "overview",
    }]);
    setActiveId(id);
  };

  const updateProgress = (examId: string, progress: ExamProgress) => {
    if (!libraryRef.current.some((exam) => exam.id === examId)) return;
    commitLibrary(libraryRef.current.map((exam) => exam.id === examId ? { ...exam, progress, progressByRevision: { ...exam.progressByRevision, [exam.revision]: progress } } : exam));
  };

  const recordAttempt = (examId: string, attempt: ExamAttempt) => {
    commitLibrary(libraryRef.current.map((exam) => exam.id === examId ? {
      ...exam, attempts: [{ ...attempt, revision: exam.revision }, ...exam.attempts.filter((previous) => previous.id !== attempt.id)],
    } : exam));
  };

  const deleteExam = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    const next = libraryRef.current.filter((exam) => exam.id !== id);
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
      libraryRef.current = next;
      setLibrary(next);
      setTabs((current) => current.filter((tab) => tab.libraryId !== id));
      if (tabs.some((tab) => tab.id === activeId && tab.libraryId === id)) setActiveId("home");
      setStorageError("");
      try { localStorage.removeItem(draftKey(id)); } catch { /* Deletion of the library entry already succeeded. */ }
      try {
        await window.examGit?.remove(id);
        for (const key of Object.keys(localStorage)) if (key.startsWith(`${draftKey(id)}-`)) localStorage.removeItem(key);
      } catch { setStorageError("The exam was removed from the library, but its Git files could not be deleted from this device."); }
    } catch {
      setStorageError("The exam could not be deleted from storage. It has been kept in your library.");
    }
    setPendingDelete(null);
  };

  const exportFolder = async (folder: ExamFolder) => {
    if (exportingCollection) return;
    setExportingCollection(true);
    const notice = toast({ title: "Preparing collection and images…", status: "info", duration: null });
    try {
      const sourceFolders = foldersRef.current;
      const subtree = sourceFolders.filter(item => folderContains(sourceFolders, folder.id, item.id));
      const exams = libraryRef.current.filter(exam => exam.folderId && folderContains(sourceFolders, folder.id, exam.folderId));
      const entries: Collection["exams"] = [];
      for (const exam of exams) {
        const portable = await makeExamPortable(exam.json);
        entries.push({ folderId: exam.folderId!, exam: JSON.parse(portable.json) });
      }
      const data = parseCollection(JSON.stringify({ format: "force-exam-collection", version: 1, rootFolderId: folder.id,
        folders: subtree.map(item => ({ id: item.id, name: item.name, parentId: item.id === folder.id ? undefined : item.parentId })), exams: entries }), normalizeExam);
      if (await exportCollectionFile(folder.name, JSON.stringify(data, null, 2))) toast({ title: "Collection exported", description: `${exams.length} exams, including their images.`, status: "success" });
    } catch (cause) { organizationError(cause); }
    finally { toast.close(notice); setExportingCollection(false); }
  };
  const importCollection = async (collection: Collection, parentId: string | undefined, archived: boolean) => {
    const createdIds: string[] = [];
    try {
      const portable: Collection = { ...collection, exams: [] };
      for (const entry of collection.exams) portable.exams.push({ folderId: entry.folderId, exam: JSON.parse((await makeExamPortable(JSON.stringify(entry.exam))).json) });
      // Revalidate the size after embedding any linked images.
      parseCollection(JSON.stringify(portable), normalizeExam);
      const added = instantiateCollection(portable, foldersRef.current, parentId, archived, () => crypto.randomUUID());
      for (const exam of added.exams) {
        if (window.examGit) {
          createdIds.push(exam.id);
          const snapshot = await window.examGit.save(exam.id, { json: exam.json, revision: 1, newRevision: true });
          exam.gitCommit = snapshot.oid;
        }
      }
      // Use the latest library so any run saved during image preparation is retained.
      if (parentId && (!foldersRef.current.some(folder => folder.id === parentId) || folderArchived(foldersRef.current, parentId) !== archived)) throw new Error("Destination changed. Choose a destination again.");
      const nextFolders = [...foldersRef.current, ...added.folders], nextLibrary = [...added.exams, ...libraryRef.current];
      const previousFolders = localStorage.getItem(FOLDERS_KEY);
      try {
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(nextFolders));
        try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(nextLibrary)); }
        catch (cause) { if (previousFolders === null) localStorage.removeItem(FOLDERS_KEY); else localStorage.setItem(FOLDERS_KEY, previousFolders); throw cause; }
      } catch { throw new Error("The collection could not be saved. Try smaller images or free up local storage. No exams were imported."); }
      foldersRef.current = nextFolders; setFolders(nextFolders); libraryRef.current = nextLibrary; setLibrary(nextLibrary); setStorageError("");
      showLibrary(archived ? "archive" : "library", added.rootId);
      toast({ title: "Collection imported", description: `${added.exams.length} exams added.`, status: "success" });
    } catch (cause) {
      await Promise.allSettled(createdIds.map(id => window.examGit?.remove(id)));
      throw cause;
    }
  };
  const persistFolders = (next: ExamFolder[]) => {
    try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(next)); }
    catch { throw new Error("Folder changes could not be saved to this device."); }
    foldersRef.current = next; setFolders(next); setStorageError("");
  };
  const persistOrganization = (next: SavedExam[]) => {
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(next)); }
    catch { throw new Error("Library changes could not be saved to this device."); }
    libraryRef.current = next; setLibrary(next); setStorageError("");
  };
  const organizationError = (cause: unknown) => setStorageError(cause instanceof Error ? cause.message : "Could not update the library.");
  const saveOrganization = (name: string, parentId?: string) => {
    if (!organizationAction) return;
    if (organizationAction.type === "create") {
      const id = crypto.randomUUID();
      persistFolders(createFolder(foldersRef.current, id, name, parentId, organizationAction.archived));
      showLibrary(organizationAction.archived ? "archive" : "library", id);
    } else if (organizationAction.type === "rename") persistFolders(renameFolder(foldersRef.current, organizationAction.folder.id, name));
    else if (organizationAction.type === "move-folder") persistFolders(moveFolder(foldersRef.current, organizationAction.folder.id, parentId));
    else {
      const exam = libraryRef.current.find(item => item.id === organizationAction.exam.id);
      if (!exam) throw new Error("This exam is no longer in your library.");
      persistOrganization(libraryRef.current.map(item => item.id === exam.id ? moveExam(item, parentId, foldersRef.current) : item));
    }
  };
  const closeArchivedTabs = (ids: Set<string>) => {
    const affected = (tab: WorkspaceTab) => !!tab.libraryId && ids.has(tab.libraryId);
    if (tabsRef.current.some(tab => tab.id === activeId && affected(tab))) setActiveId("home");
    setTabs(current => current.filter(tab => !affected(tab)));
  };
  const toggleExamArchive = (exam: SavedExam) => {
    try {
      const current = libraryRef.current.find(item => item.id === exam.id);
      if (!current) throw new Error("Exam not found.");
      const archived = examArchived(current, foldersRef.current);
      const updated = archived ? restoreExam(current, foldersRef.current) : { ...current, archivedAt: new Date().toISOString() };
      persistOrganization(libraryRef.current.map(item => item.id === current.id ? updated : item));
      if (!archived) closeArchivedTabs(new Set([current.id]));
      else { setLibraryView("library"); setSelectedFolderId(updated.folderId); setSearch(""); }
      toast({ title: archived ? "Exam restored" : "Exam archived", status: "success", duration: 2500 });
    } catch (cause) { organizationError(cause); }
  };
  const toggleFolderArchive = (folder: ExamFolder) => {
    try {
      const archived = folderArchived(foldersRef.current, folder.id);
      if (archived) { persistFolders(restoreFolder(foldersRef.current, folder.id)); showLibrary("library", folder.id); }
      else {
        const affected = new Set(libraryRef.current.filter(exam => folderContains(foldersRef.current, folder.id, exam.folderId)).map(exam => exam.id));
        persistFolders(foldersRef.current.map(item => item.id === folder.id ? { ...item, archivedAt: new Date().toISOString() } : item));
        closeArchivedTabs(affected);
        if (folderContains(foldersRef.current, folder.id, selectedFolderId)) setSelectedFolderId(undefined);
      }
      toast({ title: archived ? "Folder restored" : "Folder and contents archived", status: "success", duration: 2500 });
    } catch (cause) { organizationError(cause); }
  };
  const removeFolder = (folder: ExamFolder) => {
    try {
      if (!folderEmpty(foldersRef.current, libraryRef.current, folder.id)) throw new Error("Move this folder’s exams and subfolders elsewhere before removing it.");
      persistFolders(foldersRef.current.filter(item => item.id !== folder.id));
      if (selectedFolderId === folder.id) setSelectedFolderId(undefined);
    } catch (cause) { organizationError(cause); }
  };
  const dropExam = (id: string, folderId?: string) => {
    try { persistOrganization(libraryRef.current.map(exam => exam.id === id ? moveExam(exam, folderId, foldersRef.current) : exam)); }
    catch (cause) { organizationError(cause); }
  };
  const dropFolder = (id: string, parentId?: string) => {
    try { persistFolders(moveFolder(foldersRef.current, id, parentId)); }
    catch (cause) { organizationError(cause); }
  };

  const activeTab = tabs.find((tab) => tab.id === activeId);
  const inArchive = libraryView === "archive";
  const selectedFolder = folders.find(folder => folder.id === selectedFolderId);
  const scopedLibrary = library.filter(exam => examArchived(exam, folders) === inArchive && (!selectedFolderId || folderContains(folders, selectedFolderId, exam.folderId)));
  const filteredLibrary = scopedLibrary.filter(exam => exam.title.toLowerCase().includes(search.toLowerCase()) || folderPath(folders, exam.folderId).toLowerCase().includes(search.toLowerCase()));
  const visibleFolders = folders.filter(folder => folderArchived(folders, folder.id) === inArchive);
  const childFolders = visibleFolders.filter(folder => selectedFolderId ? folder.parentId === selectedFolderId : !folder.parentId || !visibleFolders.some(parent => parent.id === folder.parentId));
  const workspaceTitle = selectedFolder ? folderPath(folders, selectedFolder.id) : inArchive ? "Archive" : "Workspace";
  const attempts = scopedLibrary.flatMap((exam) => exam.attempts);
  const inProgress = scopedLibrary.filter((exam) => exam.progress && !exam.progress.isReviewing).length;
  const averageScore = attempts.length ? Math.round(attempts.reduce((total, attempt) => total + percentage(attempt), 0) / attempts.length) : undefined;

  return (
    <Flex h="100dvh" overflow="hidden" direction="column" bg="#1e1e1e" color="#d4d4d4">
      <Head><title>Force Exam</title><meta name="description" content="Your offline exam workspace." /></Head>
      <TitleBar title={activeTab?.title ?? workspaceTitle} onCreate={() => openEditor()} onImport={newImport} onWorkspace={() => showLibrary("library")} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
      <Flex flex="1" minH={0}>
        <Flex as="nav" aria-label="Workspace tools" w="48px" flexShrink={0} bg="#191919" borderRight="1px solid #2b2b2b" direction="column" align="center" py={3} gap={3}>
          <Tooltip label="Workspace" placement="right"><IconButton aria-label="Workspace" icon={<ViewIcon />} variant="ghost" color={activeId === "home" ? "purple.300" : "#999"} onClick={() => showLibrary("library")} /></Tooltip>
          <Tooltip label="Import exam (Ctrl / ⌘ O)" placement="right"><IconButton aria-label="Import a new exam" icon={<AddIcon />} variant="ghost" onClick={newImport} /></Tooltip>
          <Tooltip label="Create exam" placement="right"><IconButton aria-label="Create a new exam" icon={<EditIcon />} variant="ghost" onClick={() => openEditor()} /></Tooltip>
          <Tooltip label="Search exams" placement="right"><IconButton aria-label="Search exams" icon={<SearchIcon />} variant="ghost" onClick={() => { setSidebarOpen(true); requestAnimationFrame(() => searchRef.current?.focus()); }} /></Tooltip>
          <Tooltip label="Archive" placement="right"><IconButton aria-label="Open archive" icon={<ArchiveGlyph />} variant="ghost" onClick={() => showLibrary("archive")} /></Tooltip>
          <Box flex="1" />
          <Text fontFamily="mono" fontSize="10px" color="#777" sx={{ writingMode: "vertical-rl" }} mb={2}>FORCE EXAM</Text>
        </Flex>

        {sidebarOpen && <LibrarySidebar library={library} folders={folders} view={libraryView} selectedFolder={selectedFolderId} activeExam={activeTab?.libraryId} search={search} searchRef={searchRef} onSearch={setSearch} onHide={() => setSidebarOpen(false)} onView={showLibrary} onCreateExam={() => openEditor()} onImport={newImport} onImportCollection={() => setCollectionImportOpen(true)} onExportFolder={exportFolder} onOrganize={setOrganizationAction} onOpen={openExam} onEdit={openEditor} onDelete={setPendingDelete} onArchiveExam={toggleExamArchive} onArchiveFolder={toggleFolderArchive} onRemoveFolder={removeFolder} onDropExam={dropExam} onDropFolder={dropFolder} />}

        <Flex as="main" minW={0} flex="1" direction="column">
          <HStack as="nav" aria-label="Open tabs" h="48px" minH="48px" spacing={0} bg="#191919" borderBottom="1px solid #303030" overflowX="auto" align="stretch">
            {!sidebarOpen && <IconButton aria-label="Show sidebar" variant="ghost" icon={<HamburgerIcon />} alignSelf="center" mx={1} onClick={() => setSidebarOpen(true)} />}
            <Button variant="ghost" flexShrink={0} h="full" borderRadius={0} borderRight="1px solid #303030" borderTop={activeId === "home" ? "2px solid #a78bfa" : "2px solid transparent"} bg={activeId === "home" ? "#1e1e1e" : "transparent"} fontSize="xs" px={5} fontWeight="400" onClick={() => setActiveId("home")}>Workspace</Button>
            {tabs.map((tab) => (
              <HStack key={tab.id} role="group" spacing={1} flexShrink={0} maxW="230px" borderRight="1px solid #303030" borderTop={activeId === tab.id ? "2px solid #a78bfa" : "2px solid transparent"} bg={activeId === tab.id ? "#1e1e1e" : "transparent"} pl={1} pr={2}>
                <Button variant="ghost" fontSize="xs" fontWeight="400" minW={0} h="full" onClick={() => setActiveId(tab.id)}><Text noOfLines={1}>{tab.title}</Text></Button>
                <IconButton aria-label={`Close ${tab.title}`} variant="ghost" size="xs" icon={<SmallCloseIcon />} onClick={() => closeTab(tab.id)} />
              </HStack>
            ))}
            <IconButton aria-label="New exam tab" variant="ghost" size="sm" alignSelf="center" mx={2} flexShrink={0} icon={<AddIcon boxSize={3} />} onClick={newImport} />
          </HStack>
          <HStack px={{ base: 4, md: 7 }} h="42px" minH="42px" fontSize="xs" color="#777" borderBottom="1px solid #292929"><Text>Workspace</Text><ChevronRightIcon /><Text color="#b0b0b0" noOfLines={1}>{activeTab?.title ?? workspaceTitle}</Text></HStack>
          {storageError && <HStack role="alert" px={5} py={2} bg="#44351e" fontSize="xs"><Text flex="1">{storageError}</Text><IconButton size="xs" variant="ghost" aria-label="Dismiss storage message" icon={<CloseIcon boxSize={2} />} onClick={() => setStorageError("")} /></HStack>}
          <Box flex="1" minH={0} overflowY="auto" px={{ base: 4, md: 8, xl: 14 }} py={{ base: 6, md: 10 }}>
            <Box maxW="1040px" mx="auto">
              {activeId === "home" && (
                <Box maxW="720px" mx="auto" pt={{ base: 2, md: 8 }}>
                  <Flex justify="space-between" align="center" gap={4} mb={4}>
                    <Text fontFamily="mono" color="#a78bfa" fontSize="xs" letterSpacing=".12em">{inArchive ? "YOUR ARCHIVE" : selectedFolder ? "EXAM FOLDER" : "YOUR STUDY WORKSPACE"}</Text>
                    {selectedFolder && <Button variant="ghost" size="xs" color={inArchive ? "purple.200" : "#999"} flexShrink={0} leftIcon={<ArchiveGlyph />} onClick={() => toggleFolderArchive(selectedFolder)}>{inArchive ? "Restore folder" : "Archive folder"}</Button>}
                  </Flex>
                  <Heading fontSize={{ base: "28px", md: "36px" }} fontWeight="500" letterSpacing="-.04em" color="#eee">{selectedFolder?.name ?? (inArchive ? "Archive" : "A little focus. A lot of progress.")}</Heading>
                  <Text color="#909090" mt={4} fontSize="sm" lineHeight="1.9" maxW="540px">{inArchive ? "Your archived exams keep their content, versions, scores, and saved progress. Restore them whenever you need them again." : selectedFolder ? "Exams in this folder and its subfolders. Create or import an exam here, or move existing exams into this folder." : "Keep your exams together, open a practice session, and work at your own pace. Everything stays on this device."}</Text>
                  {(!inArchive || selectedFolder) && <HStack mt={7} spacing={3} flexWrap="wrap">
                    {!inArchive && <>
                      <Button colorScheme="purple" size="sm" leftIcon={<EditIcon boxSize={3} />} onClick={() => openEditor()}>Create exam</Button>
                      <Button variant="outline" size="sm" leftIcon={<AddIcon boxSize={3} />} onClick={newImport}>Import exam</Button>
                      <Button variant="outline" size="sm" leftIcon={<FolderGlyph />} onClick={() => setCollectionImportOpen(true)}>Import collection</Button>
                      <Button size="sm" variant="outline" leftIcon={<FolderGlyph />} onClick={() => setOrganizationAction({ type: "create", parentId: selectedFolderId })}>New folder</Button>
                    </>}
                    {selectedFolder && <Button variant="outline" size="sm" leftIcon={<FolderGlyph />} isLoading={exportingCollection} loadingText="Exporting folder" onClick={() => exportFolder(selectedFolder)}>Export folder</Button>}
                  </HStack>}
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mt={9}>
                    {[{ label: "IN PROGRESS", value: inProgress }, { label: "COMPLETED ATTEMPTS", value: attempts.length }, { label: "AVERAGE SCORE", value: averageScore === undefined ? "—" : `${averageScore}%` }].map((stat) => <Box key={stat.label} p={4} bg="#252525" border="1px solid #333" borderRadius="md"><Text fontSize="10px" color="#888" letterSpacing=".06em">{stat.label}</Text><Text mt={2} fontSize="24px" color="purple.200">{stat.value}</Text></Box>)}
                  </SimpleGrid>
                  {childFolders.length > 0 && <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mt={7}>{childFolders.map(folder => <Button key={folder.id} variant="outline" h="auto" py={4} justifyContent="flex-start" leftIcon={<FolderGlyph />} onClick={() => showLibrary(libraryView, folder.id)}><Text fontSize="sm" noOfLines={1}>{folder.name}</Text></Button>)}</SimpleGrid>}
                  <HStack mt={8} mb={3} justify="space-between"><Text fontSize="11px" fontWeight="600" letterSpacing=".1em" color="#888">{inArchive ? "ARCHIVED EXAMS" : "EXAM LIBRARY"}</Text><Text color="#666" fontSize="xs">{filteredLibrary.length} {inArchive ? "archived" : "saved"}</Text></HStack>
                  {filteredLibrary.length ? filteredLibrary.map((exam) => (
                    <Button key={exam.id} variant="ghost" w="full" h="auto" py={4} px={2} justifyContent="space-between" borderRadius={0} borderBottom="1px solid #303030" onClick={() => openExam(exam)}><HStack spacing={3}><Text color="#a78bfa">▤</Text><Box textAlign="left" minW={0}><Text fontSize="sm" fontWeight="400" noOfLines={1}>{exam.title}</Text><Text fontSize="11px" color="#888" fontWeight="400" mt={1}>{inArchive ? `Archived · ${folderPath(folders, exam.folderId) || "Library root"}` : progressLabel(exam)}</Text></Box></HStack><Text color="#999" fontSize="xs" fontWeight="400" ml={4}>{currentAttempts(exam).length ? `Best ${Math.max(...currentAttempts(exam).map(percentage))}%` : `${exam.questionCount} questions`} <ChevronRightIcon /></Text></Button>
                  )) : <Box border="1px dashed #3a3a3a" borderRadius="md" p={7}><Text fontSize="sm" color="#aaa">{inArchive ? "Your archive is empty." : search ? "No matching exams." : selectedFolder ? "No exams in this folder yet." : "Make room for your next exam."}</Text><Text fontSize="xs" color="#777" mt={2} lineHeight="1.8">{inArchive ? "Use an exam or folder’s ⋯ menu to archive it. Restore it here at any time." : "Create an exam in the visual editor, import a JSON file, or move one here from another folder."}</Text></Box>}
                  <HStack mt={8} gap={6} flexWrap="wrap" fontSize="11px" color="#777"><Text>◎ Works offline</Text><Text>▤ JSON exam files</Text><Text>↗ Pick up from your library</Text></HStack>
                </Box>
              )}
              {tabs.map((tab) => {
                const exam = library.find((item) => item.id === tab.libraryId);
                return <Box key={tab.id} display={activeId === tab.id ? "block" : "none"}>
                  {exam && (tab.kind === "overview" || (!tab.kind && exam.progress?.isReviewing)) && <ExamOrganizationBar folder={folderPath(folders, exam.folderId) || "Library root"} archived={examArchived(exam, folders)} onMove={() => setOrganizationAction({ type: "move-exam", exam })} onArchive={() => toggleExamArchive(exam)} />}
                  {tab.kind === "editor" ? <ExamEditor examId={tab.libraryId} initialJson={tab.initialJson} gitCommit={tab.gitCommit} onSave={(json) => saveEditor(tab, json)} onClose={() => closeTab(tab.id)} /> : tab.kind === "overview" && exam ? <ExamOverview exam={exam} isArchived={examArchived(exam, folders)} onStudy={(fresh, mode) => startPractice(exam, fresh, mode)} onEdit={() => openEditor(exam)} onDelete={() => setPendingDelete(exam)} onEnsureHistory={ensureGitHistory} onSwitchVersion={switchVersion} /> : <>
                    {exam?.progress?.isReviewing && <ExamDetails exam={exam} isArchived={examArchived(exam, folders)} onEnsureHistory={ensureGitHistory} onSwitchVersion={switchVersion} onEdit={() => openEditor(exam)} onDelete={() => setPendingDelete(exam)} />}
                    <ExamRunner initialJson={tab.initialJson} initialProgress={tab.initialProgress} initialMode={tab.initialMode} onOverview={() => { if (exam) openExam(exam); }} onBack={() => closeTab(tab.id)} onExamImported={(title, json, count) => saveExam(tab.id, title, json, count)} onProgressChange={(progress) => { if (tab.libraryId) updateProgress(tab.libraryId, progress); }} onAttemptComplete={(attempt) => { if (tab.libraryId) recordAttempt(tab.libraryId, attempt); }} />
                  </>}
                </Box>;
              })}
            </Box>
          </Box>
        </Flex>
      </Flex>
      {collectionImportOpen && <CollectionDialog folders={folders} initialFolder={selectedFolderId} initialArchived={libraryView === "archive"} onClose={() => setCollectionImportOpen(false)} onImport={importCollection} />}
      <OrganizationDialog action={organizationAction} folders={folders} onClose={() => setOrganizationAction(null)} onSave={saveOrganization} />
      <AlertDialog isOpen={!!pendingDelete} leastDestructiveRef={cancelDeleteRef} onClose={() => setPendingDelete(null)} isCentered>
        <AlertDialogOverlay><AlertDialogContent mx={4} bg="#252525"><AlertDialogHeader>Delete exam?</AlertDialogHeader><AlertDialogBody><Text>Delete “{pendingDelete?.title}” and its saved progress, scores, and Git version history from this device?</Text><Text color="#999" fontSize="sm" mt={3}>Your original JSON file is kept.</Text></AlertDialogBody><AlertDialogFooter gap={3}><Button ref={cancelDeleteRef} onClick={() => setPendingDelete(null)}>Keep exam</Button><Button colorScheme="red" onClick={deleteExam}>Delete permanently</Button></AlertDialogFooter></AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
      <HStack as="footer" h="26px" minH="26px" px={4} spacing={4} borderTop="1px solid #303030" bg="#191919" fontSize="10px" color="#777"><Text>Force Exam</Text><Text flex="1" /><Text>{tabs.length} open {tabs.length === 1 ? "tab" : "tabs"}</Text><Text role="status">{storageError ? "Changes not saved" : "Progress and scores saved locally"}</Text></HStack>
    </Flex>
  );
}
