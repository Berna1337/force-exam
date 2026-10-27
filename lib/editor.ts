import type { Exam, ExamImage } from "./exam";

export type EditorOption = { id: string; text: string; images: ExamImage[] };
export type EditorQuestion = {
  id: string; prompt: string; images: ExamImage[]; options: EditorOption[];
  answerIndex: number; explanation: string;
};
export type EditorExam = { title: string; description: string; questions: EditorQuestion[] };
export const draftKey = (examId?: string, commit?: string) => `force-exam-editor-${examId ?? "new"}${commit ? `-${commit}` : ""}`;
export const newOption = (): EditorOption => ({ id: crypto.randomUUID(), text: "", images: [] });
export const newQuestion = (): EditorQuestion => ({
  id: crypto.randomUUID(), prompt: "", images: [], options: [newOption(), newOption()], answerIndex: -1, explanation: "",
});
export const newExam = (): EditorExam => ({ title: "", description: "", questions: [newQuestion()] });

export function editExam(exam: Exam): EditorExam {
  return {
    title: exam.title, description: exam.description ?? "",
    questions: exam.questions.map((question) => ({
      ...structuredClone(question), id: question.sourceId ?? crypto.randomUUID(), explanation: question.explanation ?? "",
      options: question.options.map((option) => ({ ...structuredClone(option), id: option.sourceId ?? crypto.randomUUID(), text: option.text ?? "" })),
    })),
  };
}

export function serializeExam(exam: EditorExam): string {
  if (!exam.title.trim()) throw new Error("Give your exam a title before saving.");
  return JSON.stringify({
    title: exam.title.trim(), description: exam.description.trim() || undefined,
    questions: exam.questions.map((question) => ({
      id: question.id, question: question.prompt, images: question.images,
      options: question.options.map((option) => ({ id: option.id, text: option.text.trim() || undefined, images: option.images })),
      answer: question.answerIndex, explanation: question.explanation.trim() || undefined,
    })),
  }, null, 2);
}

export function removeOption(question: EditorQuestion, index: number): EditorQuestion {
  return { ...question, options: question.options.filter((_, i) => i !== index),
    answerIndex: question.answerIndex === index ? -1 : question.answerIndex > index ? question.answerIndex - 1 : question.answerIndex };
}

export function duplicateQuestion(question: EditorQuestion): EditorQuestion {
  return { ...structuredClone(question), id: crypto.randomUUID(),
    options: question.options.map((option) => ({ ...structuredClone(option), id: crypto.randomUUID() })) };
}

// Drafts may be incomplete, but must have the shape expected by the form.
export function readDraft(json: string | null, sourceJson?: string): EditorExam | undefined {
  if (!json) return;
  const stored = JSON.parse(json);
  if (stored.sourceJson !== (sourceJson ?? null)) return;
  const exam = stored.draft;
  const imagesValid = (images: unknown) => Array.isArray(images) && images.every((image) => image &&
    typeof image.url === "string" && (image.alt === undefined || typeof image.alt === "string") &&
    (image.description === undefined || typeof image.description === "string"));
  if (!exam || typeof exam.title !== "string" || typeof exam.description !== "string" || !Array.isArray(exam.questions) || !exam.questions.length) return;
  if (!exam.questions.every((question: EditorQuestion) => question && typeof question.id === "string" &&
      typeof question.prompt === "string" && typeof question.explanation === "string" && Number.isInteger(question.answerIndex) &&
      imagesValid(question.images) && Array.isArray(question.options) && question.options.length >= 2 &&
      question.options.every((option) => option && typeof option.id === "string" && typeof option.text === "string" && imagesValid(option.images)))) return;
  return exam;
}
