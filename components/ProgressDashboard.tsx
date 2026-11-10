import { useMemo, useState } from 'react';
import { Box, Heading, HStack, Select, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { percentage, type SavedExam } from '../lib/study';
import { runMode, sessionLabel } from '../lib/run';
export default function ProgressDashboard({ library }: { library: SavedExam[] }) {
  const [examId, setExamId] = useState(''); const [mode, setMode] = useState('all'); const [scope, setScope] = useState('full'); const [version, setVersion] = useState('current');
  const runs = useMemo(() => library.filter(exam => !examId || exam.id === examId).flatMap(exam => exam.attempts.filter(attempt => (version === 'all' || (attempt.revision ?? 1) === exam.revision) && (mode === 'all' || runMode(attempt.mode) === mode) && (scope === 'all' || scope === 'full' && !attempt.focus && !attempt.pool || scope === 'focused' && !!attempt.focus || scope === 'pool' && !!attempt.pool)).map(attempt => ({ ...attempt, examTitle: exam.title }))).sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt)), [library, examId, mode, scope, version]);
  const recent = runs.slice(-20); const mean = runs.length ? Math.round(runs.reduce((sum, attempt) => sum + percentage(attempt), 0) / runs.length) : undefined;
  const topics: Record<string, { correct: number; total: number }> = Object.create(null);
  for (const run of runs) for (const [tag, score] of Object.entries(run.topics ?? {})) {
    if (!score || !Number.isFinite(score.correct) || !Number.isFinite(score.total) || score.total <= 0) continue;
    const target = topics[tag] ?? { correct: 0, total: 0 }; target.correct += score.correct; target.total += score.total; topics[tag] = target;
  }
  return <Stack spacing={6} maxW="900px" mx="auto" aria-label="Progress dashboard"><Heading size="lg">Your progress</Heading><Text color="var(--muted)" fontSize="sm">Track completed attempts and topic accuracy. Full runs, focused practice, and question pools can be inspected separately. Archived exams are included.</Text>
    <SimpleGrid columns={{ base: 1, md: 4 }} gap={3}>
      <Select aria-label="Dashboard exam" value={examId} onChange={event => setExamId(event.target.value)}><option value="">All exams</option>{library.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</Select>
      <Select aria-label="Dashboard mode" value={mode} onChange={event => setMode(event.target.value)}><option value="all">Both modes</option><option value="practice">Practice Mode</option><option value="exam">Exam Mode</option></Select>
      <Select aria-label="Dashboard scope" value={scope} onChange={event => setScope(event.target.value)}><option value="full">Full runs</option><option value="focused">Focused practice</option><option value="pool">Question pools</option><option value="all">All run types</option></Select>
      <Select aria-label="Dashboard version" value={version} onChange={event => setVersion(event.target.value)}><option value="current">Current exam versions</option><option value="all">All versions</option></Select>
    </SimpleGrid>
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>{[['Completed', runs.length], ['Average', mean === undefined ? '—' : `${mean}%`], ['Best', runs.length ? `${Math.max(...runs.map(percentage))}%` : '—']].map(([label, value]) => <Box key={label} p={5} bg="var(--surface)" borderRadius="md"><Text color="var(--muted)" fontSize="xs">{label}</Text><Text color="var(--accent-text)" fontSize="2xl">{value}</Text></Box>)}</SimpleGrid>
    {!runs.length ? <Text color="var(--muted)">Complete an attempt to see results for these filters.</Text> : <>
      <Box border="1px solid var(--border)" p={4} borderRadius="md"><Heading size="xs" mb={4}>Latest {recent.length} attempts · score trend</Heading><Box as="svg" role="img" aria-label="Score trend from zero to one hundred percent" viewBox="0 0 600 180" w="full" maxH="240px">
        {[0, 50, 100].map(value => <g key={value}><line x1="35" x2="590" y1={160 - value * 1.4} y2={160 - value * 1.4} stroke="var(--border)" /><text x="0" y={164 - value * 1.4} fill="var(--muted)" fontSize="12">{value}%</text></g>)}
        <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={recent.map((run, index) => `${45 + index * 530 / Math.max(1, recent.length - 1)},${160 - percentage(run) * 1.4}`).join(' ')} />
        {recent.map((run, index) => <circle key={run.id} cx={45 + index * 530 / Math.max(1, recent.length - 1)} cy={160 - percentage(run) * 1.4} r="4" fill="var(--accent)"><title>{run.examTitle}: {percentage(run)}% · {new Date(run.completedAt).toLocaleString()}</title></circle>)}
      </Box></Box>
      <Box><Heading size="sm" mb={3}>Topics to work on</Heading>{Object.keys(topics).length ? Object.entries(topics).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).map(([tag, score]) => <HStack key={tag} justify="space-between" p={3} borderBottom="1px solid var(--border)"><Text>{tag}</Text><Text color="var(--accent-text)">{Math.round(score.correct / score.total * 100)}% · {score.correct}/{score.total}</Text></HStack>) : <Text color="var(--muted)" fontSize="sm">Add topics to questions in the editor. Topic accuracy is recorded on future attempts; older scores are kept as they are.</Text>}</Box>
      <Box><Heading size="sm" mb={3}>Recent attempts</Heading>{recent.slice().reverse().map(run => <HStack key={run.id} p={3} justify="space-between" borderBottom="1px solid var(--border)"><Box><Text fontSize="sm">{run.examTitle}</Text><Text fontSize="xs" color="var(--muted)">{sessionLabel(run.mode, run.focus, run.pool)} · Version {run.revision ?? 1} · {new Date(run.completedAt).toLocaleString()}</Text></Box><Text color="var(--accent-text)">{run.score}/{run.total} · {percentage(run)}%</Text></HStack>)}</Box>
    </>}
  </Stack>;
}
