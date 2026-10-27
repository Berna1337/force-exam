import { useEffect, useRef, useState } from "react";
import { Badge, Box, Button, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import type { GitVersion } from "../lib/git";
import type { SavedExam } from "../lib/study";
import ExamComparison from "./ExamComparison";

export default function ExamVersions({ exam, onEnsure, onSwitch, readOnly = false }: {
  exam: SavedExam;
  onEnsure: (id: string) => Promise<void>;
  onSwitch: (id: string, version: GitVersion) => Promise<void>;
  readOnly?: boolean;
}) {
  const [versions, setVersions] = useState<GitVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  const [comparing, setComparing] = useState(false);
  const ensure = useRef(onEnsure);
  ensure.current = onEnsure;
  useEffect(() => {
    let active = true;
    setLoading(true);
    const load = async () => {
      if (!window.examGit) throw new Error("Git history is available in the desktop app.");
      await ensure.current(exam.id);
      const history = await window.examGit.list(exam.id);
      if (active) { setVersions(history); setError(""); }
    };
    void load().catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load Git history."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [exam.id, exam.gitCommit]);

  return <Box role="region" aria-label="Exam versions" mt={4} p={4} bg="#202020" borderRadius="md" border="1px solid #383838">
    <HStack justify="space-between" mb={2} flexWrap="wrap"><Text fontSize="sm" fontWeight="500">Git version history</Text><Button size="xs" variant="outline" isDisabled={loading || versions.length < 2} onClick={() => setComparing(true)}>Compare versions</Button></HStack>
    <Text fontSize="xs" color="#999" lineHeight="1.8" mb={3}>Switch snapshots without deleting newer ones. Each question version keeps its own saved progress and scores. Editing an older snapshot creates a new saved commit.</Text>
    {readOnly && <Text fontSize="xs" color="#bba984" mb={3}>Restore this exam to switch its selected version. Comparisons are still available in the archive.</Text>}
    {loading && <Spinner size="sm" />}
    {error && <Text role="alert" color="red.300" fontSize="xs" mb={3}>{error}</Text>}
    <Stack spacing={1} maxH="280px" overflowY="auto">
      {versions.map((version) => <HStack key={version.oid} py={3} gap={3} borderTop="1px solid #333" align="center">
        <Box flex="1" minW={0}><HStack flexWrap="wrap"><Text fontSize="xs">Version {version.revision}</Text><Text fontFamily="mono" fontSize="10px" color="#a78bfa">{version.oid.slice(0, 7)}</Text>{exam.gitCommit === version.oid && <Badge fontSize="9px" colorScheme="purple">Current</Badge>}</HStack>
          <Text fontSize="11px" color="#888" mt={1}>{new Date(version.createdAt).toLocaleString()}{version.basedOn ? ` · Based on ${version.basedOn.slice(0, 7)}` : " · Initial snapshot"}</Text>
          <Text fontSize="xs" mt={1} color="#aaa" noOfLines={1}>{version.message}</Text>
        </Box>
        <Button size="xs" variant="outline" aria-label={`Switch to ${version.oid.slice(0, 7)}`} isDisabled={readOnly || switching || exam.gitCommit === version.oid} onClick={async () => {
          setSwitching(true); setError("");
          try { await onSwitch(exam.id, version); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "Could not switch versions."); }
          finally { setSwitching(false); }
        }}>Switch</Button>
      </HStack>)}
    </Stack>
    <Text color="#777" fontSize="10px" mt={3}>Snapshots begin when Git tracking is added. Earlier score-only versions may not have saved question content.</Text>
    <ExamComparison examId={exam.id} currentCommit={exam.gitCommit} versions={versions} isOpen={comparing} onClose={() => setComparing(false)} />
  </Box>;
}
