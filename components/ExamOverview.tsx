import { useState } from "react";
import { Badge, Box, Button, Flex, Heading, HStack, Progress, Radio, RadioGroup, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { ArrowForwardIcon, RepeatIcon } from "@chakra-ui/icons";
import { currentAttempts, percentage, type SavedExam } from "../lib/study";
import type { GitVersion } from "../lib/git";
import ExamDetails from "./ExamDetails";
import { modeLabel, runMode, type RunMode } from "../lib/run";

export default function ExamOverview({ exam, onStudy, onEdit, onDelete, onEnsureHistory, onSwitchVersion, isArchived = false }: {
  exam: SavedExam; onStudy: (fresh: boolean, mode: RunMode) => void; onEdit: () => void; onDelete: () => void;
  onEnsureHistory: (id: string) => Promise<void>;
  onSwitchVersion: (id: string, version: GitVersion) => Promise<void>;
  isArchived?: boolean;
}) {
  const attempts = currentAttempts(exam);
  const [selectedMode, setSelectedMode] = useState<RunMode>(runMode(exam.progress?.mode));
  const latest = attempts[0];
  const best = attempts.length ? Math.max(...attempts.map(percentage)) : undefined;
  const answered = Object.keys(exam.progress?.answers ?? {}).length;
  let description: string | undefined;
  try {
    const value = JSON.parse(exam.json).description;
    if (typeof value === "string") description = value;
  } catch { /* Opening a study session reports schema errors. */ }
  const action = !exam.progress ? selectedMode === "exam" ? "Start exam" : "Start practice" : exam.progress.isReviewing ? "View last result" : runMode(exam.progress.mode) === "exam" ? "Resume exam" : "Resume practice";
  return <Stack spacing={7} aria-label="Exam overview">
    <Box>
      <HStack spacing={3} mb={4}><Text fontFamily="mono" fontSize="xs" color="purple.300" letterSpacing=".1em">EXAM OVERVIEW</Text><Badge colorScheme="purple">Version {exam.revision}</Badge>{exam.gitCommit && <Text fontFamily="mono" color="#777" fontSize="10px">{exam.gitCommit.slice(0, 7)}</Text>}</HStack>
      <Heading fontSize={{ base: "26px", md: "34px" }} fontWeight="500" letterSpacing="-.03em">{exam.title}</Heading>
      {description && <Text color="#999" fontSize="sm" mt={3} lineHeight="1.9" whiteSpace="pre-wrap">{description}</Text>}
      <Text color="#777" fontSize="xs" mt={3}>Choose when to study, manage your exam, or explore its history.</Text>
    </Box>
    {isArchived && <Box p={4} bg="#332d20" border="1px solid #514632" borderRadius="md"><Text fontSize="sm" color="#d2bd92">This exam is archived. Its scores, versions, and saved progress are kept. Restore it to study or edit again.</Text></Box>}
    <ExamDetails exam={exam} onEdit={onEdit} onDelete={onDelete} onEnsureHistory={onEnsureHistory} onSwitchVersion={onSwitchVersion} isArchived={isArchived} />
    {!isArchived && <Box>
      <Text fontSize="xs" color="#999" mb={3}>{exam.progress ? "Mode for a new attempt" : "Choose a mode"}</Text>
      <RadioGroup aria-label="Run mode" value={selectedMode} onChange={(value) => setSelectedMode(value as RunMode)}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          {(["practice", "exam"] as const).map((mode) => <Box key={mode} data-run-mode-card={mode} p={4} bg="#252525" border="1px solid" borderColor={selectedMode === mode ? "purple.400" : "#3a3a3a"} borderRadius="md" cursor="pointer" onClick={() => setSelectedMode(mode)} _focusWithin={{ boxShadow: "0 0 0 2px var(--chakra-colors-purple-400)" }}>
            <Radio colorScheme="purple" value={mode}>{modeLabel(mode)}</Radio>
            <Text fontSize="xs" color="#999" mt={2}>{mode === "practice" ? "Questions follow the original exam order." : "Questions are shuffled once for each new attempt."}</Text>
          </Box>)}
        </SimpleGrid>
      </RadioGroup>
      <HStack flexWrap="wrap" spacing={3} mt={4}>
        <Button colorScheme="purple" size="sm" rightIcon={<ArrowForwardIcon />} onClick={() => onStudy(false, exam.progress ? runMode(exam.progress.mode) : selectedMode)}>{action}</Button>
        {exam.progress && <Button size="sm" variant="outline" leftIcon={<RepeatIcon />} onClick={() => onStudy(true, selectedMode)}>Start new attempt</Button>}
      </HStack>
    </Box>}
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
      {[{ label: "QUESTIONS", value: exam.questionCount }, { label: "ATTEMPTS ON THIS VERSION", value: attempts.length }, { label: "BEST SCORE", value: best === undefined ? "—" : `${best}%` }].map((stat) => <Box key={stat.label} p={5} borderRadius="md" bg="#252525" border="1px solid #353535"><Text fontSize="10px" color="#888" letterSpacing=".05em">{stat.label}</Text><Text color="purple.200" mt={3} fontSize="28px">{stat.value}</Text></Box>)}
    </SimpleGrid>
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
      {(["practice", "exam"] as const).map((mode) => {
        const runs = attempts.filter((attempt) => runMode(attempt.mode) === mode);
        return <Box key={mode} p={4} border="1px solid #333" borderRadius="md"><Text fontSize="sm" color="purple.200">{modeLabel(mode)}</Text><Text fontSize="xs" color="#999" mt={2}>{runs.length} completed · Best {runs.length ? `${Math.max(...runs.map(percentage))}%` : "—"} · Latest {runs[0] ? `${percentage(runs[0])}%` : "—"}</Text></Box>;
      })}
    </SimpleGrid>
    <Box p={5} bg="#232323" border="1px solid #333" borderRadius="md">
      <Flex align="center" justify="space-between" gap={3} flexWrap="wrap"><Heading size="xs">{exam.progress ? exam.progress.isReviewing ? "Last session completed" : "Your saved session" : "Ready when you are"}</Heading>{exam.progress && <Text fontSize="11px" color="#888">Saved {new Date(exam.progress.updatedAt).toLocaleString()}</Text>}</Flex>
      {!exam.progress ? <Text fontSize="sm" color="#999" mt={3}>{isArchived ? "No saved session for this version. Restore the exam to start studying." : "Start practice to begin a session. Your answers and position will save automatically."}</Text> : <>
        <Text fontSize="sm" color="#aaa" mt={3}>{modeLabel(exam.progress.mode)} · {answered} of {exam.questionCount} answered{!exam.progress.isReviewing ? ` · Continue at question ${exam.progress.currentIndex + 1}` : ""}</Text>
        <Progress mt={3} value={answered / exam.questionCount * 100} size="xs" colorScheme="purple" borderRadius="full" />
        <Text fontSize="xs" color="#888" mt={3}>{isArchived ? "This saved session will be available after restoration." : "Starting a new attempt replaces this saved session. Completed scores stay in your history."}</Text>
      </>}
      {latest && <Text fontSize="xs" color="#999" mt={4}>Latest score: {latest.score}/{latest.total} ({percentage(latest)}%) · {new Date(latest.completedAt).toLocaleString()}</Text>}
    </Box>
  </Stack>;
}
