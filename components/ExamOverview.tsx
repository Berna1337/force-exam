import { useState } from "react";
import { Badge, Box, Button, Heading, HStack, Progress, Radio, RadioGroup, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { ArrowForwardIcon, RepeatIcon } from "@chakra-ui/icons";
import { currentAttempts, percentage, type SavedExam } from "../lib/study";
import type { GitVersion } from "../lib/git";
import RunSettingsEditor from "./RunSettings";
import type { RunSettings } from "../lib/session";
import { normalizeExam } from "../lib/exam";
import FocusedPractice from "./FocusedPractice";
import ExamDetails from "./ExamDetails";
import { modeLabel, runMode, sessionLabel, type FocusKind, type RunMode } from "../lib/run";

export default function ExamOverview({ exam, onStudy, onPassingScoreChange, onEdit, onDelete, onEnsureHistory, onSwitchVersion, onFocused, onResumeFocused, isArchived = false }: {
  exam: SavedExam; onStudy: (fresh: boolean, mode: RunMode, settings?: RunSettings) => void; onEdit: () => void; onDelete: () => void;
  onPassingScoreChange: (value?: number) => void;
  onEnsureHistory: (id: string) => Promise<void>;
  onSwitchVersion: (id: string, version: GitVersion) => Promise<void>;
  onFocused: (kind: FocusKind, ids: string[]) => void;
  onResumeFocused: () => void;
  isArchived?: boolean;
}) {
  const attempts = currentAttempts(exam);
  const [selectedMode, setSelectedMode] = useState<RunMode>(runMode(exam.progress?.mode));
  const [sessionSettings, setSessionSettings] = useState<RunSettings>({});
  const settings = { ...sessionSettings, passingScore: exam.passingScore };
  const updateSettings = ({ passingScore, ...rest }: RunSettings) => {
    setSessionSettings(rest);
    if (passingScore !== exam.passingScore) onPassingScoreChange(passingScore);
  };
  let topics: string[] = [];
  try { topics = Array.from(new Set(normalizeExam(JSON.parse(exam.json)).questions.flatMap(question => question.tags ?? []))).sort(); } catch {}
  const latest = attempts[0];
  const answered = Object.keys(exam.progress?.answers ?? {}).length;
  let description: string | undefined;
  try {
    const value = JSON.parse(exam.json).description;
    if (typeof value === "string") description = value;
  } catch { /* Opening a study session reports schema errors. */ }
  const action = !exam.progress ? selectedMode === "exam" ? "Start exam" : "Start practice" : exam.progress.isReviewing ? "View last result" : runMode(exam.progress.mode) === "exam" ? "Resume exam" : "Resume practice";
  return <Stack spacing={6} aria-label="Exam overview" maxW="800px" mx="auto">
    <Box>
      <HStack spacing={3} mb={3}><Text fontSize="10px" fontWeight="600" color="var(--accent-text)" letterSpacing=".12em">YOUR NEXT SESSION</Text><Badge colorScheme="purple" borderRadius="full" px={2} title={exam.gitCommit}>Version {exam.revision}</Badge></HStack>
      <Heading fontSize={{ base: "26px", md: "34px" }} fontWeight="500" letterSpacing="-.03em">{exam.title}</Heading>
      {description && <Text color="var(--muted)" fontSize="sm" mt={3} lineHeight="1.8" whiteSpace="pre-wrap">{description}</Text>}
      <HStack spacing={5} mt={4} color="var(--muted)" fontSize="xs" flexWrap="wrap"><Text>{exam.questionCount} questions</Text><Text>{attempts.length} completed</Text></HStack>
    </Box>
    <SimpleGrid aria-label="Scores by mode" columns={{ base: 1, sm: 2 }} gap={3}>
      {(["practice", "exam"] as const).map(mode => {
        const runs = attempts.filter(attempt => runMode(attempt.mode) === mode);
        return <Box key={mode} p={4} border="1px solid var(--border)" borderRadius="lg" bg="var(--surface)">
          <Text fontSize="sm" color="var(--text)" fontWeight="500">{modeLabel(mode)}</Text>
          <HStack mt={3} spacing={6} align="start"><Box><Text fontSize="11px" color="var(--muted)">Latest score</Text><Text fontSize="28px" fontWeight="600" color={runs[0] ? "var(--success)" : "var(--muted)"}>{runs[0] ? `${percentage(runs[0])}%` : "—"}</Text></Box><Box><Text fontSize="11px" color="var(--muted)">Best score</Text><Text fontSize="28px" fontWeight="600" color={runs.length ? "var(--accent-text)" : "var(--muted)"}>{runs.length ? `${Math.max(...runs.map(percentage))}%` : "—"}</Text></Box></HStack>
          <Text mt={2} fontSize="11px" color="var(--muted)">{runs.length ? `${runs[0].score}/${runs[0].total} correct last time · ${runs.length} completed` : "Complete a full attempt to record a score."}</Text>
        </Box>;
      })}
    </SimpleGrid>
    {latest && <Text fontSize="xs" color="var(--muted)" mt={-3}>Latest score: {latest.score}/{latest.total} ({percentage(latest)}%) · {new Date(latest.completedAt).toLocaleString()}</Text>}
    {isArchived && <Box p={4} bg="var(--warning-soft)" border="1px solid var(--warning)" borderRadius="lg"><Text fontSize="sm" color="var(--warning)">This exam is archived. Its scores, versions, and saved progress are kept. Restore it to study or edit again.</Text></Box>}
    {!isArchived && <Box className="study-card" p={{ base: 4, md: 6 }} borderRadius="xl">
      <Heading size="sm" fontWeight="500" mb={4}>{exam.progress ? exam.progress.isReviewing ? "Ready for another round?" : "Pick up where you left off" : "Make a little progress"}</Heading>
      {exam.progress && <Box mb={5}>
        <Text fontSize="xs" color="var(--muted)">{sessionLabel(exam.progress.mode, undefined, exam.progress.pool)} · {answered} of {exam.progress.poolQuestionIds?.length ?? exam.questionCount} answered{!exam.progress.isReviewing ? ` · Question ${exam.progress.currentIndex + 1}` : " · Completed"}</Text>
        <Progress aria-label="Saved session progress" mt={3} value={answered / Math.max(1, exam.progress.poolQuestionIds?.length ?? exam.questionCount) * 100} size="xs" colorScheme="teal" borderRadius="full" />
        {!!exam.progress.flaggedQuestions?.length && <Text fontSize="xs" color="var(--warning)" mt={2}>{exam.progress.flaggedQuestions.length} marked for review</Text>}
      </Box>}
      <Text fontSize="xs" color="var(--muted)" mb={3}>{exam.progress ? "Mode for a new attempt" : "Choose your pace"}</Text>
      <RadioGroup aria-label="Run mode" value={selectedMode} onChange={value => setSelectedMode(value as RunMode)}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          {(["practice", "exam"] as const).map(mode => <Box key={mode} data-run-mode-card={mode} p={4} bg={selectedMode === mode ? "var(--accent-soft)" : "var(--surface)"} border="1px solid" borderColor={selectedMode === mode ? "var(--accent-text)" : "var(--border)"} borderRadius="lg" cursor="pointer" onClick={() => setSelectedMode(mode)} transition="background .18s, border-color .18s" _focusWithin={{ boxShadow: "0 0 0 2px var(--chakra-colors-purple-400)" }}>
            <Radio colorScheme="purple" value={mode}>{modeLabel(mode)}</Radio>
            <Text fontSize="xs" color="var(--muted)" mt={2}>{mode === "practice" ? "Questions follow the original exam order." : "Questions are shuffled once for each new attempt."}</Text>
          </Box>)}
        </SimpleGrid>
      </RadioGroup>
      <RunSettingsEditor mode={selectedMode} count={exam.questionCount} topics={topics} value={settings} onChange={updateSettings} />
      <HStack flexWrap="wrap" spacing={3} mt={5}>
        <Button className="primary-action" colorScheme="purple" size="sm" rightIcon={<ArrowForwardIcon />} onClick={() => onStudy(false, exam.progress ? runMode(exam.progress.mode) : selectedMode, settings)}>{action}</Button>
        {exam.progress && <Button size="sm" variant="outline" leftIcon={<RepeatIcon />} onClick={() => onStudy(true, selectedMode, settings)}>Start new attempt</Button>}
      </HStack>
      <Text fontSize="11px" color="var(--muted)" mt={3}>{exam.progress ? "A new attempt replaces this session. Completed scores stay in your history." : "Your answers and position save automatically."}</Text>
    </Box>}
    {!isArchived && <>
      <FocusedPractice json={exam.json} progress={exam.progress} onStart={onFocused} />
      {exam.focusedProgress && <Box p={4} border="1px solid var(--border)" borderRadius="lg"><Text fontSize="sm" color="var(--accent-text)">{sessionLabel("practice", exam.focusedProgress.focus)}</Text><Text fontSize="xs" color="var(--muted)" mt={2}>{Object.keys(exam.focusedProgress.answers).length} of {exam.focusedProgress.focusedQuestionIds?.length ?? 0} answered · Scores are separate from full exams.</Text><Button size="sm" mt={3} variant="outline" onClick={onResumeFocused}>{exam.focusedProgress.isReviewing ? "View focused result" : "Resume focused practice"}</Button></Box>}
    </>}
    <ExamDetails exam={exam} onEdit={onEdit} onDelete={onDelete} onEnsureHistory={onEnsureHistory} onSwitchVersion={onSwitchVersion} isArchived={isArchived} />
  </Stack>;
}
