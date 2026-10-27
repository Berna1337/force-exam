import { useEffect, useState } from "react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Badge, Box, Button, FormControl, FormLabel, Heading, HStack, Image, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner, Stack, Text,
} from "@chakra-ui/react";
import { compareExams } from "../lib/compare";
import { normalizeExam, type ExamQuestion } from "../lib/exam";
import type { GitVersion } from "../lib/git";

type Comparison = ReturnType<typeof compareExams>;
function QuestionSnapshot({ question, label, changed }: { question?: ExamQuestion; label: string; changed: boolean }) {
  return <Box minW={0} p={4} bg="#202020" border="1px solid" borderColor={changed ? "#514264" : "#333"} borderRadius="md">
    <Text fontSize="10px" color="#999" letterSpacing=".08em" mb={3}>{label}</Text>
    {!question ? <Text fontSize="sm" color="#777">Question not present</Text> : <Stack spacing={3}>
      <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{question.prompt}</Text>
      {question.images.map((image, index) => <Box key={index}><Image src={image.url} alt={image.alt ?? `Question image ${index + 1}`} maxH="140px" objectFit="contain" /><Text fontSize="xs" color="#999">{image.description}</Text>{image.alt && <Text fontSize="10px" color="#777">Alt text: {image.alt}</Text>}</Box>)}
      {question.options.map((option, index) => <Box key={index} p={2} borderRadius="md" bg={index === question.answerIndex ? "#2b3c32" : "#292929"} border="1px solid" borderColor={index === question.answerIndex ? "#466550" : "#3a3a3a"}>
        <HStack align="start" fontSize="xs"><Text color="#999">{String.fromCharCode(65 + index)}.</Text><Text flex="1" whiteSpace="pre-wrap" overflowWrap="anywhere">{option.text || "Image answer"}</Text>{index === question.answerIndex && <Badge colorScheme="green" fontSize="9px">Correct</Badge>}</HStack>
        {option.images.map((image, imageIndex) => <Box key={imageIndex} mt={2}><Image src={image.url} alt={image.alt ?? `Answer image ${imageIndex + 1}`} maxH="100px" objectFit="contain" /><Text fontSize="10px" color="#999">{image.description}</Text>{image.alt && <Text fontSize="10px" color="#777">Alt text: {image.alt}</Text>}</Box>)}
      </Box>)}
      {question.explanation && <Box><Text fontSize="10px" color="#999" mb={1}>EXPLANATION</Text><Text fontSize="xs" whiteSpace="pre-wrap">{question.explanation}</Text></Box>}
    </Stack>}
  </Box>;
}

export default function ExamComparison({ examId, currentCommit, versions, isOpen, onClose }: {
  examId: string; currentCommit?: string; versions: GitVersion[]; isOpen: boolean; onClose: () => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState<Comparison | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!isOpen || !versions.length) return;
    const current = versions.find((version) => version.oid === currentCommit) ?? versions[0];
    setTo(current.oid);
    setFrom(versions.find((version) => version.oid === current.basedOn)?.oid ?? versions.find((version) => version.oid !== current.oid)?.oid ?? current.oid);
  }, [isOpen, versions, currentCommit]);
  useEffect(() => {
    if (!isOpen || !from || !to) return;
    let active = true;
    setLoading(true); setError(""); setResult(null);
    void (async () => {
      if (!window.examGit) throw new Error("Version comparison is available in the desktop app.");
      const [before, after] = await Promise.all([window.examGit.read(examId, from), window.examGit.read(examId, to)]);
      const comparison = compareExams(normalizeExam(JSON.parse(before.json)), normalizeExam(JSON.parse(after.json)));
      if (active) setResult(comparison);
    })().catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not compare these snapshots."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, examId, from, to]);
  const versionName = (version: GitVersion) => `Version ${version.revision} · ${version.oid.slice(0, 7)} · ${new Date(version.createdAt).toLocaleString()}`;
  return <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside" isCentered>
    <ModalOverlay bg="blackAlpha.700" /><ModalContent mx={3} maxH="calc(100dvh - 32px)" bg="#232323" border="1px solid #444">
      <ModalHeader pb={2}>Compare exam versions</ModalHeader><ModalCloseButton aria-label="Close comparison" />
      <ModalBody>
        <Text fontSize="xs" color="#999" mb={4}>Compare saved snapshots without changing your selected version, answers, or scores.</Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={5}>
          <FormControl><FormLabel fontSize="xs">From</FormLabel><Select aria-label="Compare from version" size="sm" value={from} onChange={(event) => setFrom(event.target.value)}>{versions.map((version) => <option key={version.oid} value={version.oid}>{versionName(version)}</option>)}</Select></FormControl>
          <FormControl><FormLabel fontSize="xs">To</FormLabel><Select aria-label="Compare to version" size="sm" value={to} onChange={(event) => setTo(event.target.value)}>{versions.map((version) => <option key={version.oid} value={version.oid}>{versionName(version)}</option>)}</Select></FormControl>
        </SimpleGrid>
        {loading && <Spinner size="sm" />}{error && <Text role="alert" color="red.300" fontSize="sm">{error}</Text>}
        {result && <Stack spacing={5} role="region" aria-label="Version comparison results">
          <HStack spacing={3} flexWrap="wrap">{Object.entries(result.summary).map(([label, count]) => <Badge key={label} colorScheme={label === "added" ? "green" : label === "removed" ? "red" : "purple"}>{count} {label}</Badge>)}<Text fontSize="xs" color="#999">{result.unchanged} unchanged</Text></HStack>
          {result.metadata.map((field) => <Box key={field.label}><Heading size="xs" mb={2}>{field.label} changed</Heading><SimpleGrid columns={{ base: 1, md: 2 }} gap={3}><Text fontSize="sm" p={3} bg="#352727" whiteSpace="pre-wrap">{field.before || "No description"}</Text><Text fontSize="sm" p={3} bg="#28372e" whiteSpace="pre-wrap">{field.after || "No description"}</Text></SimpleGrid></Box>)}
          {!result.questions.length && <Text fontSize="sm" color="#aaa" py={4}>No question or answer changes between these snapshots.</Text>}
          {result.questions.map((question, index) => <Box key={index} borderTop="1px solid #3a3a3a" pt={4}>
            <HStack mb={3} flexWrap="wrap"><Heading size="xs">{question.oldIndex === undefined ? `Question ${question.newIndex! + 1}` : question.newIndex === undefined ? `Question ${question.oldIndex + 1}` : question.oldIndex === question.newIndex ? `Question ${question.oldIndex + 1}` : `Question ${question.oldIndex + 1} → ${question.newIndex + 1}`}</Heading><Badge colorScheme={question.kind === "added" ? "green" : question.kind === "removed" ? "red" : "purple"}>{question.kind}</Badge>{question.moved && question.kind !== "moved" && <Badge>Moved</Badge>}</HStack>
            <HStack mb={3} flexWrap="wrap">{question.fields.map((field) => <Badge variant="outline" colorScheme="purple" key={field}>{field} changed</Badge>)}</HStack>
            {question.answers.length > 0 && <Text fontSize="xs" color="#aaa" mb={3}>{question.answers.map((answer) => `Answer ${answer.oldIndex === undefined ? String.fromCharCode(65 + answer.newIndex!) : answer.newIndex !== undefined && answer.oldIndex !== answer.newIndex ? `${String.fromCharCode(65 + answer.oldIndex)} → ${String.fromCharCode(65 + answer.newIndex)}` : String.fromCharCode(65 + answer.oldIndex)} ${answer.kind}`).join(" · ")}</Text>}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}><QuestionSnapshot question={question.before} label="FROM" changed={false} /><QuestionSnapshot question={question.after} label="TO" changed /></SimpleGrid>
          </Box>)}
          <Text fontSize="10px" color="#777">Older snapshots without question identities are matched by content. Large rewrites can appear as removed and added questions.</Text>
        </Stack>}
      </ModalBody>
      <ModalFooter><Button size="sm" variant="ghost" mr={3} leftIcon={<ArrowForwardIcon />} onClick={() => { setFrom(to); setTo(from); }}>Swap versions</Button><Button size="sm" colorScheme="purple" onClick={onClose}>Close comparison</Button></ModalFooter>
    </ModalContent>
  </Modal>;
}
