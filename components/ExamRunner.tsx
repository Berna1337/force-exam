import { normalizeExam, type Exam, type ExamImage, type ExamOption, type ExamQuestion } from "../lib/exam";
import { makeExamPortable } from "../lib/images";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExamAttempt, ExamProgress } from "../lib/study";
import { createQuestionOrder, restoreQuestionOrder, modeLabel, runMode, type RunMode } from "../lib/run";
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
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  RepeatIcon,
  ViewIcon,
} from "@chakra-ui/icons";

type ExamRunnerProps = {
  onBack: () => void;
  initialJson?: string;
  initialProgress?: ExamProgress;
  initialMode?: RunMode;
  onExamImported: (title: string, json: string, questionCount: number) => Promise<boolean>;
  onProgressChange?: (progress: ExamProgress) => void;
  onAttemptComplete?: (attempt: ExamAttempt) => void;
  onOverview?: () => void;
};

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
          borderColor="whiteAlpha.300"
          bg="blackAlpha.300"
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
        <Text color="whiteAlpha.700" fontSize="sm" mt={2}>
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
      bg: "whiteAlpha.100",
      borderColor: "whiteAlpha.300",
      labelBg: "whiteAlpha.200",
      letterBg: "whiteAlpha.200",
      letterColor: "white",
    },
    success: {
      bg: "green.900",
      borderColor: "green.400",
      labelBg: "green.500",
      letterBg: "green.300",
      letterColor: "gray.900",
    },
    danger: {
      bg: "red.900",
      borderColor: "red.300",
      labelBg: "red.500",
      letterBg: "red.200",
      letterColor: "gray.900",
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
      <Badge bg={toneStyles.labelBg} color="white" flexShrink={0}>
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
        <Text color="white" fontWeight="600">
          {value}
        </Text>
      </HStack>
    </Flex>
  );
}

export default function ExamRunner({ onBack, initialJson, initialProgress, initialMode = "practice", onExamImported, onProgressChange, onAttemptComplete, onOverview }: ExamRunnerProps) {
  const [jsonInput, setJsonInput] = useState(initialJson ?? sampleJson);
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [collapsedQuizOptionImages, setCollapsedQuizOptionImages] = useState<Record<string, boolean>>({});
  const [expandedReviewImages, setExpandedReviewImages] = useState<Record<string, boolean>>({});
  const [attemptId, setAttemptId] = useState("");
  const [mode, setMode] = useState<RunMode>(initialMode);
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const progressCallback = useRef(onProgressChange);
  progressCallback.current = onProgressChange;
  const restoredProgress = useRef(initialProgress);
  const lastPersistedProgress = useRef(initialProgress);
  const completedAttempt = useRef<string | null>(null);

  const orderedQuestions = useMemo(() => {
    if (!exam) return [];
    const byId = new Map(exam.questions.map((question) => [question.id, question]));
    return questionOrder.length === exam.questions.length ? questionOrder.map((id) => byId.get(id)!) : exam.questions;
  }, [exam, questionOrder]);
  const currentQuestion = orderedQuestions[currentIndex];
  const answeredCount = exam ? Object.keys(answers).length : 0;
  const score = useMemo(() => {
    if (!exam) return 0;
    return exam.questions.reduce((total, question) => {
      return answers[question.id] === question.answerIndex ? total + 1 : total;
    }, 0);
  }, [answers, exam]);

  useEffect(() => {
    if (!initialJson) return;
    try {
      const restoredExam = normalizeExam(JSON.parse(initialJson));
      const saved = restoredProgress.current;
      const savedMode = saved ? runMode(saved.mode) : initialMode;
      setExam(restoredExam);
      setMode(savedMode);
      setQuestionOrder(restoreQuestionOrder(restoredExam.questions.map((question) => question.id), savedMode, saved?.questionOrder));
      setAttemptId(saved?.attemptId || crypto.randomUUID());
      setCurrentIndex(Math.max(0, Math.min(saved?.currentIndex ?? 0, restoredExam.questions.length - 1)));
      setAnswers(Object.fromEntries(Object.entries(saved?.answers ?? {}).filter(([id, answer]) => {
        const question = restoredExam.questions.find((item) => item.id === id);
        return question && Number.isInteger(answer) && answer >= 0 && answer < question.options.length;
      })));
      setIsReviewing(saved?.isReviewing ?? false);
    } catch {
      setError("This saved exam could not be opened. You can import its JSON again.");
    }
  }, [initialJson, initialMode]);

  const persistProgress = useCallback(() => {
    if (!exam || !attemptId || questionOrder.length !== exam.questions.length) return;
    const previous = lastPersistedProgress.current;
    if (previous?.attemptId === attemptId && previous.currentIndex === currentIndex && previous.isReviewing === isReviewing &&
        runMode(previous.mode) === mode && JSON.stringify(previous.questionOrder ?? exam.questions.map((question) => question.id)) === JSON.stringify(questionOrder) &&
        JSON.stringify(previous.answers) === JSON.stringify(answers)) return;
    const progress = { attemptId, currentIndex, answers, isReviewing, mode, questionOrder, updatedAt: new Date().toISOString() };
    lastPersistedProgress.current = progress;
    progressCallback.current?.(progress);
  }, [exam, attemptId, currentIndex, answers, isReviewing, mode, questionOrder]);

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
    if (exam) setQuestionOrder(createQuestionOrder(exam.questions.map((question) => question.id), mode));
    setAttemptId(crypto.randomUUID());
    setCurrentIndex(0);
    setAnswers({});
    setIsReviewing(false);
    setCollapsedQuizOptionImages({});
    setExpandedReviewImages({});
  };

  const finishExam = () => {
    if (!exam || !attemptId || completedAttempt.current === attemptId || isReviewing) return;
    completedAttempt.current = attemptId;
    onAttemptComplete?.({ id: attemptId, score, total: exam.questions.length, mode, completedAt: new Date().toISOString() });
    setIsReviewing(true);
  };

  if (!exam) {
    return (
      <Box
        w="full"
        bg="transparent"
        p={0}


      >
        <Stack spacing={5}>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="outline"
            colorScheme="purple"
            onClick={onBack}
            size="sm"
            alignSelf="flex-start"
          >
            Close tab
          </Button>

          <Box>
            <Text color="purple.200" fontFamily="'JetBrains Mono', monospace" fontSize="sm" letterSpacing="0.08em">
              JSON IMPORT
            </Text>
            <Heading color="white" size="lg">
              Import a Force Exam
            </Heading>
            <Text color="whiteAlpha.800" mt={2}>
              Paste an exam with <Code>title</Code>, <Code>questions</Code>, <Code>options</Code>, and{" "}
              <Code>answer</Code>. Questions and options can include <Code>imageUrl</Code> or <Code>images</Code>.
            </Text>
          </Box>

          {error && (
            <Alert status="error" bg="red.900" borderRadius="md" color="white">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <FormControl>
            <FormLabel color="whiteAlpha.900">Open a JSON exam file</FormLabel>
            <Input
              type="file"
              accept=".json,application/json"
              p={1}
              onChange={async (event) => {
                const input = event.currentTarget;
                const file = input.files?.[0];
                if (!file) return;
                try {
                  setJsonInput(await file.text());
                  setError("");
                } catch {
                  setError("Could not read this exam file. Try selecting it again.");
                }
                input.value = "";
              }}
            />
            <Text color="whiteAlpha.700" fontSize="sm" mt={2}>
              Linked images download automatically when you start the import, then work offline.
              An internet connection is needed once for web images. Embedded images work immediately.
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel color="whiteAlpha.900">Exam JSON</FormLabel>
            <Textarea
              value={jsonInput}
              onChange={(event) => setJsonInput(event.target.value)}
              minH={{ base: "360px", md: "460px" }}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="sm"
              bg="gray.900"
              borderColor="whiteAlpha.300"
              color="whiteAlpha.900"
              _focus={{ borderColor: "purple.300", boxShadow: "0 0 0 1px var(--chakra-colors-cyan-300)" }}
            />
          </FormControl>

          <HStack spacing={3} flexWrap="wrap">
            <Button aria-label="Import exam file" colorScheme="purple" leftIcon={<ViewIcon />} onClick={importExam} isLoading={importing} loadingText="Importing exam and images">
              Import exam
            </Button>
            <Button variant="outline" colorScheme="purple" onClick={() => setJsonInput(sampleJson)}>
              Load sample
            </Button>
          </HStack>
        </Stack>
      </Box>
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
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
            <Box>
              <Badge colorScheme="purple" mb={2}>
                Review
              </Badge>
              <Badge colorScheme="purple" mb={2} ml={2}>{modeLabel(mode)}</Badge>
              <Heading color="white" size="lg">
                {score} / {exam.questions.length} correct
              </Heading>
              <Text color="whiteAlpha.800">{exam.title}</Text>
            </Box>
            <HStack>
              <Button leftIcon={<RepeatIcon />} colorScheme="purple" onClick={resetExam}>
                Retake
              </Button>
              <Button variant="outline" colorScheme="purple" onClick={returnToOverview}>
                Go to overview
              </Button>
            </HStack>
          </Flex>

          <VStack spacing={4} align="stretch">
            {orderedQuestions.map((question, index) => {
              const selectedAnswer = answers[question.id];
              const isCorrect = selectedAnswer === question.answerIndex;
              const mediaCount = getQuestionMediaCount(question, selectedAnswer);
              const areReviewImagesExpanded = expandedReviewImages[question.id] ?? false;
              const selectedOption = selectedAnswer === undefined ? undefined : question.options[selectedAnswer];
              const correctOption = question.options[question.answerIndex];

              return (
                <Box key={question.id} bg="whiteAlpha.100" border="1px solid" borderColor={isCorrect ? "green.300" : "red.300"} borderRadius="lg" p={4}>
                  <HStack justify="space-between" align="flex-start" mb={3}>
                    <Text color="white" fontWeight="semibold">
                      {index + 1}. {question.prompt}
                    </Text>
                    <Badge colorScheme={isCorrect ? "green" : "red"}>{isCorrect ? "Correct" : "Missed"}</Badge>
                  </HStack>
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
                                <Text color="whiteAlpha.700" fontSize="sm" mb={2}>
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
                    {question.explanation && <Text color="whiteAlpha.800">{question.explanation}</Text>}
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
        <Button leftIcon={<ArrowBackIcon />} size="sm" variant="ghost" color="#999" alignSelf="flex-start" onClick={returnToOverview}>
          Back to overview
        </Button>
        <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
          <Box>
            <Badge colorScheme="purple" mb={2}>
              {modeLabel(mode)}
            </Badge>
            <Heading color="white" size="lg">
              {exam.title}
            </Heading>
            {exam.description && <Text color="whiteAlpha.800">{exam.description}</Text>}
          </Box>
        </Flex>

        <Box>
          <Flex justify="space-between" mb={2} color="whiteAlpha.800">
            <Text>
              Question {currentIndex + 1} of {exam.questions.length}
            </Text>
            <Text>{answeredCount} answered</Text>
          </Flex>
          <Progress value={((currentIndex + 1) / exam.questions.length) * 100} colorScheme="purple" borderRadius="full" />
        </Box>

        {currentQuestion && (
          <Box bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={{ base: 4, md: 6 }}>
            <Stack spacing={6}>
              <Box
                bg="blackAlpha.300"
                border="1px solid"
                borderColor="purple.700"
                borderLeftWidth="4px"
                borderRadius="md"
                p={{ base: 4, md: 5 }}
              >
                <Text color="purple.100" fontFamily="'JetBrains Mono', monospace" fontSize="sm" fontWeight="700" mb={3}>
                  QUESTION {currentIndex + 1}
                </Text>
                <Heading color="white" size="md" lineHeight="1.35">
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
                borderColor="whiteAlpha.400"
                borderRadius="md"
                p={{ base: 3, md: 4 }}
              >
                <Box
                  as="legend"
                  color="white"
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
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        w="full"
                        textAlign="left"
                        border="1px solid"
                        borderColor={isSelected ? "purple.300" : "whiteAlpha.400"}
                        borderRadius="md"
                        bg={isSelected ? "rgba(8, 145, 178, 0.22)" : "rgba(255,255,255,0.04)"}
                        color="whiteAlpha.900"
                        px={4}
                        py={3}
                        cursor="pointer"
                        transition="background 0.15s ease, border-color 0.15s ease"
                        _hover={{ borderColor: "purple.300", bg: isSelected ? "rgba(8, 145, 178, 0.28)" : "whiteAlpha.100" }}
                        _focusVisible={{ borderColor: "purple.200", boxShadow: "0 0 0 2px var(--chakra-colors-cyan-300)" }}
                        onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: index }))}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setAnswers((current) => ({ ...current, [currentQuestion.id]: index }));
                          }
                        }}
                      >
                        <HStack spacing={3} align="flex-start">
                          <Box
                            aria-hidden="true"
                            boxSize="28px"
                            mt={option.images.length > 0 ? 1 : 0}
                            border="1px solid"
                            borderColor={isSelected ? "purple.300" : "whiteAlpha.500"}
                            borderRadius="full"
                            bg={isSelected ? "purple.400" : "transparent"}
                            color={isSelected ? "gray.900" : "whiteAlpha.900"}
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
              onClick={() => setCurrentIndex((index) => Math.min(index + 1, exam.questions.length - 1))}
              isDisabled={currentIndex === exam.questions.length - 1}
            >
              Next
            </Button>
            <Button leftIcon={<CheckCircleIcon />} colorScheme="green" onClick={finishExam}>
              Finish
            </Button>
          </HStack>
        </Flex>

        <Divider borderColor="whiteAlpha.300" />

        <SimpleGrid columns={{ base: 4, sm: 6, md: 10 }} spacing={2}>
          {orderedQuestions.map((question, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = answers[question.id] !== undefined;

            return (
              <Button
                key={question.id}
                size="sm"
                variant="outline"
                aria-label={`Go to question ${index + 1}`}
                bg={isCurrent ? "purple.400" : isAnswered ? "purple.900" : "whiteAlpha.100"}
                borderColor={isCurrent ? "purple.200" : isAnswered ? "purple.300" : "whiteAlpha.500"}
                color={isCurrent ? "gray.900" : "white"}
                fontWeight="700"
                _hover={{
                  bg: isCurrent ? "purple.300" : isAnswered ? "purple.800" : "whiteAlpha.200",
                  borderColor: "purple.200",
                }}
                _active={{ bg: isCurrent ? "purple.300" : "purple.800" }}
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
