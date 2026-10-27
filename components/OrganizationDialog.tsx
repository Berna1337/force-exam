import { useEffect, useState } from "react";
import { Alert, AlertIcon, Button, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Stack, Text } from "@chakra-ui/react";
import { examArchived, folderArchived, folderContains, folderPath, type ExamFolder, type OrganizationAction } from "../lib/organization";

export default function OrganizationDialog({ action, folders, onClose, onSave }: {
  action: OrganizationAction | null; folders: ExamFolder[]; onClose: () => void; onSave: (name: string, parentId?: string) => void;
}) {
  const [name, setName] = useState(""); const [parent, setParent] = useState(""); const [error, setError] = useState("");
  const archived = action?.type === "create" ? !!action.archived : action?.type === "move-exam" ? examArchived(action.exam, folders) : action && "folder" in action ? folderArchived(folders, action.folder.id) : false;
  useEffect(() => {
    setError(""); setName(action && "folder" in action ? action.folder.name : "");
    const parentId = action?.type === "create" ? action.parentId : action?.type === "move-exam" ? action.exam.folderId : action && "folder" in action ? action.folder.parentId : undefined;
    setParent(parentId && folderArchived(folders, parentId) === archived ? parentId : "");
  }, [action, folders, archived]);
  const title = action?.type === "create" ? "New folder" : action?.type === "rename" ? "Rename folder" : action?.type === "move-folder" ? "Move folder" : "Move exam";
  const targets = folders.filter(folder => folderArchived(folders, folder.id) === archived && !(action?.type === "move-folder" && folderContains(folders, action.folder.id, folder.id))).sort((a, b) => folderPath(folders, a.id).localeCompare(folderPath(folders, b.id)));
  const submit = () => { try { onSave(name, parent || undefined); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update the library."); } };
  return <Modal isOpen={!!action} onClose={onClose} isCentered><ModalOverlay /><ModalContent bg="#252525" mx={4}>
    <ModalHeader>{title}</ModalHeader><ModalCloseButton />
    <ModalBody><Stack spacing={4}>
      {error && <Alert status="error" fontSize="sm"><AlertIcon />{error}</Alert>}
      {(action?.type === "create" || action?.type === "rename") && <FormControl><FormLabel fontSize="sm">Folder name</FormLabel><Input autoFocus aria-label="Folder name" value={name} maxLength={80} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); submit(); } }} /></FormControl>}
      {action?.type !== "rename" && <FormControl><FormLabel fontSize="sm">{action?.type === "create" ? "Parent folder" : "Destination folder"}</FormLabel><Select aria-label="Destination folder" value={parent} onChange={event => setParent(event.target.value)}><option value="">{archived ? "Archive root" : "Library root"}</option>{targets.map(folder => <option key={folder.id} value={folder.id}>{folderPath(folders, folder.id)}</option>)}</Select></FormControl>}
      {action?.type === "move-exam" && <Text fontSize="sm" color="#999">{action.exam.title}</Text>}
    </Stack></ModalBody>
    <ModalFooter gap={3}><Button variant="ghost" onClick={onClose}>Cancel</Button><Button colorScheme="purple" onClick={submit}>{action?.type === "create" ? "Create folder" : action?.type === "rename" ? "Rename folder" : "Move"}</Button></ModalFooter>
  </ModalContent></Modal>;
}
