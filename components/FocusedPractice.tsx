import { useMemo } from "react";
import { Box, Button, Heading, HStack, Text } from '@chakra-ui/react';
import { normalizeExam } from '../lib/exam';
import { focusedQuestions, type FocusKind } from '../lib/run';
import type { ExamProgress } from '../lib/study';
export default function FocusedPractice({ json, progress, onStart }: { json: string; progress?: ExamProgress; onStart: (kind: FocusKind, ids: string[]) => void }) {
  const questions = useMemo(() => { try { return normalizeExam(JSON.parse(json)).questions; } catch { return undefined; } }, [json]);
  if (!progress || !questions) return null;
  return <Box p={4} border="1px solid var(--border)" borderRadius="md" aria-label="Focused practice">
    <Heading size="xs">Focused practice</Heading>
    <Text fontSize="xs" color="var(--muted)" mt={2}>Practice a smaller set in the original question order. Your original session and scores are kept. Starting a set replaces your previous focused session.</Text>
    <HStack mt={3} spacing={3} flexWrap="wrap">{(['missed', 'marked'] as const).map(kind => {
      const ids = focusedQuestions(questions, progress, kind);
      return <Button key={kind} size="sm" variant="outline" isDisabled={!ids.length} onClick={() => onStart(kind, ids)}>{kind === 'missed' ? 'Practice missed questions' : 'Practice marked questions'} ({ids.length})</Button>;
    })}</HStack>
    {!progress.isReviewing && <Text fontSize="xs" color="var(--muted)" mt={2}>Missed questions become available after finishing the session.</Text>}
  </Box>;
}
