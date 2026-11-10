import { useState } from 'react';
import { Alert, AlertIcon, Button, Checkbox, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text } from '@chakra-ui/react';
import { readLibrary, LIBRARY_KEY } from '../lib/study';
import { readFolders, FOLDERS_KEY } from '../lib/organization';
import { normalizeExam } from '../lib/exam';
export type LibraryBackup = { format: 'force-exam-backup'; version: 1; createdAt: string; storage: Record<string, string>; files: { path: string; data: string; sha256: string }[] };
declare global { interface Window { examBackup?: { export: (storage: Record<string, string>) => Promise<boolean>; read: () => Promise<LibraryBackup | null>; begin: (backup: LibraryBackup) => Promise<string>; finish: (token: string, commit: boolean) => Promise<void> } } }
export default function BackupDialog({ onClose, onExport, onRestore }: { onClose: () => void; onExport: () => Promise<void>; onRestore: (backup: LibraryBackup) => Promise<void> }) {
  const [backup, setBackup] = useState<LibraryBackup>(); const [confirmed, setConfirmed] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [count, setCount] = useState(0);
  const action = async (fn: () => Promise<void>) => { setBusy(true); setError(''); try { await fn(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Backup operation failed.'); } finally { setBusy(false); } };
  return <Modal isOpen isCentered closeOnOverlayClick={!busy} onClose={busy ? () => {} : onClose}><ModalOverlay /><ModalContent bg="var(--surface)" mx={4}><ModalHeader>Backup and restore</ModalHeader><ModalCloseButton isDisabled={busy} /><ModalBody><Stack spacing={4}>
    <Text fontSize="sm" color="var(--muted)">Back up the complete library: exams, images, folders, archives, scores, sessions, review marks, editor drafts, and all local versions.</Text>
    <Text fontSize="xs" color="var(--warning)">Backups contain private study data and are not encrypted. Use collection exports when sharing exams.</Text>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {!window.examBackup ? <Text>Complete backups are available in the desktop app.</Text> : <>
      <Button variant="outline" isLoading={busy} onClick={() => action(onExport)}>Create library backup</Button>
      <Button variant="outline" isDisabled={busy} onClick={() => action(async () => {
        const value = await window.examBackup!.read(); if (!value) return;
        const exams = readLibrary(value.storage[LIBRARY_KEY]); const raw = JSON.parse(value.storage[LIBRARY_KEY]);
        if (!Array.isArray(raw) || raw.length !== exams.length) throw new Error('The backup library is invalid.');
        const folders = readFolders(value.storage[FOLDERS_KEY]); if (JSON.parse(value.storage[FOLDERS_KEY]).length !== folders.length) throw new Error('The backup folders are invalid.');
        for (const exam of exams) normalizeExam(JSON.parse(exam.json));
        setCount(exams.length); setBackup(value); setConfirmed(false);
      })}>Choose backup to restore</Button>
      {backup && <><Text>{count} exams · {backup.files.length} version files · {new Date(backup.createdAt).toLocaleString()}</Text><Checkbox isDisabled={busy} isChecked={confirmed} onChange={event => setConfirmed(event.target.checked)}>Replace my current library, drafts, and version history with this backup.</Checkbox><Button colorScheme="orange" isLoading={busy} isDisabled={!confirmed} onClick={() => action(async () => { await onRestore(backup); onClose(); })}>Restore backup</Button></>}
    </>}
  </Stack></ModalBody><ModalFooter><Button isDisabled={busy} onClick={onClose}>Close</Button></ModalFooter></ModalContent></Modal>;
}
