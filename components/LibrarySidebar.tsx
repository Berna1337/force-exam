import { useEffect, useState, type DragEvent, type RefObject } from "react";
import { AddIcon, ChevronDownIcon, ChevronRightIcon, DeleteIcon, EditIcon, HamburgerIcon, SearchIcon } from "@chakra-ui/icons";
import { Badge, Box, Button, Flex, HStack, Icon, IconButton, Input, InputGroup, InputLeftElement, Menu, MenuButton, MenuItem, MenuList, Portal, Stack, Text, Tooltip } from "@chakra-ui/react";
import type { SavedExam } from "../lib/study";
import { examArchived, folderArchived, folderContains, folderEmpty, folderPath, type ExamFolder, type LibraryView, type OrganizationAction } from "../lib/organization";

export function FolderGlyph() { return <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7V5h6l2 2h10v12H3V7Z" /></Icon>; }
export function ArchiveGlyph() { return <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h18v4H3zM5 8v12h14V8M9 12h6" /></Icon>; }

type Props = {
  library: SavedExam[]; folders: ExamFolder[]; view: LibraryView; selectedFolder?: string; activeExam?: string;
  search: string; searchRef: RefObject<HTMLInputElement>; onSearch: (value: string) => void;
  onHide: () => void; onView: (view: LibraryView, folderId?: string) => void;
  onImportCollection: () => void; onExportFolder: (folder: ExamFolder) => void;
  onCreateExam: () => void; onImport: () => void; onOrganize: (action: OrganizationAction) => void;
  onOpen: (exam: SavedExam) => void; onEdit: (exam: SavedExam) => void; onDelete: (exam: SavedExam) => void;
  onArchiveExam: (exam: SavedExam) => void; onArchiveFolder: (folder: ExamFolder) => void; onRemoveFolder: (folder: ExamFolder) => void;
  onDropExam: (id: string, folderId?: string) => void; onDropFolder: (id: string, folderId?: string) => void;
};

export default function LibrarySidebar(props: Props) {
  const { library, folders, view, search, selectedFolder } = props;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!dragging) return;
    const endDrag = () => { setDragging(false); setDropTarget(undefined); };
    window.addEventListener('dragend', endDrag);
    window.addEventListener('drop', endDrag);
    window.addEventListener('blur', endDrag);
    return () => {
      window.removeEventListener('dragend', endDrag);
      window.removeEventListener('drop', endDrag);
      window.removeEventListener('blur', endDrag);
    };
  }, [dragging]);
  const [dropTarget, setDropTarget] = useState<string>();
  const archived = view === "archive";
  const rootTarget = archived ? 'archive-root' : 'root';
  const leaveTarget = (event: DragEvent) => {
    if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDropTarget(undefined);
  };
  const visibleFolders = folders.filter(folder => folderArchived(folders, folder.id) === archived);
  const folderIds = new Set(visibleFolders.map(folder => folder.id));
  const query = search.toLowerCase();
  const exams = library.filter(exam => examArchived(exam, folders) === archived &&
    (exam.title.toLowerCase().includes(query) || folderPath(folders, exam.folderId).toLowerCase().includes(query)));
  const matchingFolder = (folder: ExamFolder) => !query || folderPath(folders, folder.id).toLowerCase().includes(query) ||
    exams.some(exam => folderContains(folders, folder.id, exam.folderId)) || visibleFolders.some(child => folderContains(folders, folder.id, child.id) && folderPath(folders, child.id).toLowerCase().includes(query));
  const sortFolders = (items: ExamFolder[]) => items.sort((a, b) => a.name.localeCompare(b.name));
  const dropped = (event: DragEvent, folderId?: string) => {
    event.preventDefault(); event.stopPropagation(); setDropTarget(undefined); setDragging(false);
    const examId = event.dataTransfer.getData('application/x-force-exam-exam');
    const folder = event.dataTransfer.getData('application/x-force-exam-folder');
    if (examId) props.onDropExam(examId, folderId);
    else if (folder) props.onDropFolder(folder, folderId);
  };
  const dragOver = (event: DragEvent, id: string) => {
    if (!event.dataTransfer.types.some(type => type.startsWith('application/x-force-exam-'))) return;
    event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'move'; setDropTarget(id);
  };
  const menu = (label: string, children: React.ReactNode) => <Menu><MenuButton as={IconButton} aria-label={label} size="xs" variant="ghost" color="var(--muted)" icon={<Text fontSize="16px">⋯</Text>} /><Portal><MenuList bg="var(--surface)" borderColor="var(--border)" fontSize="xs">{children}</MenuList></Portal></Menu>;
  const renderExam = (exam: SavedExam, depth: number) => <HStack key={exam.id} spacing={0} ml={depth * 3} borderRadius="md" bg={props.activeExam === exam.id ? "var(--accent-soft)" : "transparent"}
    draggable onDragStart={event => { event.stopPropagation(); event.dataTransfer.setData('application/x-force-exam-exam', exam.id); event.dataTransfer.effectAllowed = 'move'; setDragging(true); }}>
    <Button variant="ghost" flex="1" minW={0} h="auto" minH="44px" py={2} px={3} justifyContent="flex-start" fontWeight="400" color={props.activeExam === exam.id ? "var(--accent-text)" : "var(--muted)"} onClick={() => props.onOpen(exam)}>
      <HStack w="full" spacing={2}><Text color="var(--muted)" fontSize="sm">▤</Text><Box flex="1" minW={0} textAlign="left"><Text fontSize="xs" noOfLines={1}>{exam.title}</Text><Text fontSize="10px" color="var(--muted)" mt={1}>{archived && exam.folderId && !folderIds.has(exam.folderId) ? folderPath(folders, exam.folderId) : exam.progress && !exam.progress.isReviewing ? `${Object.keys(exam.progress.answers).length}/${exam.progress.poolQuestionIds?.length ?? exam.questionCount} answered` : `${exam.questionCount} questions`}</Text></Box></HStack>
    </Button>
    {menu(`Actions for ${exam.title}`, <>
      <MenuItem bg="var(--surface)" onClick={() => props.onOpen(exam)}>Open overview</MenuItem>
      {!archived && <MenuItem bg="var(--surface)" icon={<EditIcon />} onClick={() => props.onEdit(exam)}>Edit exam</MenuItem>}
      <MenuItem bg="var(--surface)" icon={<FolderGlyph />} onClick={() => props.onOrganize({ type: 'move-exam', exam })}>Move to folder</MenuItem>
      <MenuItem bg="var(--surface)" icon={<ArchiveGlyph />} onClick={() => props.onArchiveExam(exam)}>{archived ? "Restore exam" : "Archive exam"}</MenuItem>
      <MenuItem bg="var(--surface)" color="var(--danger)" icon={<DeleteIcon />} onClick={() => props.onDelete(exam)}>Delete exam</MenuItem>
    </>)}
  </HStack>;
  const renderFolder = (folder: ExamFolder, depth: number): React.ReactNode => {
    if (!matchingFolder(folder)) return null;
    const open = !!query || !collapsed.has(folder.id);
    return <Box key={folder.id}>
      <HStack spacing={0} ml={depth * 3} bg={dropTarget === folder.id ? 'var(--accent-soft)' : selectedFolder === folder.id ? 'var(--border)' : undefined} borderRadius="md"
        draggable onDragStart={event => { event.stopPropagation(); event.dataTransfer.setData('application/x-force-exam-folder', folder.id); event.dataTransfer.effectAllowed = 'move'; setDragging(true); }}
        onDragOver={event => dragOver(event, folder.id)} onDragLeave={leaveTarget} onDrop={event => dropped(event, folder.id)}>
        <IconButton aria-label={`${open ? 'Collapse' : 'Expand'} folder ${folder.name}`} size="xs" variant="ghost" icon={open ? <ChevronDownIcon /> : <ChevronRightIcon />} onClick={() => setCollapsed(current => { const next = new Set(current); if (next.has(folder.id)) next.delete(folder.id); else next.add(folder.id); return next; })} />
        <Button variant="ghost" flex="1" minW={0} px={1} size="sm" justifyContent="flex-start" fontWeight="400" leftIcon={<FolderGlyph />} onClick={() => props.onView(view, folder.id)}><Text fontSize="xs" noOfLines={1}>{folder.name}</Text></Button>
        {menu(`Actions for folder ${folderPath(folders, folder.id)}`, <>
          <MenuItem bg="var(--surface)" icon={<AddIcon />} onClick={() => props.onOrganize({ type: 'create', parentId: folder.id, archived })}>New subfolder</MenuItem>
          <MenuItem bg="var(--surface)" onClick={() => props.onExportFolder(folder)}>Export folder</MenuItem>
          <MenuItem bg="var(--surface)" onClick={() => props.onOrganize({ type: 'rename', folder })}>Rename folder</MenuItem>
          <MenuItem bg="var(--surface)" onClick={() => props.onOrganize({ type: 'move-folder', folder })}>Move folder</MenuItem>
          <MenuItem bg="var(--surface)" icon={<ArchiveGlyph />} onClick={() => props.onArchiveFolder(folder)}>{archived ? 'Restore folder' : 'Archive folder'}</MenuItem>
          <MenuItem bg="var(--surface)" color="var(--danger)" isDisabled={!folderEmpty(folders, library, folder.id)} onClick={() => props.onRemoveFolder(folder)}>Remove empty folder</MenuItem>
        </>)}
      </HStack>
      {open && <Box>{sortFolders(visibleFolders.filter(child => child.parentId === folder.id)).map(child => renderFolder(child, depth + 1))}{exams.filter(exam => exam.folderId === folder.id).map(exam => renderExam(exam, depth + 1))}</Box>}
    </Box>;
  };
  const archiveCount = library.filter(exam => examArchived(exam, folders)).length;
  return <Flex as="aside" aria-label="Exam library" onDragEnd={() => { setDropTarget(undefined); setDragging(false); }} w={{ base: '200px', lg: '244px' }} flexShrink={0} direction="column" bg="var(--surface)" borderRight="1px solid var(--border)">
    <HStack h="48px" minH="48px" px={4} justify="space-between" borderBottom="1px solid var(--border)"><Text fontWeight="600" fontSize="sm">Force Exam</Text><Tooltip label="Hide sidebar"><IconButton aria-label="Hide sidebar" size="xs" variant="ghost" icon={<HamburgerIcon />} onClick={props.onHide} /></Tooltip></HStack>
    <Box p={3}>
      <InputGroup size="sm"><InputLeftElement pointerEvents="none"><SearchIcon color="var(--muted)" boxSize={3} /></InputLeftElement><Input ref={props.searchRef} aria-label="Filter exams" placeholder={archived ? 'Search archive…' : 'Find an exam…'} value={search} onChange={event => props.onSearch(event.target.value)} bg="var(--chrome)" borderColor="var(--border)" fontSize="xs" /></InputGroup>
      <Button mt={3} w="full" size="sm" variant="ghost" justifyContent="flex-start" leftIcon={<EditIcon />} onClick={props.onCreateExam}>Create exam</Button>
      <Button mt={1} w="full" size="sm" variant="ghost" justifyContent="flex-start" leftIcon={<AddIcon />} onClick={props.onImport}>Import exam</Button>
      <Button mt={1} w="full" size="sm" variant="ghost" justifyContent="flex-start" leftIcon={<FolderGlyph />} onClick={props.onImportCollection}>Import collection</Button>
    </Box>
    <HStack px={3} gap={1} pb={3}><Button aria-label="Show library" size="xs" variant="ghost" bg={dropTarget === 'root' || !archived && !selectedFolder ? 'var(--accent-soft)' : undefined} onClick={() => props.onView('library')} onDragOver={event => { if (!archived) dragOver(event, 'root'); }} onDragLeave={leaveTarget} onDrop={event => { if (!archived) dropped(event); }}>Library</Button><Button aria-label="Show archive" size="xs" variant="ghost" bg={dropTarget === 'archive-root' || archived && !selectedFolder ? 'var(--accent-soft)' : undefined} leftIcon={<ArchiveGlyph />} onDragOver={event => { if (archived) dragOver(event, 'archive-root'); }} onDragLeave={leaveTarget} onDrop={event => { if (archived) dropped(event); }} onClick={() => props.onView('archive')}>Archive <Badge ml={1} fontSize="9px">{archiveCount}</Badge></Button></HStack>
    <HStack px={4} pb={2} fontSize="10px" color="var(--muted)" letterSpacing=".08em"><Text flex="1">{archived ? 'ARCHIVED' : 'EXAMS'}</Text><Tooltip label="New folder"><IconButton aria-label="New folder" size="xs" variant="ghost" icon={<AddIcon />} onClick={() => props.onOrganize({ type: 'create', parentId: selectedFolder, archived })} /></Tooltip></HStack>
    <Stack spacing={1} px={2} overflowY="auto" flex="1" minH={0}>
      {sortFolders(visibleFolders.filter(folder => !folder.parentId || !folderIds.has(folder.parentId))).map(folder => renderFolder(folder, 0))}
      {exams.filter(exam => !exam.folderId || !folderIds.has(exam.folderId)).map(exam => renderExam(exam, 0))}
      {!exams.length && !visibleFolders.some(matchingFolder) && <Text px={3} py={3} fontSize="xs" color="var(--muted)" lineHeight="1.8">{query ? 'No matching exams or folders.' : archived ? 'Archived exams and folders will appear here.' : 'Your exams will appear here after you create or import them.'}</Text>}
      {dragging && <Flex aria-label={archived ? 'Archive root drop area' : 'Library root drop area'} flex="1" minH="88px" direction="column" align="center" justify="center" gap={1} mx={1} mb={2} mt={3} p={3} border="1px dashed" borderColor={dropTarget === rootTarget ? 'var(--accent)' : 'var(--border)'} borderRadius="md" bg={dropTarget === rootTarget ? 'var(--accent-soft)' : undefined}
        onDragOver={event => dragOver(event, rootTarget)} onDragLeave={leaveTarget} onDrop={event => dropped(event)}>
        <Text fontSize="xs" fontWeight="500" color={dropTarget === rootTarget ? 'var(--accent-text)' : 'var(--muted)'}>{archived ? 'Archive root' : 'Library root'}</Text>
        <Text fontSize="10px" color="var(--muted)" textAlign="center">Drop exams or folders here</Text>
      </Flex>}
    </Stack>
    <Box p={3} borderTop="1px solid var(--border)"><Text fontSize="10px" color="var(--muted)" lineHeight="1.6">{'Drag into a folder or drop below the list to move to root.'}</Text></Box>
  </Flex>;
}
