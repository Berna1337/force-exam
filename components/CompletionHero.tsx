import PassingConfetti from './PassingConfetti';
import { useEffect, useState } from 'react';
import { usePreferences } from '../contexts/Preferences';
import { meetsPassingScore } from '../lib/session';
import { CheckIcon, RepeatIcon } from '@chakra-ui/icons';
import { Badge, Box, Button, Flex, Heading, HStack, Text, useMediaQuery } from '@chakra-ui/react';
export default function CompletionHero({ score, total, title, mode, passingScore, celebrate, onRetake, onOverview }: { passingScore?: number; celebrate?: boolean; score: number; total: number; title: string; mode: string; onRetake: () => void; onOverview: () => void }) {
  const { preferences } = usePreferences();
  const [systemReducedMotion] = useMediaQuery('(prefers-reduced-motion: reduce)', { ssr: true, fallback: false });
  const motionBlocked = preferences.reducedMotion || systemReducedMotion;
  const [confetti, setConfetti] = useState(false);
  const passed = meetsPassingScore(score, total, passingScore);
  useEffect(() => {
    if (!celebrate || !passed || motionBlocked) return;
    setConfetti(true);
    const timer = window.setTimeout(() => setConfetti(false), 5500);
    return () => { window.clearTimeout(timer); setConfetti(false); };
  }, [celebrate, passed, motionBlocked]);
  const percent = Math.round(score / Math.max(1, total) * 100);
  return <Box className="completion-card" p={{ base: 5, md: 7 }} borderRadius="xl" aria-label="Session complete">
    {confetti && <PassingConfetti />}
    <Flex align="center" gap={{ base: 4, md: 6 }} flexWrap="wrap">
      <Box as="svg" viewBox="0 0 120 120" w="112px" h="112px" flexShrink={0} role="img" aria-label={`${percent}% score`}>
        <circle cx="60" cy="60" r="48" fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle className="score-ring" cx="60" cy="60" r="48" fill="none" stroke={percent === 100 ? 'var(--success)' : 'var(--accent)'} strokeWidth="7" strokeLinecap="round" strokeDasharray={302} strokeDashoffset={302 * (1 - percent / 100)} transform="rotate(-90 60 60)" />
        <text x="60" y="61" textAnchor="middle" dominantBaseline="middle" fill="var(--text)" fontSize="24" fontWeight="600">{percent}%</text>
        <text x="60" y="81" textAnchor="middle" fill="var(--muted)" fontSize="9" letterSpacing="1.4">SCORE</text>
      </Box>
      <Box flex="1" minW="180px"><HStack flexWrap="wrap" spacing={2} mb={3}><Badge bg="var(--accent-soft)" color="var(--accent-text)" borderRadius="full" px={2} py={1}>{mode}</Badge><Badge colorScheme="teal" borderRadius="full" px={2} py={1}><CheckIcon boxSize={2} mr={1} />Session complete</Badge></HStack><Heading size="lg" fontWeight="500">{score} / {total} correct</Heading><Text mt={2} fontSize="sm" color="var(--muted)">{title}</Text>{passingScore !== undefined && <Text role="status" mt={3} fontSize="sm" fontWeight="600" color={passed ? 'var(--success)' : 'var(--warning)'}>{passed ? 'Passed — well done!' : 'Passing score not reached'} · Required: {passingScore}%</Text>}<Text mt={2} fontSize="sm" color={percent === 100 ? 'var(--success)' : 'var(--muted)'}>{percent === 100 ? 'Every question correct. Nicely done.' : 'Review what you missed, at your own pace.'}</Text></Box>
    </Flex>
    {passed && motionBlocked && <Text mt={3} fontSize="xs" color="var(--muted)">{preferences.reducedMotion ? 'Celebration animation is disabled by Reduce motion in app Settings.' : 'Celebration animation is disabled by your system animation settings, even though Reduce motion is off in the app.'}</Text>}
    <Flex mt={5} pt={4} borderTop="1px solid var(--border)" justify="space-between" align="center" gap={3} flexWrap="wrap"><Text fontSize="xs" color="var(--muted)">Your progress is saved. Review below, or come back later.</Text><HStack><Button size="sm" leftIcon={<RepeatIcon />} variant="outline" onClick={onRetake}>Retake</Button><Button className="primary-action" size="sm" onClick={onOverview}>Go to overview</Button></HStack></Flex>
  </Box>;
}
