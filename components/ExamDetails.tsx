import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, DeleteIcon, DownloadIcon, EditIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, HStack, Table, Tbody, Td, Text, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import { currentAttempts, percentage, SavedExam } from "../lib/study";
import ExamVersions from "./ExamVersions";
import type { GitVersion } from "../lib/git";
import { exportExam } from "../lib/export";
import { modeLabel } from "../lib/run";

export default function ExamDetails({ exam, onDelete, onEdit, onEnsureHistory, onSwitchVersion, isArchived = false }: {
  exam: SavedExam; onDelete: () => void; onEdit: () => void;
  onEnsureHistory: (id: string) => Promise<void>;
  onSwitchVersion: (id: string, version: GitVersion) => Promise<void>;
  isArchived?: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();
  const attempts = currentAttempts(exam);
  const latest = attempts[0];
  const best = attempts.length ? Math.max(...attempts.map(percentage)) : undefined;
  return (
    <Box mb={6} pb={4} borderBottom="1px solid #303030">
      <Flex gap={3} justify="space-between" align="center" flexWrap="wrap">
        <HStack spacing={4} fontSize="xs" color="#999" flexWrap="wrap">
          <Text>{exam.attempts.length} completed {exam.attempts.length === 1 ? "attempt" : "attempts"}</Text>
          <Text>Version {exam.revision}</Text>
          {latest && <Text>Latest <Text as="span" color="purple.200">{percentage(latest)}%</Text></Text>}
          {best !== undefined && <Text>Best <Text as="span" color="purple.200">{best}%</Text></Text>}
        </HStack>
        <HStack spacing={1} flexWrap="wrap" minW={0}>
          <Button size="xs" variant="ghost" leftIcon={<DownloadIcon />} isLoading={exporting} onClick={async () => {
            setExporting(true);
            try { if (await exportExam(exam.title, exam.json)) toast({ title: "Exam exported", description: "Images are embedded in the JSON for offline sharing. Your progress and scores are kept private.", status: "success", duration: 4000, isClosable: true }); }
            catch (cause) { toast({ title: "Could not export exam", description: cause instanceof Error ? cause.message : "Try choosing another location.", status: "error", duration: 5000, isClosable: true }); }
            finally { setExporting(false); }
          }}>Export JSON</Button>
          <Button size="xs" variant="ghost" aria-expanded={showVersions} onClick={() => setShowVersions((show) => !show)}>Versions</Button>
          <Button size="xs" variant="ghost" leftIcon={<EditIcon />} isDisabled={isArchived} onClick={onEdit}>Edit exam</Button>
          <Button size="xs" variant="ghost" rightIcon={showHistory ? <ChevronUpIcon /> : <ChevronDownIcon />} onClick={() => setShowHistory((show) => !show)} aria-expanded={showHistory}>Score history</Button>
          <Button size="xs" variant="ghost" color="red.300" leftIcon={<DeleteIcon />} onClick={onDelete}>Delete exam</Button>
        </HStack>
      </Flex>
      {showVersions && <ExamVersions exam={exam} onEnsure={onEnsureHistory} onSwitch={onSwitchVersion} readOnly={isArchived} />}
      {showHistory && <Box mt={4} maxH="240px" overflowY="auto" role="region" aria-label="Score history">
        {exam.attempts.length ? <Table size="sm"><Thead><Tr><Th>Completed</Th><Th>Version</Th><Th>Mode</Th><Th isNumeric>Correct</Th><Th isNumeric>Score</Th></Tr></Thead><Tbody>
          {exam.attempts.map((attempt) => <Tr key={attempt.id}><Td fontSize="xs">{new Date(attempt.completedAt).toLocaleString()}</Td><Td fontSize="xs">{attempt.revision ?? 1}</Td><Td fontSize="xs">{modeLabel(attempt.mode)}</Td><Td isNumeric>{attempt.score} / {attempt.total}</Td><Td isNumeric color="purple.200">{percentage(attempt)}%</Td></Tr>)}
        </Tbody></Table> : <Text color="#888" fontSize="xs" py={3}>Finish an attempt to record your first score. Unanswered questions count as incorrect.</Text>}
      </Box>}
    </Box>
  );
}
