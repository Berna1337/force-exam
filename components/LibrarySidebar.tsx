import { useState, type DragEvent, type RefObject } from "react";
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
  const [dropTarget, setDropTarget] = useState<string>();
  const archived = view === "archive";
  const visibleFolders = folders.filter(folder => folderArchived(folders, folder.id) === archived);
  const folderIds = new Set(visibleFolders.map(folder => folder.id));
  const query = search.toLowerCase();
  const exams = library.filter(exam => examArchived(exam, folders) === archived &&
    (exam.title.toLowerCase().includes(query) || folderPath(folders, exam.folderId).toLowerCase().includes(query)));
  const matchingFolder = (folder: ExamFolder) => !query || folderPath(folders, folder.id).toLowerCase().includes(query) ||
    exams.some(exam => folderContains(folders, folder.id, exam.folderId)) || visibleFolders.some(child => folderContains(folders, folder.id, child.id) && folderPath(folders, child.id).toLowerCase().includes(query));
  const sortFolders = (items: ExamFolder[]) => items.sort((a, b) => a.name.localeCompare(b.name));
  const dropped = (event: DragEvent, folderId?: string) => {
    event.preventDefault(); event.stopPropagation(); setDropTarget(undefined);
    const examId = event.dataTransfer.getData('application/x-force-exam-exam');
    const folder = event.dataTransfer.getData('application/x-force-exam-folder');
    if (examId) props.onDropExam(examId, folderId);
    else if (folder) props.onDropFolder(folder, folderId);
  };
  const dragOver = (event: DragEvent, id: string) => {
    if (!event.dataTransfer.types.some(type => type.startsWith('application/x-force-exam-'))) return;
    event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'move'; setDropTarget(id);
  };
  const menu = (label: string, children: React.ReactNode) => <Menu><MenuButton as={IconButton} aria-label={label} size="xs" variant="ghost" color="#999" icon={<Text fontSize="16px">⋯</Text>} /><Portal><MenuList bg="#252525" borderColor="#444" fontSize="xs">{children}</MenuList></Portal></Menu>;
  const renderExam = (exam: SavedExam, depth: number) => <HStack key={exam.id} spacing={0} ml={depth * 3} borderRadius="md" bg={props.activeExam === exam.id ? "#37303f" : "transparent"}
    draggable onDragStart={event => { event.stopPropagation(); event.dataTransfer.setData('application/x-force-exam-exam', exam.id); event.dataTransfer.effectAllowed = 'move'; }}>
    <Button variant="ghost" flex="1" minW={0} h="auto" minH="44px" py={2} px={3} justifyContent="flex-start" fontWeight="400" color={props.activeExam === exam.id ? "#d2b7fa" : "#b5b5b5"} onClick={() => props.onOpen(exam)}>
      <HStack w="full" spacing={2}><Text color="#888" fontSize="sm">▤</Text><Box flex="1" minW={0} textAlign="left"><Text fontSize="xs" noOfLines={1}>{exam.title}</Text><Text fontSize="10px" color="#888" mt={1}>{archived && exam.folderId && !folderIds.has(exam.folderId) ? folderPath(folders, exam.folderId) : exam.progress && !exam.progress.isReviewing ? `${Object.keys(exam.progress.answers).length}/${exam.questionCount} answered` : `${exam.questionCount} questions`}</Text></Box></HStack>
    </Button>
    {menu(`Actions for ${exam.title}`, <>
      <MenuItem bg="#252525" onClick={() => props.onOpen(exam)}>Open overview</MenuItem>
      {!archived && <MenuItem bg="#252525" icon={<EditIcon />} onClick={() => props.onEdit(exam)}>Edit exam</MenuItem>}
      <MenuItem bg="#252525" icon={<FolderGlyph />} onClick={() => props.onOrganize({ type: 'move-exam', exam })}>Move to folder</MenuItem>
      <MenuItem bg="#252525" icon={<ArchiveGlyph />} onClick={() => props.onArchiveExam(exam)}>{archived ? "Restore exam" : "Archive exam"}</MenuItem>
      <MenuItem bg="#252525" color="red.300" icon={<DeleteIcon />} onClick={() => props.onDelete(exam)}>Delete exam</MenuItem>
    </>)}
  </HStack>;
  const renderFolder = (folder: ExamFolder, depth: number): React.ReactNode => {
    if (!matchingFolder(folder)) return null;
    const open = !!query || !collapsed.has(folder.id);
    return <Box key={folder.id}>
      <HStack spacing={0} ml={depth * 3} bg={dropTarget === folder.id ? '#403250' : selectedFolder === folder.id ? '#303030' : undefined} borderRadius="md"
        draggable onDragStart={event => { event.stopPropagation(); event.dataTransfer.setData('application/x-force-exam-folder', folder.id); event.dataTransfer.effectAllowed = 'move'; }}
        onDragOver={event => dragOver(event, folder.id)} onDragLeave={() => setDropTarget(undefined)} onDrop={event => dropped(event, folder.id)}>
        <IconButton aria-label={`${open ? 'Collapse' : 'Expand'} folder ${folder.name}`} size="xs" variant="ghost" icon={open ? <ChevronDownIcon /> : <ChevronRightIcon />} onClick={() => setCollapsed(current => { const next = new Set(current); if (next.has(folder.id)) next.delete(folder.id); else next.add(folder.id); return next; })} />
        <Button variant="ghost" flex="1" minW={0} px={1} size="sm" justifyContent="flex-start" fontWeight="400" leftIcon={<FolderGlyph />} onClick={() => props.onView(view, folder.id)}><Text fontSize="xs" noOfLines={1}>{folder.name}</Text></Button>
        {menu(`Actions for folder ${folderPath(folders, folder.id)}`, <>
          <MenuItem bg="#252525" icon={<AddIcon />} onClick={() => props.onOrganize({ type: 'create', parentId: folder.id, archived })}>New subfolder</MenuItem>
          <MenuItem bg="#252525" onClick={() => props.onExportFolder(folder)}>Export folder</MenuItem>
          <MenuItem bg="#252525" onClick={() => props.onOrganize({ type: 'rename', folder })}>Rename folder</MenuItem>
          <MenuItem bg="#252525" onClick={() => props.onOrganize({ type: 'move-folder', folder })}>Move folder</MenuItem>
          <MenuItem bg="#252525" icon={<ArchiveGlyph />} onClick={() => props.onArchiveFolder(folder)}>{archived ? 'Restore folder' : 'Archive folder'}</MenuItem>
          <MenuItem bg="#252525" color="red.300" isDisabled={!folderEmpty(folders, library, folder.id)} onClick={() => props.onRemoveFolder(folder)}>Remove empty folder</MenuItem>
        </>)}
      </HStack>
      {open && <Box>{sortFolders(visibleFolders.filter(child => child.parentId === folder.id)).map(child => renderFolder(child, depth + 1))}{exams.filter(exam => exam.folderId === folder.id).map(exam => renderExam(exam, depth + 1))}</Box>}
    </Box>;
  };
  const archiveCount = library.filter(exam => examArchived(exam, folders)).length;
  return <Flex as="aside" aria-label="Exam library" w={{ base: '200px', lg: '244px' }} flexShrink={0} direction="column" bg="#232323" borderRight="1px solid #303030">
    <HStack h="48px" minH="48px" px={4} justify="space-between" borderBottom="1px solid #303030"><Text fontWeight="600" fontSize="sm">Force Exam</Text><Tooltip label="Hide sidebar"><IconButton aria-label="Hide sidebar" size="xs" variant="ghost" icon={<HamburgerIcon />} onClick={props.onHide} /></Tooltip></HStack>
    <Box p={3}>
      <InputGroup size="sm"><InputLeftElement pointerEvents="none"><SearchIcon color="#777" boxSize={3} /></InputLeftElement><Input ref={props.searchRef} aria-label="Filter exams" placeholder={archived ? 'Search archive…' : 'Find an exam…'} value={search} onChange={event => props.onSearch(event.target.value)} bg="#1b1b1b" borderColor="#333" fontSize="xs" /></InputGroup>
      <Button mt={3} w="full" size="sm" variant="ghost" justifyContent="flex-start" leftIcon={<EditIcon />} onClick={props.onCreateExam}>Create exam</Button>
      <Button mt={1} w="full" size="sm" variant="ghost" justifyContent="flex-start" leftIcon={<AddIcon />} onClick={props.onImport}>Import exam</Button>
      <Button mt={1} w="full" size="sm" variant="ghost" justifyContent="flex-start" leftIcon={<FolderGlyph />} onClick={props.onImportCollection}>Import collection</Button>
    </Box>
    <HStack px={3} gap={1} pb={3}><Button aria-label="Show library" size="xs" variant="ghost" bg={!archived && !selectedFolder ? '#37303f' : undefined} onClick={() => props.onView('library')} onDragOver={event => { if (!archived) dragOver(event, 'root'); }} onDrop={event => { if (!archived) dropped(event); }}>Library</Button><Button aria-label="Show archive" size="xs" variant="ghost" bg={archived && !selectedFolder ? '#37303f' : undefined} leftIcon={<ArchiveGlyph />} onDragOver={event => { if (archived) dragOver(event, 'archive-root'); }} onDrop={event => { if (archived) dropped(event); }} onClick={() => props.onView('archive')}>Archive <Badge ml={1} fontSize="9px">{archiveCount}</Badge></Button></HStack>
    <HStack px={4} pb={2} fontSize="10px" color="#909090" letterSpacing=".08em"><Text flex="1">{archived ? 'ARCHIVED' : 'EXAMS'}</Text><Tooltip label="New folder"><IconButton aria-label="New folder" size="xs" variant="ghost" icon={<AddIcon />} onClick={() => props.onOrganize({ type: 'create', parentId: selectedFolder, archived })} /></Tooltip></HStack>
    <Stack spacing={1} px={2} overflowY="auto" flex="1" minH={0}>
      {sortFolders(visibleFolders.filter(folder => !folder.parentId || !folderIds.has(folder.parentId))).map(folder => renderFolder(folder, 0))}
      {exams.filter(exam => !exam.folderId || !folderIds.has(exam.folderId)).map(exam => renderExam(exam, 0))}
      {!exams.length && !visibleFolders.some(matchingFolder) && <Text px={3} py={3} fontSize="xs" color="#777" lineHeight="1.8">{query ? 'No matching exams or folders.' : archived ? 'Archived exams and folders will appear here.' : 'Your exams will appear here after you create or import them.'}</Text>}
    </Stack>
    <Box p={3} borderTop="1px solid #303030"><Text fontSize="10px" color="#777" lineHeight="1.6">{'Drag items into folders, or use ⋯ to organize.'}</Text></Box>
  </Flex>;
}
