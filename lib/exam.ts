type RawQuestion = {
  id?: unknown;
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

export type ExamImage = {
  url: string;
  alt?: string;
  description?: string;
};

export type ExamOption = {
  sourceId?: string;
  text?: string;
  images: ExamImage[];
};

export type ExamQuestion = {
  id: string;
  sourceId?: string;
  prompt: string;
  images: ExamImage[];
  options: ExamOption[];
  answerIndex: number;
  explanation?: string;
};

export type Exam = {
  title: string;
  description?: string;
  questions: ExamQuestion[];
};

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function getOptionalImageUrl(value: unknown, context: string) {
  const imageUrl = getOptionalText(value);
  if (!imageUrl) {
    return undefined;
  }

  if (imageUrl.startsWith("/") && !imageUrl.startsWith("//")) {
    return imageUrl;
  }

  if (/^data:image\/(png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/=\s]+$/i.test(imageUrl)) {
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

  throw new Error(`${context} image URL must be an absolute http(s) URL, a base64 image data URL, or start with "/".`);
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
    id?: unknown;
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
    sourceId: getOptionalText(rawOption.id),
    text,
    images: images.map((image) => ({
      ...image,
      alt: image.alt ?? getOptionalText(rawOption.imageAlt ?? rawOption.alt),
      description: image.description ?? getOptionalText(rawOption.imageDescription ?? rawOption.imageCaption),
    })),
  };
}

export function normalizeExam(value: unknown): Exam {
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
      sourceId: getOptionalText(rawQuestion.id),
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

// Identity supports comparisons; adding IDs to legacy files does not change a quiz.
export function questionContent(exam: Exam) {
  return exam.questions.map(({ id, sourceId, options, ...question }) => ({
    ...question, options: options.map(({ sourceId: optionId, ...option }) => option),
  }));
}
