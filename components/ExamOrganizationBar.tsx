import { Badge, Button, HStack, Text } from "@chakra-ui/react";
import { ArchiveGlyph, FolderGlyph } from "./LibrarySidebar";

export default function ExamOrganizationBar({ folder, archived, onMove, onArchive }: {
  folder: string; archived: boolean; onMove: () => void; onArchive: () => void;
}) {
  return <HStack mb={6} pb={3} borderBottom="1px solid #303030" gap={2} flexWrap="wrap">
    <FolderGlyph /><Text fontSize="xs" color="#999" flex="1" minW={0} noOfLines={1} title={folder}>{folder}</Text>
    {archived && <Badge colorScheme="orange" fontSize="10px">Archived</Badge>}
    <Button size="xs" variant="ghost" onClick={onMove}>Move to folder</Button>
    <Button size="xs" variant="ghost" leftIcon={<ArchiveGlyph />} color={archived ? "purple.200" : "#999"} onClick={onArchive}>{archived ? "Restore exam" : "Archive exam"}</Button>
  </HStack>;
}
