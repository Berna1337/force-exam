import { normalizeExam, type Exam, type ExamImage, type ExamOption, type ExamQuestion } from "../lib/exam";
import { cleanSettings, selectPool, secondsRemaining, topicScores, type RunSettings } from "../lib/session";
import CompletionHero from "./CompletionHero";
import FocusedPractice from "./FocusedPractice";
import { makeExamPortable } from "../lib/images";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExamAttempt, ExamProgress } from "../lib/study";
import { createQuestionOrder, restoreQuestionOrder, restoreReviewFlags, sessionLabel, runMode, type FocusKind, type RunMode } from "../lib/run";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Code,
  Collapse,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  AttachmentIcon,
  ArrowForwardIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ViewIcon,
} from "@chakra-ui/icons";

type ExamRunnerProps = {
  onBack: () => void;
  initialJson?: string;
  initialProgress?: ExamProgress;
  initialMode?: RunMode;
  settings?: RunSettings;
  isActive?: boolean;
  initialFocus?: FocusKind;
  initialFocusedQuestionIds?: string[];
  onFocused?: (kind: FocusKind, ids: string[]) => void;
  onExamImported: (title: string, json: string, questionCount: number) => Promise<boolean>;
  onProgressChange?: (progress: ExamProgress) => void;
  onAttemptComplete?: (attempt: ExamAttempt) => void;
  onOverview?: () => void;
};

function ReviewFlagIcon() {
  return <Icon viewBox="0 0 24 24" boxSize={3.5} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 21V3m0 1c5-3 9 3 14 0v10c-5 3-9-3-14 0" /></Icon>;
}

const sampleExam = {
  title: "Force Exam schema sample",
  description: "A compact exam that covers text-only questions, image questions, answer media, and legacy image fields.",
  questions: [
    {
      question: "Which field contains the answer choices for a question?",
      options: ["title", "description", "options", "explanation"],
      answer: "options",
      explanation: "A normal text-only question still uses the options array for selectable answers.",
    },
    {
      prompt: "What can the answer field contain?",
      options: ["Only matching text", "Only a number", "A zero-based index or matching option text", "Only image URLs"],
      correctAnswer: 2,
      explanation: "This text-only question uses prompt and correctAnswer to cover the alternate field names.",
    },
    {
      question: "Which answer best describes the layout shown in these reference images?",
      images: [
        "/sample-images/wide.svg",
        {
          url: "/sample-images/tall.svg",
          alt: "A second reference image with a taller aspect ratio",
          description: "This taller image checks that captions and portrait media fit cleanly in the question panel.",
        },
      ],
      options: [
        {
          text: "A mixed media question with text and more than one image",
          images: [
            "/sample-images/wide.svg",
            {
              url: "/sample-images/square.svg",
              description: "A second answer image turns this choice into a carousel.",
            },
          ],
        },
        {
          text: "A plain text-only answer with no supporting image",
          images: [],
        },
        {
          text: "An image-only style answer with a portrait crop",
          images: ["/sample-images/tall.svg"],
        },
        "A legacy string answer that still works",
      ],
      answer: "A mixed media question with text and more than one image",
      explanation: "This sample checks that question images, answer images, carousels, and string-only options all render together.",
    },
    {
      question: "Which option uses the legacy single imageUrl field?",
      options: [
        {
          text: "This option uses images",
          images: ["/sample-images/wide.svg"],
        },
        {
          text: "This option uses imageUrl",
          imageUrl: "/sample-images/tall.svg",
          imageDescription: "This caption comes from a legacy single-image option field.",
        },
        "This option has text only",
        {
          text: "This option uses imageUrls",
          imageUrls: ["/sample-images/wide.svg", "/sample-images/wide.svg"],
        },
      ],
      answer: 1,
      explanation: "Force Exam accepts zero-based answer indexes. This sample also keeps backwards-compatible image fields covered.",
    },
    {
      question: "Which image-only answer has the widest crop?",
      questionImageUrls: ["/sample-images/wide.svg", "/sample-images/tall.svg"],
      imageDescription: "This description applies to images provided through a legacy question image alias.",
      options: [
        {
          images: ["/sample-images/square.svg"],
        },
        {
          images: ["/sample-images/wide.svg"],
        },
        {
          images: ["/sample-images/tall.svg"],
        },
        {
          text: "No image in this answer",
        },
      ],
      answer: "B",
      explanation: "Image-only options are supported. Use a zero-based index or an answer letter when there is no text to match.",
    },
  ],
};

const sampleJson = JSON.stringify(sampleExam, null, 2);

function getOptionLetter(index: number) {
  return String.fromCharCode(65 + index);
}

function getOptionLabel(option: ExamOption, index: number) {
  return option.text ?? "Image answer";
}

function getQuestionMediaCount(question: ExamQuestion, selectedAnswer?: number) {
  const selectedAnswerImages = selectedAnswer === undefined ? 0 : question.options[selectedAnswer]?.images.length ?? 0;
  const correctAnswerImages = question.options[question.answerIndex]?.images.length ?? 0;

  return question.images.length + selectedAnswerImages + correctAnswerImages;
}

type ImageGalleryProps = {
  images: ExamImage[];
  altPrefix: string;
  maxH: { base: string; md: string } | string;
};

function ImageGallery({ images, altPrefix, maxH }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [images]);

  if (images.length === 0) {
    return null;
  }

  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex];

  const showPreviousImage = () => {
    setCurrentImageIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  };

  const showNextImage = () => {
    setCurrentImageIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  };

  return (
    <Box position="relative" w="full">
      <Box position="relative">
        <Image
          src={currentImage.url}
          alt={currentImage.alt ?? `${altPrefix} ${currentImageIndex + 1}`}
          w="full"
          maxH={maxH}
          objectFit="contain"
          borderRadius="md"
          border="1px solid"
          borderColor="var(--border)"
          bg="var(--chrome)"
        />

        {hasMultipleImages && (
          <>
            <Button
              type="button"
              aria-label="Previous image"
              position="absolute"
              left={2}
              top="50%"
              transform="translateY(-50%)"
              size="sm"
              minW="32px"
              px={0}
              colorScheme="purple"
              onClick={(event) => {
                event.stopPropagation();
                showPreviousImage();
              }}
            >
              <ChevronLeftIcon boxSize={5} />
            </Button>
            <Button
              type="button"
              aria-label="Next image"
              position="absolute"
              right={2}
              top="50%"
              transform="translateY(-50%)"
              size="sm"
              minW="32px"
              px={0}
              colorScheme="purple"
              onClick={(event) => {
                event.stopPropagation();
                showNextImage();
              }}
            >
              <ChevronRightIcon boxSize={5} />
            </Button>
            <Badge position="absolute" right={2} bottom={2} colorScheme="purple">
              {currentImageIndex + 1} / {images.length}
            </Badge>
          </>
        )}
      </Box>

      {currentImage.description && (
        <Text color="var(--muted)" fontSize="sm" mt={2}>
          {currentImage.description}
        </Text>
      )}
    </Box>
  );
}

type ReviewAnswerRowProps = {
  label: string;
  letter?: string;
  value: string;
  tone: "neutral" | "success" | "danger";
};

function ReviewAnswerRow({ label, letter, value, tone }: ReviewAnswerRowProps) {
  const toneStyles = {
    neutral: {
      bg: "var(--hover)",
      borderColor: "var(--border)",
      labelBg: "var(--control-bg)",
      letterBg: "var(--control-bg)",
      letterColor: "var(--text)",
    },
    success: {
      bg: "var(--success-soft)",
      borderColor: "var(--success)",
      labelBg: "var(--success)",
      letterBg: "var(--success)",
      letterColor: "var(--on-tone)",
    },
    danger: {
      bg: "var(--danger-soft)",
      borderColor: "var(--danger)",
      labelBg: "var(--danger)",
      letterBg: "var(--danger)",
      letterColor: "var(--on-tone)",
    },
  }[tone];

  return (
    <Flex
      align={{ base: "flex-start", sm: "center" }}
      bg={toneStyles.bg}
      border="1px solid"
      borderColor={toneStyles.borderColor}
      borderRadius="md"
      direction={{ base: "column", sm: "row" }}
      gap={3}
      px={3}
      py={2}
    >
      <Badge bg={toneStyles.labelBg} color={tone === "neutral" ? "var(--text)" : "var(--on-tone)"} flexShrink={0}>
        {label}
      </Badge>
      <HStack spacing={3} align="flex-start">
        {letter && (
          <Box
            bg={toneStyles.letterBg}
            borderRadius="full"
            color={toneStyles.letterColor}
            display="grid"
            flexShrink={0}
            fontSize="sm"
            fontWeight="800"
            boxSize="28px"
            placeItems="center"
          >
            {letter}
          </Box>
        )}
        <Text color="var(--text)" fontWeight="600">
          {value}
        </Text>
      </HStack>
    </Flex>
  );
}

export default function ExamRunner({ onBack, initialJson, initialProgress, initialMode = "practice", settings: initialSettings, isActive = true, initialFocus, initialFocusedQuestionIds, onFocused, onExamImported, onProgressChange, onAttemptComplete, onOverview }: ExamRunnerProps) {
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importFileName, setImportFileName] = useState("");
  const [jsonInput, setJsonInput] = useState(initialJson ?? sampleJson);
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [markedOnly, setMarkedOnly] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!celebrate) return;
    const timer = window.setTimeout(() => setCelebrate(false), 5500);
    return () => window.clearTimeout(timer);
  }, [celebrate]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [collapsedQuizOptionImages, setCollapsedQuizOptionImages] = useState<Record<string, boolean>>({});
  const [expandedReviewImages, setExpandedReviewImages] = useState<Record<string, boolean>>({});
  const [attemptId, setAttemptId] = useState("");
  const [mode, setMode] = useState<RunMode>(initialMode);
  const [settings] = useState(() => cleanSettings(initialProgress?.settings ?? initialSettings));
  const [poolQuestionIds, setPoolQuestionIds] = useState<string[] | undefined>();
  const [deadlineAt, setDeadlineAt] = useState<number>();
  const [now, setNow] = useState(Date.now);
  const [revealedQuestions, setRevealedQuestions] = useState<string[]>([]);
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const progressCallback = useRef(onProgressChange);
  progressCallback.current = onProgressChange;
  const restoredProgress = useRef(initialProgress);
  const lastPersistedProgress = useRef(initialProgress);
  const completedAttempt = useRef<string | null>(null);

  const focus = initialFocus;
  const sessionQuestions = useMemo(() => {
    if (!exam) return [];
    return exam.questions.filter(question => focus ? initialFocusedQuestionIds?.includes(question.id) : !poolQuestionIds || poolQuestionIds.includes(question.id));
  }, [exam, focus, initialFocusedQuestionIds, poolQuestionIds]);
  const orderedQuestions = useMemo(() => {
    const byId = new Map(sessionQuestions.map(question => [question.id, question]));
    return questionOrder.length === sessionQuestions.length && questionOrder.every(id => byId.has(id)) ? questionOrder.map(id => byId.get(id)!) : sessionQuestions;
  }, [sessionQuestions, questionOrder]);
  const pool = !focus && !!poolQuestionIds;
  const feedback = mode === "practice" && !!settings.feedback;
  const remaining = secondsRemaining(deadlineAt, now);
  const currentQuestion = orderedQuestions[currentIndex];
  const answeredCount = exam ? Object.keys(answers).length : 0;
  const score = useMemo(() => {
    if (!exam) return 0;
    return sessionQuestions.reduce((total, question) => {
      return answers[question.id] === question.answerIndex ? total + 1 : total;
    }, 0);
  }, [answers, exam, sessionQuestions]);

  useEffect(() => {
    if (!initialJson) return;
    try {
      const restoredExam = normalizeExam(JSON.parse(initialJson));
      const saved = restoredProgress.current;
      const selected = initialFocus ? undefined : saved?.poolQuestionIds ? restoreReviewFlags(restoredExam.questions.map(question => question.id), saved.poolQuestionIds) : settings.questionCount || settings.topic ? selectPool(restoredExam.questions, settings) : undefined;
      setPoolQuestionIds(selected);
      const questions = restoredExam.questions.filter(question => initialFocus ? initialFocusedQuestionIds?.includes(question.id) : !selected || selected.includes(question.id));
      if (!questions.length) throw new Error("This practice set has no available questions.");
      const savedMode = initialFocus ? "practice" : saved ? runMode(saved.mode) : initialMode;
      setNow(Date.now());
      setDeadlineAt(!initialFocus && savedMode === "exam" && settings.durationMinutes ? saved?.deadlineAt ?? Date.now() + settings.durationMinutes * 60000 : undefined);
      setRevealedQuestions(restoreReviewFlags(questions.map(question => question.id), saved?.revealedQuestions));
      setExam(restoredExam);
      setMode(savedMode);
      setQuestionOrder(restoreQuestionOrder(questions.map((question) => question.id), savedMode, saved?.questionOrder));
      setAttemptId(saved?.attemptId || crypto.randomUUID());
      setCurrentIndex(Math.max(0, Math.min(saved?.currentIndex ?? 0, questions.length - 1)));
      setAnswers(Object.fromEntries(Object.entries(saved?.answers ?? {}).filter(([id, answer]) => {
        const question = questions.find((item) => item.id === id);
        return question && Number.isInteger(answer) && answer >= 0 && answer < question.options.length;
      })));
      setIsReviewing(saved?.isReviewing ?? false);
      setFlaggedQuestions(restoreReviewFlags(questions.map(question => question.id), saved?.flaggedQuestions));
      setMarkedOnly(false);
    } catch {
      setError("This saved exam could not be opened. You can import its JSON again.");
    }
  }, [initialJson, initialMode, initialFocus, initialFocusedQuestionIds, settings]);

  const persistProgress = useCallback(() => {
    if (!exam || !attemptId || questionOrder.length !== sessionQuestions.length) return;
    const previous = lastPersistedProgress.current;
    if (previous?.attemptId === attemptId && previous.currentIndex === currentIndex && previous.isReviewing === isReviewing &&
        runMode(previous.mode) === mode && JSON.stringify(previous.questionOrder ?? sessionQuestions.map((question) => question.id)) === JSON.stringify(questionOrder) &&
        previous.deadlineAt === deadlineAt && JSON.stringify(previous.revealedQuestions ?? []) === JSON.stringify(revealedQuestions) &&
        previous.focus === focus && JSON.stringify(previous.focusedQuestionIds ?? []) === JSON.stringify(focus ? initialFocusedQuestionIds : []) &&
        JSON.stringify(previous.answers) === JSON.stringify(answers) && JSON.stringify(previous.flaggedQuestions ?? []) === JSON.stringify(flaggedQuestions)) return;
    const progress = { ...(Object.keys(settings).length ? { settings } : {}), ...(pool ? { pool: true, poolQuestionIds } : {}), ...(feedback ? { feedback: true } : {}), ...(deadlineAt ? { deadlineAt } : {}), ...(revealedQuestions.length ? { revealedQuestions } : {}), attemptId, currentIndex, answers, flaggedQuestions, ...(focus ? { focus, focusedQuestionIds: initialFocusedQuestionIds } : {}), isReviewing, mode, questionOrder, updatedAt: new Date().toISOString() };
    lastPersistedProgress.current = progress;
    progressCallback.current?.(progress);
  }, [exam, sessionQuestions, settings, pool, poolQuestionIds, feedback, deadlineAt, revealedQuestions, focus, initialFocusedQuestionIds, attemptId, currentIndex, answers, flaggedQuestions, isReviewing, mode, questionOrder]);

  useEffect(() => { persistProgress(); }, [persistProgress]);

  const returnToOverview = () => {
    persistProgress();
    (onOverview ?? onBack)();
  };

  const importExam = async () => {
    if (importing) return;
    setImporting(true);
    try {
      const portable = await makeExamPortable(jsonInput);
      const parsedExam = normalizeExam(JSON.parse(portable.json));
      await onExamImported(parsedExam.title, portable.json, parsedExam.questions.length);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Could not import this exam JSON.");
    } finally {
      setImporting(false);
    }
  };

  const resetExam = () => {
    if (exam) {
      const selected = !focus && (settings.questionCount || settings.topic) ? selectPool(exam.questions, settings) : undefined;
      const questions = exam.questions.filter(question => focus ? initialFocusedQuestionIds?.includes(question.id) : !selected || selected.includes(question.id));
      if (!questions.length) { setError("No questions match these settings anymore. Return to the overview and choose a new topic or pool."); return; }
      setPoolQuestionIds(selected);
      setQuestionOrder(createQuestionOrder(questions.map(question => question.id), mode));
    }
    setError(""); setRevealedQuestions([]); setNow(Date.now());
    setDeadlineAt(!focus && mode === "exam" && settings.durationMinutes ? Date.now() + settings.durationMinutes * 60000 : undefined);
    setAttemptId(crypto.randomUUID());
    setCurrentIndex(0);
    setAnswers({});
    setFlaggedQuestions([]);
    setMarkedOnly(false);
    setIsReviewing(false);
    setCelebrate(false);
    setCollapsedQuizOptionImages({});
    setExpandedReviewImages({});
  };

  const finishExam = useCallback((timedOut = false) => {
    if (!exam || !orderedQuestions.length || !attemptId || completedAttempt.current === attemptId || isReviewing) return;
    completedAttempt.current = attemptId;
    onAttemptComplete?.({ ...(settings.passingScore ? { passingScore: settings.passingScore } : {}), id: attemptId, score, total: orderedQuestions.length, mode, ...(pool ? { pool: true } : {}), ...(feedback ? { feedback: true } : {}), ...(settings.durationMinutes && mode === "exam" ? { durationMinutes: settings.durationMinutes, timedOut: timedOut || secondsRemaining(deadlineAt) === 0 } : {}), topics: topicScores(sessionQuestions, answers), ...(focus ? { focus } : {}), completedAt: new Date().toISOString() });
    setCelebrate(true);
    setIsReviewing(true);
  }, [exam, attemptId, isReviewing, score, orderedQuestions.length, deadlineAt, mode, pool, feedback, settings.durationMinutes, settings.passingScore, sessionQuestions, answers, focus, onAttemptComplete]);
  useEffect(() => {
    if (!deadlineAt || isReviewing) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [deadlineAt, isReviewing]);
  useEffect(() => { if (deadlineAt && now >= deadlineAt && exam && attemptId && questionOrder.length === sessionQuestions.length) finishExam(true); }, [deadlineAt, now, exam, attemptId, questionOrder.length, sessionQuestions.length, finishExam]);
  const chooseAnswer = useCallback((question: ExamQuestion, index: number) => {
    if (isReviewing || secondsRemaining(deadlineAt) === 0 || feedback && revealedQuestions.includes(question.id)) return;
    setAnswers(current => ({ ...current, [question.id]: index }));
    if (feedback) setRevealedQuestions(current => current.includes(question.id) ? current : [...current, question.id]);
  }, [isReviewing, deadlineAt, feedback, revealedQuestions]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!isActive || !currentQuestion || isReviewing || event.ctrlKey || event.metaKey || event.altKey || document.querySelector('[role="dialog"]')) return;
      const target = event.target as HTMLElement;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (/^[1-9]$/.test(event.key) && Number(event.key) <= currentQuestion.options.length) { event.preventDefault(); chooseAnswer(currentQuestion, Number(event.key) - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); setCurrentIndex(index => Math.min(index + 1, orderedQuestions.length - 1)); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setCurrentIndex(index => Math.max(index - 1, 0)); }
      if (event.key.toLowerCase() === 'f' && !event.repeat) { event.preventDefault(); setFlaggedQuestions(current => current.includes(currentQuestion.id) ? current.filter(id => id !== currentQuestion.id) : restoreReviewFlags(sessionQuestions.map(question => question.id), [...current, currentQuestion.id])); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [isActive, currentQuestion, isReviewing, chooseAnswer, orderedQuestions.length, sessionQuestions]);

  const reviewFlagButton = (question: ExamQuestion, index: number) => {
    const flagged = flaggedQuestions.includes(question.id);
    return <Button size="xs" variant="ghost" leftIcon={<ReviewFlagIcon />} color={flagged ? "var(--warning)" : "var(--muted)"} aria-label={`${flagged ? "Unmark" : "Mark"} question ${index + 1} for review`} aria-pressed={flagged}
      onClick={() => setFlaggedQuestions(current => current.includes(question.id) ? current.filter(id => id !== question.id) : restoreReviewFlags(sessionQuestions.map(item => item.id), [...current, question.id]))}>
      {flagged ? "Marked for review" : "Mark for review"}
    </Button>;
  };

  if (!exam) {
    return (
      <Stack spacing={6} maxW="860px" mx="auto" aria-label="Import exam">
        <Box>
          <HStack justify="space-between" gap={4} mb={3}>
            <Text color="var(--accent-text)" fontFamily="mono" fontSize="xs" letterSpacing=".12em">YOUR EXAM LIBRARY</Text>
            <Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={onBack} size="xs" color="var(--muted)">Close tab</Button>
          </HStack>
          <Heading size="lg" fontWeight="500">Import exam</Heading>
          <Text color="var(--muted)" mt={3} fontSize="sm" lineHeight="1.8">Bring an exam into your library. Choose a JSON file or paste its contents below.</Text>
        </Box>

        {error && <Alert status="error" bg="var(--danger-soft)" border="1px solid var(--danger)" borderRadius="lg" fontSize="sm"><AlertIcon />{error}</Alert>}

        <Box p={{ base: 4, md: 5 }} bg="var(--surface)" border="1px solid var(--border)" borderRadius="xl">
          <Flex align="center" gap={4} flexWrap="wrap">
            <Box bg="var(--accent-soft)" color="var(--accent-text)" p={3} borderRadius="lg"><AttachmentIcon boxSize={5} /></Box>
            <Box flex="1" minW="180px"><Heading size="sm" fontWeight="500">Choose an exam file</Heading><Text mt={2} fontSize="xs" color="var(--muted)" overflowWrap="anywhere">{importFileName || 'Open a .json file from your device to preview it below.'}</Text></Box>
            <Button size="sm" variant="outline" onClick={() => importFileRef.current?.click()} isDisabled={importing}>Choose JSON file</Button>
          </Flex>
          <Input ref={importFileRef} type="file" aria-label="Choose exam JSON file" accept=".json,application/json" display="none" disabled={importing} onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            try { setJsonInput(await file.text()); setImportFileName(file.name); setError(""); }
            catch { setError("Could not read this exam file. Try selecting it again."); }
            input.value = "";
          }} />
        </Box>

        <Box bg="var(--surface)" border="1px solid var(--border)" borderRadius="xl" overflow="hidden">
          <HStack px={{ base: 4, md: 5 }} py={4} justify="space-between" borderBottom="1px solid var(--border)">
            <Box><Heading size="sm" fontWeight="500">Exam contents</Heading><Text fontSize="xs" color="var(--muted)" mt={1}>Preview your file or paste exam JSON here.</Text></Box>
            <Button size="xs" variant="ghost" isDisabled={importing} onClick={() => { setJsonInput(sampleJson); setImportFileName(""); setError(""); }}>Load sample</Button>
          </HStack>
          <Box p={{ base: 4, md: 5 }}>
            <Textarea aria-label="Exam JSON" value={jsonInput} isDisabled={importing} onChange={event => setJsonInput(event.target.value)} minH={{ base: '280px', md: '360px' }} resize="vertical" fontFamily="mono" fontSize="xs" lineHeight="1.8" p={4} bg="var(--chrome)" borderColor="var(--border)" color="var(--text)" borderRadius="md" spellCheck={false} />
            <Box as="details" mt={3} color="var(--muted)" fontSize="xs"><Box as="summary" cursor="pointer" py={1}>Supported JSON format</Box><Text mt={2} lineHeight="1.8">Include <Code fontSize="xs">title</Code>, <Code fontSize="xs">questions</Code>, <Code fontSize="xs">options</Code>, and <Code fontSize="xs">answer</Code>. Questions and options also support <Code fontSize="xs">imageUrl</Code> or <Code fontSize="xs">images</Code>.</Text></Box>
          </Box>
        </Box>

        <Flex align="center" justify="space-between" gap={4} flexWrap="wrap">
          <Box flex="1" minW="220px"><Text fontSize="xs" color="var(--muted)" lineHeight="1.8">Saved locally, ready to study offline.</Text><Text fontSize="xs" color="var(--muted)" lineHeight="1.8">Linked images need a connection for their initial download.</Text></Box>
          <Button className="primary-action" size="sm" aria-label="Import exam file" rightIcon={<ArrowForwardIcon />} onClick={importExam} isLoading={importing} isDisabled={!jsonInput.trim()} loadingText="Importing exam and images">Import exam</Button>
        </Flex>
      </Stack>
    );
  }

  if (isReviewing) {
    return (
      <Box
        w="full"
        bg="transparent"
        p={0}
      >
        <Stack spacing={6}>
          {error && <Alert status="error"><AlertIcon />{error}</Alert>}
          <CompletionHero passingScore={settings.passingScore} celebrate={celebrate && isActive} score={score} total={orderedQuestions.length} title={exam.title} mode={sessionLabel(mode, focus, pool)} onRetake={resetExam} onOverview={returnToOverview} />
          {deadlineAt && now >= deadlineAt && <Text role="status" color="var(--warning)">Time expired. Your saved answers were submitted automatically.</Text>}
          {onFocused && <FocusedPractice json={initialJson ?? "{}"} progress={{ attemptId, currentIndex, answers, flaggedQuestions, isReviewing, updatedAt: "", ...(pool ? { poolQuestionIds } : {}), ...(focus ? { focusedQuestionIds: initialFocusedQuestionIds } : {}) }} onStart={onFocused} />}
          <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
            <HStack color="var(--warning)" fontSize="sm"><ReviewFlagIcon /><Text role="status">{flaggedQuestions.length} marked for review</Text></HStack>
            <Button size="sm" variant="outline" colorScheme="purple" aria-pressed={markedOnly} onClick={() => setMarkedOnly(current => !current)}>{markedOnly ? "Show all questions" : "Show marked only"}</Button>
          </Flex>
          {markedOnly && !flaggedQuestions.length && <Text color="var(--muted)">No questions marked for review.</Text>}
          <VStack spacing={4} align="stretch">
            {orderedQuestions.map((question, index) => {
              if (markedOnly && !flaggedQuestions.includes(question.id)) return null;
              const selectedAnswer = answers[question.id];
              const isCorrect = selectedAnswer === question.answerIndex;
              const mediaCount = getQuestionMediaCount(question, selectedAnswer);
              const areReviewImagesExpanded = expandedReviewImages[question.id] ?? false;
              const selectedOption = selectedAnswer === undefined ? undefined : question.options[selectedAnswer];
              const correctOption = question.options[question.answerIndex];

              return (
                <Box key={question.id} aria-label={`Review question ${index + 1}`} bg="var(--hover)" border="1px solid" borderColor={isCorrect ? "var(--success)" : "var(--danger)"} borderRadius="lg" p={4}>
                  <Flex justify="space-between" align="flex-start" gap={3} flexWrap="wrap" mb={3}>
                    <Text color="var(--text)" fontWeight="semibold" flex="1" minW="180px">
                      {index + 1}. {question.prompt}
                    </Text>
                    <HStack spacing={2}><Badge colorScheme={isCorrect ? "green" : "red"}>{isCorrect ? "Correct" : "Missed"}</Badge>{reviewFlagButton(question, index)}</HStack>
                  </Flex>
                  <Stack spacing={3}>
                    <ReviewAnswerRow
                      label="Your answer"
                      letter={selectedAnswer === undefined ? undefined : getOptionLetter(selectedAnswer)}
                      value={selectedOption ? getOptionLabel(selectedOption, selectedAnswer) : "Not answered"}
                      tone={selectedAnswer === undefined ? "neutral" : isCorrect ? "success" : "danger"}
                    />
                    <ReviewAnswerRow
                      label="Correct answer"
                      letter={getOptionLetter(question.answerIndex)}
                      value={getOptionLabel(correctOption, question.answerIndex)}
                      tone="success"
                    />
                    {mediaCount > 0 && (
                      <Button
                        alignSelf="flex-start"
                        size="sm"
                        variant="outline"
                        colorScheme="purple"
                        rightIcon={areReviewImagesExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        onClick={() =>
                          setExpandedReviewImages((current) => ({
                            ...current,
                            [question.id]: !areReviewImagesExpanded,
                          }))
                        }
                      >
                        {areReviewImagesExpanded ? "Hide images" : `Show images (${mediaCount})`}
                      </Button>
                    )}
                    <Collapse in={areReviewImagesExpanded} animateOpacity>
                      <Stack spacing={3} pt={mediaCount > 0 ? 2 : 0}>
                        <ImageGallery images={question.images} altPrefix={`Question ${index + 1}`} maxH="220px" />
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                          {[selectedAnswer, question.answerIndex].map((optionIndex, imageIndex) => {
                            if (optionIndex === undefined) {
                              return null;
                            }

                            const option = question.options[optionIndex];
                            if (option.images.length === 0) {
                              return null;
                            }

                            return (
                              <Box key={`${optionIndex}-${imageIndex}`}>
                                <Text color="var(--muted)" fontSize="sm" mb={2}>
                                  {imageIndex === 0 ? "Your answer image" : "Correct answer image"}
                                </Text>
                                <ImageGallery
                                  images={option.images}
                                  altPrefix={getOptionLabel(option, optionIndex)}
                                  maxH="180px"
                                />
                              </Box>
                            );
                          })}
                        </SimpleGrid>
                      </Stack>
                    </Collapse>
                    {question.explanation && <Text color="var(--muted)">{question.explanation}</Text>}
                  </Stack>
                </Box>
              );
            })}
          </VStack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      w="full"
      bg="transparent"
      p={0}


    >
      <Stack spacing={6}>
        <Button leftIcon={<ArrowBackIcon />} size="sm" variant="ghost" color="var(--muted)" alignSelf="flex-start" onClick={returnToOverview}>
          Back to overview
        </Button>
        <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
          <Box>
            <Badge colorScheme="purple" mb={2}>
              {sessionLabel(mode, focus, pool)}
            </Badge>
            <Heading color="var(--text)" size="lg">
              {exam.title}
            </Heading>
            {exam.description && <Text color="var(--muted)">{exam.description}</Text>}
          </Box>
        </Flex>

        {remaining !== undefined && <Text role="timer" aria-label="Time remaining" color={remaining <= 60 ? "var(--danger)" : "var(--accent-text)"} fontFamily="mono">Time remaining: {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</Text>}
        <Box>
          <Flex justify="space-between" mb={2} color="var(--muted)">
            <Text>
              Question {currentIndex + 1} of {orderedQuestions.length}
            </Text>
            <HStack spacing={3}><Text>{answeredCount} answered</Text>{flaggedQuestions.length > 0 && <HStack spacing={1} color="var(--warning)"><ReviewFlagIcon /><Text>{flaggedQuestions.length} marked</Text></HStack>}</HStack>
          </Flex>
          <Progress value={(answeredCount / orderedQuestions.length) * 100} colorScheme="teal" borderRadius="full" className="study-progress" aria-label="Questions answered" />
        </Box>

        {currentQuestion && (
          <Box bg="var(--hover)" border="1px solid" borderColor="var(--border)" borderRadius="lg" p={{ base: 4, md: 6 }}>
            <Stack spacing={6}>
              <Box
                bg="var(--chrome)"
                border="1px solid"
                borderColor="var(--border)"
                borderLeftWidth="4px"
                borderRadius="md"
                p={{ base: 4, md: 5 }}
              >
                <Flex justify="space-between" align="center" gap={3} flexWrap="wrap" mb={3}>
                  <Text color="var(--accent-text)" fontFamily="'JetBrains Mono', monospace" fontSize="sm" fontWeight="700">
                    QUESTION {currentIndex + 1}
                  </Text>
                  {reviewFlagButton(currentQuestion, currentIndex)}
                </Flex>
                <Heading color="var(--text)" size="md" lineHeight="1.35">
                  {currentQuestion.prompt}
                </Heading>
                {currentQuestion.images.length > 0 && (
                  <Box mt={5}>
                    <ImageGallery
                      images={currentQuestion.images}
                      altPrefix={`Question ${currentIndex + 1}`}
                      maxH={{ base: "260px", md: "360px" }}
                    />
                  </Box>
                )}
              </Box>

              <Box
                as="fieldset"
                border="1px solid"
                borderColor="var(--border)"
                borderRadius="md"
                p={{ base: 3, md: 4 }}
              >
                <Box
                  as="legend"
                  color="var(--text)"
                  fontSize="sm"
                  fontWeight="700"
                  px={2}
                  textTransform="uppercase"
                >
                  Answers
                </Box>

                <Stack spacing={3} role="radiogroup" aria-label={`Question ${currentIndex + 1} answers`}>
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = answers[currentQuestion.id] === index;
                    const optionImageKey = `${currentQuestion.id}-option-${index}`;
                    const areOptionImagesCollapsed = collapsedQuizOptionImages[optionImageKey] ?? false;

                    return (
                      <Box
                        key={optionImageKey}
                        className="answer-option"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        w="full"
                        textAlign="left"
                        border="1px solid"
                        borderColor={isSelected ? "var(--accent-text)" : "var(--border)"}
                        borderRadius="md"
                        bg={isSelected ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "var(--hover)"}
                        color="var(--text)"
                        px={4}
                        py={3}
                        cursor="pointer"
                        transition="background 0.15s ease, border-color 0.15s ease"
                        _hover={{ borderColor: "var(--accent-text)", bg: isSelected ? "color-mix(in srgb, var(--accent) 22%, transparent)" : "var(--hover)" }}
                        _focusVisible={{ borderColor: "var(--accent-text)", boxShadow: "0 0 0 2px var(--chakra-colors-cyan-300)" }}
                        onClick={() => chooseAnswer(currentQuestion, index)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            chooseAnswer(currentQuestion, index);
                          }
                        }}
                      >
                        <HStack spacing={3} align="flex-start">
                          <Box
                            aria-hidden="true"
                            boxSize="28px"
                            mt={option.images.length > 0 ? 1 : 0}
                            border="1px solid"
                            borderColor={isSelected ? "var(--accent-text)" : "var(--border)"}
                            borderRadius="full"
                            bg={isSelected ? "var(--accent-text)" : "transparent"}
                            color={isSelected ? "var(--on-tone)" : "var(--text)"}
                            flexShrink={0}
                            display="grid"
                            fontSize="sm"
                            fontWeight="700"
                            placeItems="center"
                          >
                            {getOptionLetter(index)}
                          </Box>
                          <Stack spacing={3} flex="1">
                            <Flex
                              align={{ base: "flex-start", sm: "center" }}
                              justify="space-between"
                              gap={3}
                              direction={{ base: "column", sm: "row" }}
                            >
                              <Text>{getOptionLabel(option, index)}</Text>
                              {option.images.length > 0 && (
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  colorScheme="purple"
                                  rightIcon={areOptionImagesCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setCollapsedQuizOptionImages((current) => ({
                                      ...current,
                                      [optionImageKey]: !areOptionImagesCollapsed,
                                    }));
                                  }}
                                  onKeyDown={(event) => event.stopPropagation()}
                                >
                                  {areOptionImagesCollapsed ? `Show images (${option.images.length})` : "Hide images"}
                                </Button>
                              )}
                            </Flex>
                            {option.images.length > 0 && (
                              <Collapse in={!areOptionImagesCollapsed} animateOpacity>
                                <ImageGallery
                                  images={option.images}
                                  altPrefix={getOptionLabel(option, index)}
                                  maxH={{ base: "180px", md: "240px" }}
                                />
                              </Collapse>
                            )}
                          </Stack>
                        </HStack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </Stack>
          </Box>
        )}

        {feedback && currentQuestion && revealedQuestions.includes(currentQuestion.id) && <Box role="status" p={4} border="1px solid" borderColor={answers[currentQuestion.id] === currentQuestion.answerIndex ? "var(--success)" : "var(--warning)"} borderRadius="md"><Text fontWeight="600">{answers[currentQuestion.id] === currentQuestion.answerIndex ? "Correct" : `Correct answer: ${getOptionLetter(currentQuestion.answerIndex)}. ${getOptionLabel(currentQuestion.options[currentQuestion.answerIndex], currentQuestion.answerIndex)}`}</Text><ImageGallery images={currentQuestion.options[currentQuestion.answerIndex].images} altPrefix="Correct answer" maxH="180px" />{currentQuestion.explanation && <Text mt={2}>{currentQuestion.explanation}</Text>}<Text fontSize="xs" color="var(--muted)" mt={2}>Your answer is locked after feedback is shown.</Text></Box>}
        <Flex justify="space-between" gap={3} direction={{ base: "column", sm: "row" }}>
          <Button
            variant="outline"
            colorScheme="purple"
            onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
            isDisabled={currentIndex === 0}
          >
            Previous
          </Button>
          <HStack>
            <Button
              colorScheme="purple"
              onClick={() => setCurrentIndex((index) => Math.min(index + 1, orderedQuestions.length - 1))}
              isDisabled={currentIndex === orderedQuestions.length - 1}
            >
              Next
            </Button>
            <Button leftIcon={<CheckCircleIcon />} colorScheme="green" onClick={() => finishExam()}>
              Finish
            </Button>
          </HStack>
        </Flex>

        <Divider borderColor="var(--border)" />

        <SimpleGrid columns={{ base: 4, sm: 6, md: 10 }} spacing={2}>
          {orderedQuestions.map((question, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = answers[question.id] !== undefined;
            const isFlagged = flaggedQuestions.includes(question.id);

            return (
              <Button
                key={question.id}
                size="sm"
                variant="outline"
                aria-label={`Go to question ${index + 1}`}
                aria-description={isFlagged ? "Marked for review" : undefined}
                title={isFlagged ? `Question ${index + 1} · Marked for review` : `Question ${index + 1}`}
                rightIcon={isFlagged ? <ReviewFlagIcon /> : undefined}
                bg={isCurrent ? "var(--accent-text)" : isAnswered ? "var(--accent-soft)" : "var(--hover)"}
                borderColor={isCurrent ? "var(--accent-text)" : isAnswered ? "var(--accent-text)" : "var(--border)"}
                color={isCurrent ? "var(--on-tone)" : "var(--text)"}
                fontWeight="700"
                _hover={{
                  bg: isCurrent ? "var(--accent-text)" : isAnswered ? "var(--accent-soft)" : "var(--control-bg)",
                  borderColor: "var(--accent-text)",
                }}
                _active={{ bg: isCurrent ? "var(--accent-text)" : "var(--accent-soft)" }}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </Button>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
