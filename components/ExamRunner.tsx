import { useEffect, useMemo, useState } from "react";
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

type RawQuestion = {
  question?: unknown;
  prompt?: unknown;
  image?: unknown;
  imageCaption?: unknown;
  imageDescription?: unknown;
  images?: unknown;
  imageUrl?: unknown;
  imageUrls?: unknown;
  questionImageUrl?: unknown;
  questionImageUrls?: unknown;
  questionImages?: unknown;
  options?: unknown;
  answer?: unknown;
  correctAnswer?: unknown;
  explanation?: unknown;
};

type RawExam = {
  title?: unknown;
  description?: unknown;
  questions?: unknown;
};

type ExamImage = {
  url: string;
  alt?: string;
  description?: string;
};

type ExamOption = {
  text?: string;
  images: ExamImage[];
};

type ExamQuestion = {
  id: string;
  prompt: string;
  images: ExamImage[];
  options: ExamOption[];
  answerIndex: number;
  explanation?: string;
};

type Exam = {
  title: string;
  description?: string;
  questions: ExamQuestion[];
};

type ExamRunnerProps = {
  onBack: () => void;
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
        "https://picsum.photos/seed/question-layout-wide/640/360",
        {
          url: "https://picsum.photos/seed/question-layout-tall/300/420",
          alt: "A second reference image with a taller aspect ratio",
          description: "This taller image checks that captions and portrait media fit cleanly in the question panel.",
        },
      ],
      options: [
        {
          text: "A mixed media question with text and more than one image",
          images: [
            "https://picsum.photos/seed/answer-mixed-wide/480/240",
            {
              url: "https://picsum.photos/seed/answer-mixed-square/320/320",
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
          images: ["https://picsum.photos/seed/answer-portrait/200/300"],
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
          images: ["https://picsum.photos/seed/array-image/360/220"],
        },
        {
          text: "This option uses imageUrl",
          imageUrl: "https://picsum.photos/seed/single-image-url/200/300",
          imageDescription: "This caption comes from a legacy single-image option field.",
        },
        "This option has text only",
        {
          text: "This option uses imageUrls",
          imageUrls: ["https://picsum.photos/seed/image-urls-one/300/200", "https://picsum.photos/seed/image-urls-two/420/240"],
        },
      ],
      answer: 1,
      explanation: "Force Exam accepts zero-based answer indexes. This sample also keeps backwards-compatible image fields covered.",
    },
    {
      question: "Which image-only answer has the widest crop?",
      questionImageUrls: ["https://picsum.photos/seed/question-alias-one/420/260", "https://picsum.photos/seed/question-alias-two/260/420"],
      imageDescription: "This description applies to images provided through a legacy question image alias.",
      options: [
        {
          images: ["https://picsum.photos/seed/image-only-square/300/300"],
        },
        {
          images: ["https://picsum.photos/seed/image-only-wide/520/240"],
        },
        {
          images: ["https://picsum.photos/seed/image-only-tall/200/320"],
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

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function getOptionalImageUrl(value: unknown, context: string) {
  const imageUrl = getOptionalText(value);
  if (!imageUrl) {
    return undefined;
  }

  if (imageUrl.startsWith("/")) {
    return imageUrl;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return imageUrl;
    }
  } catch {
    // Fall through to the consistent schema error below.
  }

  throw new Error(`${context} image URL must be an absolute http(s) URL or start with "/".`);
}

function normalizeImage(value: unknown, context: string): ExamImage {
  if (typeof value === "string") {
    const url = getOptionalImageUrl(value, context);
    if (!url) {
      throw new Error(`${context} image URL must be a non-empty string.`);
    }

    return { url };
  }

  if (!value || typeof value !== "object") {
    throw new Error(`${context} image must be a URL string or object.`);
  }

  const rawImage = value as {
    url?: unknown;
    src?: unknown;
    imageUrl?: unknown;
    alt?: unknown;
    imageAlt?: unknown;
    caption?: unknown;
    description?: unknown;
  };
  const url = getOptionalImageUrl(rawImage.url ?? rawImage.src ?? rawImage.imageUrl, context);
  if (!url) {
    throw new Error(`${context} image needs a url.`);
  }

  return {
    url,
    alt: getOptionalText(rawImage.alt ?? rawImage.imageAlt),
    description: getOptionalText(rawImage.description ?? rawImage.caption),
  };
}

function normalizeImages(value: unknown, context: string): ExamImage[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((image, index) => normalizeImage(image, `${context}, image ${index + 1}`));
  }

  return [normalizeImage(value, context)];
}

function mergeImages(...imageGroups: ExamImage[][]) {
  return imageGroups.flat();
}

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

function parseAnswerIndex(answer: unknown, options: ExamOption[]) {
  if (typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer < options.length) {
    return answer;
  }

  if (typeof answer === "string") {
    const numericAnswer = Number(answer);
    if (Number.isInteger(numericAnswer) && numericAnswer >= 0 && numericAnswer < options.length) {
      return numericAnswer;
    }

    const letterAnswer = answer.trim().toUpperCase();
    if (/^[A-Z]$/.test(letterAnswer)) {
      const letterIndex = letterAnswer.charCodeAt(0) - 65;
      if (letterIndex >= 0 && letterIndex < options.length) {
        return letterIndex;
      }
    }

    const matchingIndex = options.findIndex((option) => option.text?.toLowerCase() === answer.toLowerCase());
    if (matchingIndex >= 0) {
      return matchingIndex;
    }
  }

  return -1;
}

function normalizeOption(option: unknown, questionIndex: number, optionIndex: number): ExamOption {
  if (typeof option === "string") {
    const text = getOptionalText(option);
    if (!text) {
      throw new Error(`Question ${questionIndex + 1}, option ${optionIndex + 1} must be a non-empty string.`);
    }
    return { text, images: [] };
  }

  if (!option || typeof option !== "object") {
    throw new Error(`Question ${questionIndex + 1}, option ${optionIndex + 1} must be a string or object.`);
  }

  const rawOption = option as {
    text?: unknown;
    label?: unknown;
    value?: unknown;
    image?: unknown;
    images?: unknown;
    imageUrl?: unknown;
    imageUrls?: unknown;
    imageAlt?: unknown;
    imageCaption?: unknown;
    imageDescription?: unknown;
    alt?: unknown;
  };
  const text = getOptionalText(rawOption.text ?? rawOption.label ?? rawOption.value);
  const images = mergeImages(
    normalizeImages(rawOption.images, `Question ${questionIndex + 1}, option ${optionIndex + 1}`),
    normalizeImages(rawOption.imageUrls, `Question ${questionIndex + 1}, option ${optionIndex + 1}`),
    normalizeImages(rawOption.imageUrl ?? rawOption.image, `Question ${questionIndex + 1}, option ${optionIndex + 1}`),
  );

  if (!text && images.length === 0) {
    throw new Error(`Question ${questionIndex + 1}, option ${optionIndex + 1} needs text or images.`);
  }

  return {
    text,
    images: images.map((image) => ({
      ...image,
      alt: image.alt ?? getOptionalText(rawOption.imageAlt ?? rawOption.alt),
      description: image.description ?? getOptionalText(rawOption.imageDescription ?? rawOption.imageCaption),
    })),
  };
}

function normalizeExam(value: unknown): Exam {
  if (!value || typeof value !== "object") {
    throw new Error("Exam JSON must be an object.");
  }

  const rawExam = value as RawExam;
  if (!Array.isArray(rawExam.questions) || rawExam.questions.length === 0) {
    throw new Error("Exam JSON needs a non-empty questions array.");
  }

  const questions = rawExam.questions.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Question ${index + 1} must be an object.`);
    }

    const rawQuestion = item as RawQuestion;
    const prompt = rawQuestion.question ?? rawQuestion.prompt;
    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      throw new Error(`Question ${index + 1} needs a question or prompt string.`);
    }
    const questionImageDescription = getOptionalText(rawQuestion.imageDescription ?? rawQuestion.imageCaption);
    const images = mergeImages(
      normalizeImages(rawQuestion.images ?? rawQuestion.questionImages, `Question ${index + 1}`),
      normalizeImages(rawQuestion.imageUrls ?? rawQuestion.questionImageUrls, `Question ${index + 1}`),
      normalizeImages(rawQuestion.imageUrl ?? rawQuestion.image ?? rawQuestion.questionImageUrl, `Question ${index + 1}`),
    ).map((image) => ({
      ...image,
      description: image.description ?? questionImageDescription,
    }));

    if (!Array.isArray(rawQuestion.options) || rawQuestion.options.length < 2) {
      throw new Error(`Question ${index + 1} needs at least two options.`);
    }

    const options = rawQuestion.options.map((option, optionIndex) => normalizeOption(option, index, optionIndex));

    const answerIndex = parseAnswerIndex(rawQuestion.answer ?? rawQuestion.correctAnswer, options);
    if (answerIndex < 0) {
      throw new Error(`Question ${index + 1} needs answer as a zero-based index or matching option text.`);
    }

    return {
      id: `question-${index}`,
      prompt: prompt.trim(),
      images,
      options,
      answerIndex,
      explanation: typeof rawQuestion.explanation === "string" ? rawQuestion.explanation.trim() : undefined,
    };
  });

  return {
    title: typeof rawExam.title === "string" && rawExam.title.trim() ? rawExam.title.trim() : "Imported Force Exam",
    description:
      typeof rawExam.description === "string" && rawExam.description.trim() ? rawExam.description.trim() : undefined,
    questions,
  };
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
              colorScheme="cyan"
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
              colorScheme="cyan"
              onClick={(event) => {
                event.stopPropagation();
                showNextImage();
              }}
            >
              <ChevronRightIcon boxSize={5} />
            </Button>
            <Badge position="absolute" right={2} bottom={2} colorScheme="cyan">
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

export default function ExamRunner({ onBack }: ExamRunnerProps) {
  const [jsonInput, setJsonInput] = useState(sampleJson);
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [collapsedQuizOptionImages, setCollapsedQuizOptionImages] = useState<Record<string, boolean>>({});
  const [expandedReviewImages, setExpandedReviewImages] = useState<Record<string, boolean>>({});

  const currentQuestion = exam?.questions[currentIndex];
  const answeredCount = exam ? Object.keys(answers).length : 0;
  const score = useMemo(() => {
    if (!exam) return 0;
    return exam.questions.reduce((total, question) => {
      return answers[question.id] === question.answerIndex ? total + 1 : total;
    }, 0);
  }, [answers, exam]);

  const importExam = () => {
    try {
      const parsedExam = normalizeExam(JSON.parse(jsonInput));
      setExam(parsedExam);
      setCurrentIndex(0);
      setAnswers({});
      setError("");
      setIsReviewing(false);
      setCollapsedQuizOptionImages({});
      setExpandedReviewImages({});
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Could not import this exam JSON.");
    }
  };

  const resetExam = () => {
    setCurrentIndex(0);
    setAnswers({});
    setIsReviewing(false);
    setCollapsedQuizOptionImages({});
    setExpandedReviewImages({});
  };

  if (!exam) {
    return (
      <Box
        w="full"
        bg="rgba(255,255,255,0.06)"
        border="1px solid"
        borderColor="whiteAlpha.300"
        borderRadius="lg"
        p={{ base: 5, md: 8 }}
        boxShadow="0 20px 80px rgba(0, 0, 0, 0.35)"
        backdropFilter="blur(12px)"
      >
        <Stack spacing={5}>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="outline"
            colorScheme="cyan"
            onClick={onBack}
            size="sm"
            alignSelf="flex-start"
          >
            Back to options
          </Button>

          <Box>
            <Text color="cyan.200" fontFamily="'JetBrains Mono', monospace" fontSize="sm" letterSpacing="0.08em">
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
              _focus={{ borderColor: "cyan.300", boxShadow: "0 0 0 1px var(--chakra-colors-cyan-300)" }}
            />
          </FormControl>

          <HStack spacing={3} flexWrap="wrap">
            <Button colorScheme="cyan" leftIcon={<ViewIcon />} onClick={importExam}>
              Start practice
            </Button>
            <Button variant="outline" colorScheme="cyan" onClick={() => setJsonInput(sampleJson)}>
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
        bg="rgba(255,255,255,0.06)"
        border="1px solid"
        borderColor="whiteAlpha.300"
        borderRadius="lg"
        p={{ base: 5, md: 8 }}
      >
        <Stack spacing={6}>
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
            <Box>
              <Badge colorScheme="cyan" mb={2}>
                Review
              </Badge>
              <Heading color="white" size="lg">
                {score} / {exam.questions.length} correct
              </Heading>
              <Text color="whiteAlpha.800">{exam.title}</Text>
            </Box>
            <HStack>
              <Button leftIcon={<RepeatIcon />} colorScheme="cyan" onClick={resetExam}>
                Retake
              </Button>
              <Button variant="outline" colorScheme="cyan" onClick={() => setExam(null)}>
                Import another
              </Button>
            </HStack>
          </Flex>

          <VStack spacing={4} align="stretch">
            {exam.questions.map((question, index) => {
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
                        colorScheme="cyan"
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
      bg="rgba(255,255,255,0.06)"
      border="1px solid"
      borderColor="whiteAlpha.300"
      borderRadius="lg"
      p={{ base: 5, md: 8 }}
      boxShadow="0 20px 80px rgba(0, 0, 0, 0.35)"
      backdropFilter="blur(12px)"
    >
      <Stack spacing={6}>
        <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
          <Box>
            <Badge colorScheme="cyan" mb={2}>
              Practice mode
            </Badge>
            <Heading color="white" size="lg">
              {exam.title}
            </Heading>
            {exam.description && <Text color="whiteAlpha.800">{exam.description}</Text>}
          </Box>
          <HStack>
            <Button variant="outline" colorScheme="cyan" onClick={() => setExam(null)}>
              Import
            </Button>
            <Button leftIcon={<RepeatIcon />} variant="outline" colorScheme="cyan" onClick={resetExam}>
              Reset
            </Button>
          </HStack>
        </Flex>

        <Box>
          <Flex justify="space-between" mb={2} color="whiteAlpha.800">
            <Text>
              Question {currentIndex + 1} of {exam.questions.length}
            </Text>
            <Text>{answeredCount} answered</Text>
          </Flex>
          <Progress value={((currentIndex + 1) / exam.questions.length) * 100} colorScheme="cyan" borderRadius="full" />
        </Box>

        {currentQuestion && (
          <Box bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={{ base: 4, md: 6 }}>
            <Stack spacing={6}>
              <Box
                bg="blackAlpha.300"
                border="1px solid"
                borderColor="cyan.700"
                borderLeftWidth="4px"
                borderRadius="md"
                p={{ base: 4, md: 5 }}
              >
                <Text color="cyan.100" fontFamily="'JetBrains Mono', monospace" fontSize="sm" fontWeight="700" mb={3}>
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
                        borderColor={isSelected ? "cyan.300" : "whiteAlpha.400"}
                        borderRadius="md"
                        bg={isSelected ? "rgba(8, 145, 178, 0.22)" : "rgba(255,255,255,0.04)"}
                        color="whiteAlpha.900"
                        px={4}
                        py={3}
                        cursor="pointer"
                        transition="background 0.15s ease, border-color 0.15s ease"
                        _hover={{ borderColor: "cyan.300", bg: isSelected ? "rgba(8, 145, 178, 0.28)" : "whiteAlpha.100" }}
                        _focusVisible={{ borderColor: "cyan.200", boxShadow: "0 0 0 2px var(--chakra-colors-cyan-300)" }}
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
                            borderColor={isSelected ? "cyan.300" : "whiteAlpha.500"}
                            borderRadius="full"
                            bg={isSelected ? "cyan.400" : "transparent"}
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
                                  colorScheme="cyan"
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
            colorScheme="cyan"
            onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
            isDisabled={currentIndex === 0}
          >
            Previous
          </Button>
          <HStack>
            <Button
              colorScheme="cyan"
              onClick={() => setCurrentIndex((index) => Math.min(index + 1, exam.questions.length - 1))}
              isDisabled={currentIndex === exam.questions.length - 1}
            >
              Next
            </Button>
            <Button leftIcon={<CheckCircleIcon />} colorScheme="green" onClick={() => setIsReviewing(true)}>
              Finish
            </Button>
          </HStack>
        </Flex>

        <Divider borderColor="whiteAlpha.300" />

        <SimpleGrid columns={{ base: 4, sm: 6, md: 10 }} spacing={2}>
          {exam.questions.map((question, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = answers[question.id] !== undefined;

            return (
              <Button
                key={question.id}
                size="sm"
                variant="outline"
                aria-label={`Go to question ${index + 1}`}
                bg={isCurrent ? "cyan.400" : isAnswered ? "cyan.900" : "whiteAlpha.100"}
                borderColor={isCurrent ? "cyan.200" : isAnswered ? "cyan.300" : "whiteAlpha.500"}
                color={isCurrent ? "gray.900" : "white"}
                fontWeight="700"
                _hover={{
                  bg: isCurrent ? "cyan.300" : isAnswered ? "cyan.800" : "whiteAlpha.200",
                  borderColor: "cyan.200",
                }}
                _active={{ bg: isCurrent ? "cyan.300" : "cyan.800" }}
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
