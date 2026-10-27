import { useEffect, useState } from "react";
import {
  AddIcon, ArrowDownIcon, ArrowUpIcon, CheckIcon, CopyIcon, DeleteIcon, SmallCloseIcon,
} from "@chakra-ui/icons";
import {
  Alert, AlertIcon, Box, Button, Flex, FormControl, FormLabel, Heading, HStack,
  IconButton, Image, Input, Radio, SimpleGrid, Stack, Text, Textarea, Tooltip,
} from "@chakra-ui/react";
import { normalizeExam, questionContent, type ExamImage } from "../lib/exam";
import { downloadImage } from "../lib/images";
import {
  draftKey, duplicateQuestion, editExam, type EditorExam, type EditorQuestion,
  newExam, newOption, newQuestion, readDraft, removeOption, serializeExam,
} from "../lib/editor";

type Props = {
  examId?: string;
  initialJson?: string;
  gitCommit?: string;
  onSave: (json: string) => Promise<boolean>;
  onClose: () => void;
};

function MediaEditor({ label, images, onChange, onAdd, onBusy }: {
  label: string; images: ExamImage[]; onChange: (images: ExamImage[]) => void; onAdd: (images: ExamImage[]) => void; onBusy: (delta: number) => void;
}) {
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const addUrl = async () => {
    if (reading || downloading) return;
    let url: URL;
    try {
      url = new URL(imageUrl.trim());
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch { setError("Enter a valid http:// or https:// image URL."); return; }
    setDownloading(true); onBusy(1); setError("");
    try {
      const data = await downloadImage(url.href);
      onAdd([{ url: data }]); setImageUrl("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not download this image."); }
    finally { setDownloading(false); onBusy(-1); }
  };
  return <Stack spacing={2}>
    {images.map((image, index) => <HStack key={index} align="flex-start" p={2} bg="#202020" borderRadius="md">
      <Image src={image.url} alt={image.alt || `${label} ${index + 1}`} boxSize="54px" objectFit="contain" />
      <Stack flex="1" minW={0} spacing={2}>
        <Input size="xs" aria-label={`${label} ${index + 1} alt text`} placeholder="Alt text" value={image.alt ?? ""} onChange={(event) => onChange(images.map((item, i) => i === index ? { ...item, alt: event.target.value } : item))} />
        <Input size="xs" aria-label={`${label} ${index + 1} caption`} placeholder="Caption (optional)" value={image.description ?? ""} onChange={(event) => onChange(images.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} />
      </Stack>
      <IconButton aria-label={`Remove ${label.toLowerCase()} ${index + 1}`} size="xs" variant="ghost" icon={<SmallCloseIcon />} onClick={() => onChange(images.filter((_, i) => i !== index))} />
    </HStack>)}
    <FormControl>
      <FormLabel fontSize="xs" color="#999">{label} (optional)</FormLabel>
      <Input type="file" aria-label={`Add ${label.toLowerCase()}`} size="sm" p={1} accept="image/png,image/jpeg,image/gif,image/webp,image/avif" multiple disabled={reading || downloading} onChange={async (event) => {
        const input = event.currentTarget;
        const files = Array.from(input.files ?? []);
        if (!files.length) return;
        setReading(true); onBusy(1); setError("");
        try {
          const added = await Promise.all(files.map((file) => new Promise<ExamImage>((resolve, reject) => {
            if (!/^image\/(png|jpeg|gif|webp|avif)$/.test(file.type)) return reject(new Error("Choose PNG, JPEG, GIF, WebP, or AVIF images."));
            const reader = new FileReader();
            reader.onload = () => resolve({ url: String(reader.result), alt: file.name });
            reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
            reader.readAsDataURL(file);
          })));
          onAdd(added);
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add these images."); }
        finally { input.value = ""; setReading(false); onBusy(-1); }
      }} />
    </FormControl>
    <FormControl>
      <FormLabel fontSize="xs" color="#999">Or paste an image URL</FormLabel>
      <HStack><Input aria-label={`${label} URL`} size="sm" placeholder="https://example.com/image.png" value={imageUrl} isDisabled={downloading} onChange={(event) => setImageUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addUrl(); } }} />
        <Button size="sm" variant="outline" aria-label={`Add ${label.toLowerCase()} URL`} isLoading={downloading} isDisabled={reading} onClick={addUrl}>Add URL</Button></HStack>
      <Text fontSize="10px" color="#888" mt={1}>The image downloads now and is included in the exam for offline use and sharing.</Text>
    </FormControl>
    {error && <Text role="alert" fontSize="xs" color="red.300">{error}</Text>}
  </Stack>;
}

export default function ExamEditor({ examId, initialJson, gitCommit, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<EditorExam | null>(null);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [error, setError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [busy, setBusy] = useState(0);
  const [saving, setSaving] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);

  useEffect(() => {
    try {
      const saved = readDraft(localStorage.getItem(draftKey(examId, gitCommit)) ?? localStorage.getItem(draftKey(examId)), initialJson);
      setDraft(saved ?? (initialJson ? editExam(normalizeExam(JSON.parse(initialJson))) : newExam()));
    } catch {
      try { setDraft(initialJson ? editExam(normalizeExam(JSON.parse(initialJson))) : newExam()); }
      catch { setError("This exam could not be opened in the editor. Your original exam has been kept."); }
    }
  }, [examId, initialJson, gitCommit]);

  useEffect(() => {
    if (!draft) return;
    try {
      localStorage.setItem(draftKey(examId, gitCommit), JSON.stringify({ sourceJson: initialJson ?? null, draft }));
      setDraftError("");
    } catch { setDraftError("This draft could not be saved. Keep this editor open until you save the exam."); }
  }, [draft, examId, initialJson, gitCommit]);

  if (!draft) return <Stack>{error && <Text role="alert" color="red.300">{error}</Text>}<Button onClick={onClose} alignSelf="flex-start">Close editor</Button></Stack>;
  const question = draft.questions[activeQuestion];
  const changeQuestion = (next: EditorQuestion) => {
    setDraft((current) => current ? { ...current, questions: current.questions.map((item) => item.id === next.id ? next : item) } : current);
    setResetConfirmed(false);
  };
  const changeQuestions = (questions: EditorQuestion[], nextIndex: number) => {
    setDraft({ ...draft, questions }); setActiveQuestion(nextIndex); setResetConfirmed(false);
  };
  const addImages = (questionId: string, images: ExamImage[], optionId?: string) => {
    setDraft((current) => current ? { ...current, questions: current.questions.map((item) => item.id !== questionId ? item : optionId ? {
      ...item, options: item.options.map((option) => option.id === optionId ? { ...option, images: [...option.images, ...images] } : option),
    } : { ...item, images: [...item.images, ...images] }) } : current);
    setResetConfirmed(false);
  };
  const save = async () => {
    if (saving) return;
    try {
      const json = serializeExam(draft);
      const normalized = normalizeExam(JSON.parse(json));
      const questionContentChanged = initialJson && JSON.stringify(questionContent(normalizeExam(JSON.parse(initialJson)))) !== JSON.stringify(questionContent(normalized));
      if (questionContentChanged && !resetConfirmed) { setResetConfirmed(true); return; }
      setSaving(true);
      if (await onSave(json)) {
        try { localStorage.removeItem(draftKey(examId, gitCommit)); localStorage.removeItem(draftKey(examId)); } catch { /* A saved exam is still safe if clearing its draft fails. */ }
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save this exam.";
      setError(message);
      const number = message.match(/Question (\d+)/i);
      if (number) setActiveQuestion(Math.min(Number(number[1]) - 1, draft.questions.length - 1));
    } finally {
      setSaving(false);
    }
  };
  return <fieldset disabled={saving} style={{ border: 0, minWidth: 0 }}><Stack spacing={7} aria-label="Exam editor">
    <Flex gap={4} justify="space-between" align="flex-start" flexWrap="wrap">
      <Box><Text color="purple.300" fontFamily="mono" fontSize="xs" mb={2}>EXAM EDITOR</Text><Heading size="lg">{examId ? "Edit exam" : "Create an exam"}</Heading><Text color="#999" fontSize="xs" mt={2}>{draftError || "Draft saved locally. Save the exam when you’re ready to study."}</Text></Box>
      <HStack><Button variant="ghost" size="sm" onClick={onClose} isDisabled={saving}>Close editor</Button><Button colorScheme="purple" size="sm" leftIcon={<CheckIcon />} onClick={save} isLoading={saving} loadingText="Saving exam and images" isDisabled={busy > 0}>{resetConfirmed ? "Save new version" : "Save exam"}</Button></HStack>
    </Flex>
    {error && <Alert status="error" borderRadius="md"><AlertIcon />{error}</Alert>}
    {resetConfirmed && <Alert status="info" borderRadius="md"><AlertIcon /><Text fontSize="sm">The questions have changed. Saving starts a fresh practice session. Earlier scores remain in the history under their previous version. Select “Save new version” to continue.</Text></Alert>}
    <Stack spacing={4}>
      <FormControl isRequired><FormLabel fontSize="sm">Exam title</FormLabel><Input aria-label="Exam title" value={draft.title} placeholder="e.g. Biology — Cell structure" onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></FormControl>
      <FormControl><FormLabel fontSize="sm">Description</FormLabel><Textarea aria-label="Description" rows={2} value={draft.description} placeholder="What does this exam cover?" onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></FormControl>
    </Stack>
    <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6} alignItems="start">
      <Stack spacing={2} aria-label="Editor questions">
        <HStack justify="space-between" mb={1}><Text fontSize="xs" fontWeight="600" color="#999">QUESTIONS · {draft.questions.length}</Text><IconButton aria-label="Add question" size="xs" variant="ghost" icon={<AddIcon />} onClick={() => changeQuestions([...draft.questions, newQuestion()], draft.questions.length)} /></HStack>
        {draft.questions.map((item, index) => <Button key={item.id} size="sm" h="auto" py={3} variant="ghost" justifyContent="flex-start" bg={index === activeQuestion ? "#37303f" : "#252525"} color={index === activeQuestion ? "purple.200" : "#aaa"} onClick={() => setActiveQuestion(index)}><Text noOfLines={2} whiteSpace="normal" textAlign="left" fontWeight="400">{index + 1}. {item.prompt || "Untitled question"}</Text></Button>)}
        <Button size="sm" variant="outline" leftIcon={<AddIcon />} onClick={() => changeQuestions([...draft.questions, newQuestion()], draft.questions.length)}>Add question</Button>
      </Stack>
      <Stack key={question.id} gridColumn={{ lg: "span 2" }} spacing={5} p={{ base: 3, md: 5 }} bg="#252525" border="1px solid #363636" borderRadius="md">
        <Flex justify="space-between" gap={2} flexWrap="wrap"><Text color="purple.200" fontSize="sm" fontWeight="600">Question {activeQuestion + 1}</Text><HStack spacing={1}>
          <Tooltip label="Move up"><IconButton aria-label="Move question up" size="xs" variant="ghost" icon={<ArrowUpIcon />} isDisabled={activeQuestion === 0} onClick={() => { const next = [...draft.questions]; [next[activeQuestion - 1], next[activeQuestion]] = [next[activeQuestion], next[activeQuestion - 1]]; changeQuestions(next, activeQuestion - 1); }} /></Tooltip>
          <Tooltip label="Move down"><IconButton aria-label="Move question down" size="xs" variant="ghost" icon={<ArrowDownIcon />} isDisabled={activeQuestion === draft.questions.length - 1} onClick={() => { const next = [...draft.questions]; [next[activeQuestion + 1], next[activeQuestion]] = [next[activeQuestion], next[activeQuestion + 1]]; changeQuestions(next, activeQuestion + 1); }} /></Tooltip>
          <Tooltip label="Duplicate question"><IconButton aria-label="Duplicate question" size="xs" variant="ghost" icon={<CopyIcon />} onClick={() => { const next = [...draft.questions]; next.splice(activeQuestion + 1, 0, duplicateQuestion(question)); changeQuestions(next, activeQuestion + 1); }} /></Tooltip>
          <Tooltip label="Delete question"><IconButton aria-label="Delete question" size="xs" variant="ghost" color="red.300" icon={<DeleteIcon />} isDisabled={draft.questions.length === 1} onClick={() => changeQuestions(draft.questions.filter((item) => item.id !== question.id), Math.max(0, activeQuestion - 1))} /></Tooltip>
        </HStack></Flex>
        <FormControl isRequired><FormLabel fontSize="sm">Question text</FormLabel><Textarea aria-label="Question text" value={question.prompt} placeholder="Write your question…" onChange={(event) => changeQuestion({ ...question, prompt: event.target.value })} /></FormControl>
        <MediaEditor label="Question images" onAdd={(images) => addImages(question.id, images)} images={question.images} onChange={(images) => changeQuestion({ ...question, images })} onBusy={(delta) => setBusy((count) => count + delta)} />
        <Box><Text fontSize="sm" mb={1}>Answer choices</Text><Text color="#999" fontSize="xs" mb={4}>Select the circle next to the correct answer. Add text, images, or both.</Text>
          <Stack spacing={4} role="radiogroup" aria-label="Correct answer">
            {question.options.map((option, index) => <Box key={option.id} border="1px solid" borderColor={question.answerIndex === index ? "purple.400" : "#444"} borderRadius="md" p={3}>
              <HStack align="flex-start" mb={3}><Radio aria-label={`Answer ${index + 1} is correct`} colorScheme="purple" isChecked={question.answerIndex === index} onChange={() => changeQuestion({ ...question, answerIndex: index })} mt={2} /><Input aria-label={`Answer ${index + 1} text`} size="sm" placeholder={`Answer ${index + 1}`} value={option.text} onChange={(event) => changeQuestion({ ...question, options: question.options.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item) })} /><IconButton aria-label={`Remove answer ${index + 1}`} size="sm" variant="ghost" icon={<SmallCloseIcon />} isDisabled={question.options.length <= 2} onClick={() => changeQuestion(removeOption(question, index))} /></HStack>
              <MediaEditor label={`Answer ${index + 1} images`} onAdd={(images) => addImages(question.id, images, option.id)} images={option.images} onChange={(images) => changeQuestion({ ...question, options: question.options.map((item) => item.id === option.id ? { ...item, images } : item) })} onBusy={(delta) => setBusy((count) => count + delta)} />
            </Box>)}
          </Stack>
          <Button mt={3} size="sm" variant="ghost" leftIcon={<AddIcon />} onClick={() => changeQuestion({ ...question, options: [...question.options, newOption()] })}>Add answer</Button>
        </Box>
        <FormControl><FormLabel fontSize="sm">Explanation (optional)</FormLabel><Textarea aria-label="Explanation" rows={3} value={question.explanation} placeholder="Explain why this answer is correct…" onChange={(event) => changeQuestion({ ...question, explanation: event.target.value })} /></FormControl>
      </Stack>
    </SimpleGrid>
  </Stack></fieldset>;
}
