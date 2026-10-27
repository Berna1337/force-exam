import {
  Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel,
  Box, Heading, Kbd, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Button, Stack, Text, UnorderedList,
} from "@chakra-ui/react";

const instructions = [
  {
    title: "Organize folders and archive exams",
    steps: [
      "Use the + beside EXAMS, or New folder in the workspace, to create a folder. Select a folder before creating or importing an exam to file it there automatically.",
      "Use a folder’s ⋯ menu for subfolders, renaming, moving, or archiving. Drag exams and folders into other folders, or use Move to folder. Drop on Library to move an item back to the root.",
      "Archive an exam or folder when you no longer need it in the active library. Archiving keeps all content, Git versions, scores, saved progress, and editor drafts. Active study statistics exclude archived exams.",
      "Open Archive in the sidebar to browse archived items, inspect history, or export. Restore an item to study or edit again. Restoring a single item from an archived parent puts it at the library root; restoring the whole folder keeps its remaining contents together.",
      "Only empty folders can be removed. Permanent exam deletion is separate from archiving and still asks for confirmation.",
    ],
  },
  {
    title: "Create or import your first exam",
    steps: [
      "Choose Create exam in the sidebar or File menu to open the visual editor.",
      "Give the exam a title, write each question and at least two answer choices, then select the circle next to the correct answer.",
      "Add explanations or pictures if you like. Upload images, or paste an http(s) image URL and choose Add URL. Linked pictures download immediately and are embedded for offline use. Use Add question, duplicate, and the arrow buttons to organize your questions.",
      "Choose Save exam to add it to your library and open its overview. Saving automatically embeds any remaining image links; if a download fails, your draft stays open for retry. To use an existing JSON exam, choose Import exam, open the file, then choose Import exam to save it and open its overview. Choose a mode there when you’re ready to start. You can also load the included sample.",
    ],
  },
  {
    title: "Study, pause, and resume",
    steps: [
      "Selecting an exam opens its overview, with question counts, scores, and saved progress. Choose Start practice, Resume practice, or View last result when you are ready. Browsing the overview does not start a session.",
      "While answering, use Back to overview to pause without losing your answers or place. Resume practice or Resume exam continues the same session and question order. Editing, exports, versions, and starting a new attempt are available from the overview.",
      "Choose Practice Mode for the original question order, or Exam Mode to shuffle questions once per new attempt. Resuming an Exam Mode run keeps its saved order. Answer choices stay in their original order in both modes.",
      "During practice, select an answer for each question. Use Previous, Next, or the question numbers to navigate. Exam overview returns to the exam’s landing page.",
      "Your answers and current question save automatically. Close a tab or quit the app, then reopen the exam from the library to resume.",
      "Choose Finish to see your score, correct answers, and explanations, then Go to overview to return to the exam. Unanswered questions count as incorrect. Score history records whether each run used Practice Mode or Exam Mode.",
      "Retake or New attempt starts a fresh session. Completed scores stay in Score history; an unfinished session is replaced when you start a new one.",
    ],
  },
  {
    title: "Edit exams and understand score history",
    steps: [
      "Use the pencil beside an exam or Edit exam above a practice session to open its editor.",
      "Drafts save as you type. If you close the editor or restart, open that editor again to continue. Reopen Create exam to resume a new exam draft.",
      "Changing the title or description keeps your progress. Changing questions creates a new version when you confirm Save new version, and starts a fresh practice session.",
      "Previous scores remain in Score history with their version and completion date. Latest and Best refer to the current version.",
      "Choose Versions above an exam to browse its local Git snapshots. Switch opens that snapshot and restores its saved session. Newer snapshots remain available, and editing an older one creates a new saved version.",
      "Use Versions → Compare versions to select any two snapshots. The comparison shows added, removed, moved, and edited questions, answer choices, correct answers, explanations, and pictures side by side. It does not switch your active version or change your progress.",
      "Git support is bundled in the desktop app and works offline. History starts from the content available when Git tracking was added; older score-only versions may not have saved questions.",
    ],
  },
  {
    title: "Local files, offline images, and deletion",
    steps: [
      "Exams, drafts, progress, and scores stay on this device. Keep your original JSON files as backups.",
      "Importing an exam or collection automatically downloads linked pictures and embeds them for offline use. A connection is needed once for web images. If an image cannot be downloaded, the import stays open so you can fix the link and retry; no partial exam is saved.",
      "Use a folder’s ⋯ → Export folder to share its complete collection, including nested and empty folders, exams, and embedded images. Import collection in the sidebar adds a new copy to the Library or Archive, without overwriting existing items. Collections exclude scores, saved runs, and version history.",
      "Archive supports dragging exams and folders, moving through menus, and creating subfolders. Drop on Archive to move to its root; items stay archived until you restore them.",
      "Export JSON also embeds remaining linked pictures, so the recipient gets the images in the file. Exports contain exam content without your scores, saved answers, or Git history. If a picture cannot be downloaded, fix the link or remove it before exporting.",
      "Search the sidebar to find an exam. The sidebar toggle gives you more room to study; open tabs keep separate sessions available.",
      "The trash button deletes an exam after confirmation, including its saved progress and score history. Your original JSON file is kept.",
    ],
  },
];

export default function AppHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside" isCentered>
    <ModalOverlay bg="blackAlpha.700" />
    <ModalContent mx={4} bg="#232323" border="1px solid #3a3a3a" maxH="calc(100dvh - 48px)">
      <ModalHeader pb={2}>Force Exam guide</ModalHeader>
      <ModalCloseButton aria-label="Close help" />
      <ModalBody>
        <Text color="#aaa" fontSize="sm" mb={5}>Create your exams, study at your own pace, and pick up where you left off.</Text>
        <Accordion allowMultiple defaultIndex={[0]}>
          {instructions.map((section) => <AccordionItem key={section.title} borderColor="#3a3a3a">
            <AccordionButton px={0} py={4} _expanded={{ color: "purple.200" }}><Box flex="1" textAlign="left" fontSize="sm" fontWeight="500">{section.title}</Box><AccordionIcon /></AccordionButton>
            <AccordionPanel px={1} pb={4}><UnorderedList spacing={3} fontSize="sm" color="#aaa" lineHeight="1.8">{section.steps.map((step) => <ListItem key={step}>{step}</ListItem>)}</UnorderedList></AccordionPanel>
          </AccordionItem>)}
        </Accordion>
        <Heading as="h3" size="xs" mt={6} mb={4}>Keyboard shortcuts</Heading>
        <Stack spacing={3} fontSize="xs" color="#aaa" pb={2}>
          <Text><Kbd>Ctrl / ⌘</Kbd> + <Kbd>O</Kbd> <Box as="span" ml={3}>Import an exam</Box></Text>
          <Text><Kbd>Ctrl / ⌘</Kbd> + <Kbd>\</Kbd> <Box as="span" ml={3}>Toggle the sidebar</Box></Text>
          <Text><Kbd>F1</Kbd> <Box as="span" ml={3}>Open this guide</Box></Text>
          <Text><Kbd>Esc</Kbd> <Box as="span" ml={3}>Close this guide</Box></Text>
        </Stack>
      </ModalBody>
      <ModalFooter pt={3}><Button size="sm" colorScheme="purple" onClick={onClose}>Got it</Button></ModalFooter>
    </ModalContent>
  </Modal>;
}
