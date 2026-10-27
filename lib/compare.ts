import type { Exam, ExamOption, ExamQuestion } from "./exam";

const optionContent = (option: ExamOption) => ({ text: option.text, images: option.images });
const content = (question: ExamQuestion) => ({ prompt: question.prompt, images: question.images,
  options: question.options.map(optionContent), answerIndex: question.answerIndex, explanation: question.explanation });
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const dice = (a: string[], b: string[]) => {
  const left = new Set(a), right = new Set(b);
  return left.size + right.size ? 2 * Array.from(left).filter((item) => right.has(item)).length / (left.size + right.size) : 0;
};
const words = (text: string) => text.toLowerCase().match(/[a-z0-9\u00c0-\uffff]+/g) ?? [];

type Identified = { sourceId?: string };
function matchItems<T extends Identified>(before: T[], after: T[], value: (item: T) => unknown,
  similarity?: (a: T, b: T, i: number, j: number) => number) {
  const pairs = new Map<number, number>(), used = new Set<number>();
  const match = (predicate: (a: T, b: T) => boolean) => before.forEach((item, i) => {
    if (pairs.has(i)) return;
    const candidates = after.map((next, j) => ({ next, j })).filter(({ next, j }) => !used.has(j) && predicate(item, next));
    candidates.sort((a, b) => Math.abs(i - a.j) - Math.abs(i - b.j));
    if (candidates[0]) { pairs.set(i, candidates[0].j); used.add(candidates[0].j); }
  });
  match((a, b) => !!a.sourceId && a.sourceId === b.sourceId);
  // Different stable IDs identify different items, even when their text is identical.
  const compatible = (a: T, b: T) => !a.sourceId || !b.sourceId || a.sourceId === b.sourceId;
  match((a, b) => compatible(a, b) && equal(value(a), value(b)));
  if (similarity) {
    const candidates: { i: number; j: number; score: number }[] = [];
    before.forEach((a, i) => after.forEach((b, j) => {
      if (!pairs.has(i) && !used.has(j) && compatible(a, b)) {
        const score = similarity(a, b, i, j);
        if (score > 0) candidates.push({ i, j, score });
      }
    }));
    candidates.sort((a, b) => b.score - a.score || Math.abs(a.i - a.j) - Math.abs(b.i - b.j));
    candidates.forEach(({ i, j }) => { if (!pairs.has(i) && !used.has(j)) { pairs.set(i, j); used.add(j); } });
  }
  const oldOrder = Array.from(pairs.keys()).sort((a, b) => a - b);
  const newOrder = Array.from(pairs.entries()).sort((a, b) => a[1] - b[1]).map(([i]) => i);
  return { pairs, used, moved: new Set(oldOrder.filter((i, rank) => newOrder[rank] !== i)) };
}

export type AnswerChange = {
  kind: "added" | "removed" | "changed" | "moved";
  before?: ExamOption; after?: ExamOption; oldIndex?: number; newIndex?: number;
};
export type QuestionChange = {
  kind: "added" | "removed" | "changed" | "moved";
  before?: ExamQuestion; after?: ExamQuestion; oldIndex?: number; newIndex?: number;
  moved: boolean; fields: string[]; answers: AnswerChange[];
};

function compareAnswers(before: ExamOption[], after: ExamOption[]): AnswerChange[] {
  const { pairs, used, moved } = matchItems(before, after, optionContent, (_a, _b, i, j) => i === j ? 0.1 : 0);
  const changes: AnswerChange[] = [];
  before.forEach((option, i) => {
    const j = pairs.get(i);
    if (j === undefined) changes.push({ kind: "removed", before: option, oldIndex: i });
    else if (!equal(optionContent(option), optionContent(after[j])) || moved.has(i)) changes.push({
      kind: equal(optionContent(option), optionContent(after[j])) ? "moved" : "changed", before: option, after: after[j], oldIndex: i, newIndex: j,
    });
  });
  after.forEach((option, j) => { if (!used.has(j)) changes.push({ kind: "added", after: option, newIndex: j }); });
  return changes;
}

export function compareExams(before: Exam, after: Exam) {
  const matched = matchItems(before.questions, after.questions, content, (a, b, i, j) => {
    if (a.prompt === b.prompt) return 2;
    const prompts = dice(words(a.prompt), words(b.prompt));
    const answers = dice(a.options.map((option) => JSON.stringify(optionContent(option))), b.options.map((option) => JSON.stringify(optionContent(option))));
    return prompts >= 0.35 || (answers >= 0.5 && i === j) ? prompts * 0.65 + answers * 0.35 : 0;
  });
  const questions: QuestionChange[] = [];
  let unchanged = 0;
  before.questions.forEach((question, i) => {
    const j = matched.pairs.get(i);
    if (j === undefined) { questions.push({ kind: "removed", before: question, oldIndex: i, moved: false, fields: [], answers: [] }); return; }
    const next = after.questions[j];
    const fields = [
      question.prompt !== next.prompt && "Question text",
      !equal(question.images, next.images) && "Question images",
      !equal(question.options.map(optionContent), next.options.map(optionContent)) && "Answer choices",
      (question.answerIndex !== next.answerIndex || !equal(optionContent(question.options[question.answerIndex]), optionContent(next.options[next.answerIndex]))) && "Correct answer",
      question.explanation !== next.explanation && "Explanation",
    ].filter((value): value is string => !!value);
    const moved = matched.moved.has(i);
    if (!fields.length && !moved) unchanged++;
    else questions.push({ kind: fields.length ? "changed" : "moved", before: question, after: next, oldIndex: i, newIndex: j, moved, fields, answers: compareAnswers(question.options, next.options) });
  });
  after.questions.forEach((question, j) => { if (!matched.used.has(j)) questions.push({ kind: "added", after: question, newIndex: j, moved: false, fields: [], answers: [] }); });
  questions.sort((a, b) => (a.newIndex ?? a.oldIndex ?? 0) - (b.newIndex ?? b.oldIndex ?? 0));
  return {
    metadata: [
      { label: "Exam title", before: before.title, after: after.title },
      { label: "Description", before: before.description ?? "", after: after.description ?? "" },
    ].filter((field) => field.before !== field.after),
    questions, unchanged,
    summary: { added: questions.filter((q) => q.kind === "added").length, removed: questions.filter((q) => q.kind === "removed").length,
      changed: questions.filter((q) => q.kind === "changed").length, moved: questions.filter((q) => q.moved).length },
  };
}
