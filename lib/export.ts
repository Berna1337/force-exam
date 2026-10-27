declare global {
  interface Window {
    examFiles?: { exportCollection: (data: { title: string; json: string }) => Promise<{ saved: boolean }>; exportJson: (data: { title: string; json: string }) => Promise<{ saved: boolean }> };
  }
}

export async function exportExam(title: string, json: string) {
  const portable = await makeExamPortable(json);
  if (window.examFiles) return (await window.examFiles.exportJson({ title, json: portable.json })).saved;
  const exam = JSON.parse(portable.json);
  const content = JSON.stringify({ title: exam.title, ...(typeof exam.description === "string" ? { description: exam.description } : {}), questions: exam.questions }, null, 2) + "\n";
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Force-Exam-${title.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 80) || "exam"}.json`;
  document.body.appendChild(anchor);
  anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
import { makeExamPortable } from "./images";

export async function exportCollectionFile(title: string, json: string) {
  if (window.examFiles?.exportCollection) return (await window.examFiles.exportCollection({ title, json })).saved;
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url;
  anchor.download = `Force-Exam-Collection-${title.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 80) || "folder"}.json`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); return true;
}
