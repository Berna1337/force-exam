import { useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Code,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Progress,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { ArrowBackIcon, CheckCircleIcon, RepeatIcon, ViewIcon } from "@chakra-ui/icons";

type RawQuestion = {
  question?: unknown;
  prompt?: unknown;
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

type ExamQuestion = {
  id: string;
  prompt: string;
  options: string[];
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
  title: "Force Exam sample",
  description: "A tiny JSON exam to preview the practice flow.",
  questions: [
    {
      question: "Which field contains the answer choices?",
      options: ["title", "options", "description", "questions"],
      answer: "options",
      explanation: "Each question uses an options array for the selectable answers.",
    },
    {
      question: "What value can answer use?",
      options: ["Only text", "Only a number", "A number or matching option text", "A boolean"],
      answer: 2,
      explanation: "Force Exam accepts either a zero-based answer index or the matching option text.",
    },
  ],
};

const sampleJson = JSON.stringify(sampleExam, null, 2);

function parseAnswerIndex(answer: unknown, options: string[]) {
  if (typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer < options.length) {
    return answer;
  }

  if (typeof answer === "string") {
    const numericAnswer = Number(answer);
    if (Number.isInteger(numericAnswer) && numericAnswer >= 0 && numericAnswer < options.length) {
      return numericAnswer;
    }

    const matchingIndex = options.findIndex((option) => option.toLowerCase() === answer.toLowerCase());
    if (matchingIndex >= 0) {
      return matchingIndex;
    }
  }

  return -1;
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

    if (!Array.isArray(rawQuestion.options) || rawQuestion.options.length < 2) {
      throw new Error(`Question ${index + 1} needs at least two options.`);
    }

    const options = rawQuestion.options.map((option, optionIndex) => {
      if (typeof option !== "string" || option.trim().length === 0) {
        throw new Error(`Question ${index + 1}, option ${optionIndex + 1} must be a non-empty string.`);
      }
      return option.trim();
    });

    const answerIndex = parseAnswerIndex(rawQuestion.answer ?? rawQuestion.correctAnswer, options);
    if (answerIndex < 0) {
      throw new Error(`Question ${index + 1} needs answer as a zero-based index or matching option text.`);
    }

    return {
      id: `question-${index}`,
      prompt: prompt.trim(),
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

export default function ExamRunner({ onBack }: ExamRunnerProps) {
  const [jsonInput, setJsonInput] = useState(sampleJson);
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

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
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Could not import this exam JSON.");
    }
  };

  const resetExam = () => {
    setCurrentIndex(0);
    setAnswers({});
    setIsReviewing(false);
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
              <Code>answer</Code>. Answers can be zero-based indexes or matching option text.
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

              return (
                <Box key={question.id} bg="whiteAlpha.100" border="1px solid" borderColor={isCorrect ? "green.300" : "red.300"} borderRadius="lg" p={4}>
                  <HStack justify="space-between" align="flex-start" mb={3}>
                    <Text color="white" fontWeight="semibold">
                      {index + 1}. {question.prompt}
                    </Text>
                    <Badge colorScheme={isCorrect ? "green" : "red"}>{isCorrect ? "Correct" : "Missed"}</Badge>
                  </HStack>
                  <Stack spacing={2}>
                    <Text color="whiteAlpha.800">
                      Your answer: {selectedAnswer === undefined ? "Not answered" : question.options[selectedAnswer]}
                    </Text>
                    <Text color="green.200">Correct answer: {question.options[question.answerIndex]}</Text>
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
            <Text color="cyan.200" fontFamily="'JetBrains Mono', monospace" fontSize="sm" mb={3}>
              QUESTION {currentIndex + 1}
            </Text>
            <Heading color="white" size="md" lineHeight="1.35" mb={5}>
              {currentQuestion.prompt}
            </Heading>

            <RadioGroup
              value={answers[currentQuestion.id]?.toString() ?? ""}
              onChange={(value) => setAnswers((current) => ({ ...current, [currentQuestion.id]: Number(value) }))}
            >
              <Stack spacing={3}>
                {currentQuestion.options.map((option, index) => (
                  <Box key={option} border="1px solid" borderColor="whiteAlpha.300" borderRadius="md" px={4} py={3} _hover={{ borderColor: "cyan.300", bg: "whiteAlpha.100" }}>
                    <Radio value={index.toString()} colorScheme="cyan">
                      <Text color="whiteAlpha.900">{option}</Text>
                    </Radio>
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
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
          {exam.questions.map((question, index) => (
            <Button
              key={question.id}
              size="sm"
              variant={index === currentIndex ? "solid" : "outline"}
              colorScheme={answers[question.id] === undefined ? "gray" : "cyan"}
              onClick={() => setCurrentIndex(index)}
            >
              {index + 1}
            </Button>
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
