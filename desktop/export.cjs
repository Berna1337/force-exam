function prepareExamExport(data) {
  if (!data || typeof data.title !== 'string' || typeof data.json !== 'string' || Buffer.byteLength(data.json) > 20 * 1024 * 1024) throw new Error('Invalid exam export.');
  const exam = JSON.parse(data.json);
  if (!exam || typeof exam.title !== 'string' || !Array.isArray(exam.questions) || !exam.questions.length) throw new Error('Invalid exam content.');
  const title = data.title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').trim().slice(0, 80) || 'exam';
  const shareable = { title: exam.title, ...(typeof exam.description === 'string' ? { description: exam.description } : {}), questions: exam.questions };
  return { fileName: `Force-Exam-${title}.json`, content: JSON.stringify(shareable, null, 2) + '\n' };
}
function prepareCollectionExport(data) {
  if (!data || typeof data.json !== 'string' || Buffer.byteLength(data.json) > 100 * 1024 * 1024) throw new Error('Invalid collection export.');
  const value = JSON.parse(data.json);
  if (value.format !== 'force-exam-collection' || value.version !== 1 || !Array.isArray(value.folders) || !Array.isArray(value.exams)) throw new Error('Invalid collection.');
  const folders = value.folders.map(({ id, name, parentId }) => ({ id, name, ...(parentId ? { parentId } : {}) }));
  const exams = value.exams.map(({ folderId, exam }) => ({ folderId, exam: JSON.parse(prepareExamExport({ title: exam.title, json: JSON.stringify(exam) }).content) }));
  const title = prepareExamExport({ title: data.title, json: JSON.stringify({ title: 'collection', questions: [{}] }) }).fileName;
  return { fileName: title.replace('Force-Exam-', 'Force-Exam-Collection-'), content: JSON.stringify({ format: value.format, version: 1, rootFolderId: value.rootFolderId, folders, exams }, null, 2) + '\n' };
}
module.exports = { prepareExamExport, prepareCollectionExport };
