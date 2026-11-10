import {
  Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel,
  Box, Heading, Kbd, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Button, Stack, Text, UnorderedList,
} from "@chakra-ui/react";

const instructions = [
  { title: "Settings and appearance", steps: [
    "Use the gear icon at the bottom left to open Settings. Choose Graphite, Midnight, Warm charcoal, Forest, Rose, OLED Black, Catppuccin Mocha, One Dark, Daylight, Paper, or Catppuccin Latte from the theme previews. Pick a preset or custom accent color, larger text, or reduced motion. Changes save on this device and are included in complete backups.",
  ] },
  { title: "Backups and progress dashboard", steps: [
    "Settings → Backup and restore (also in the File menu) saves the entire library, including private progress, scores, drafts, archives, images, and exact local Git history. Close editors first; drafts are kept. Backups are not encrypted, and are different from shared collections.",
    "Choose a backup to preview it, then explicitly confirm replacement to restore. Restoring replaces this device’s library and versions; it does not merge them. Keep a separate backup of your current library when you want to retain both. Normal restore failures keep the original data.",
    "Open Progress dashboard using the chart icon in the left toolbar or the View menu. Filter by exam, mode, run type, and version. The chart shows recent scores, and topic accuracy identifies areas to work on. Older scores remain usable; topic statistics are recorded on future attempts.",
  ] },
  { title: "Timers, pools, feedback, and shortcuts", steps: [
    "On the exam overview, set a question count to draw a smaller random pool, or choose a topic. Practice uses the pool in original order; Exam Mode shuffles it. The same pool is kept when resuming, and pool scores are labeled separately from full runs.",
    "Exam Mode can use a time limit of up to 240 minutes. The deadline keeps running when you leave the session or close the app. Expired sessions are submitted automatically, including when reopened. Zero means untimed. Settings apply to new attempts; resuming keeps saved settings.",
    "Practice Mode can show the correct answer, explanation, and answer images immediately after you answer. Once feedback is shown, that question’s answer is locked for the attempt. Exam Mode always waits until the results screen.",
    "While answering, use number keys 1–9 to choose an answer, left/right arrows to move between questions, and F to toggle the review mark. These shortcuts apply only to the active question screen and do not run while typing in a field or using a dialog.",
    "Add comma-separated topics or tags to questions in the editor. Tags are included in exam exports and version comparisons; changing tags alone keeps your question version and saved progress.",
  ] },
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
      "Focused practice starts a smaller set of missed or marked questions from the overview or results. Missed includes unanswered questions after finishing. Sets use the original question order, have their own saved session and score labels, and do not replace your full exam progress or affect full-exam averages. Resume focused practice continues your last set. Starting another set replaces the previous focused session; its completed score remains in history.",
      "Use Mark for review on any question in Practice Mode, Exam Mode, or the results review. Marked questions show a flag in the question navigator. On the results screen, Show marked only filters the review to those questions. Marks save with the current session and exam version, stay private when exporting, and clear when you start a new attempt.",
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
    <ModalContent mx={4} bg="var(--surface)" border="1px solid var(--border)" maxH="calc(100dvh - 48px)">
      <ModalHeader pb={2}>Force Exam guide</ModalHeader>
      <ModalCloseButton aria-label="Close help" />
      <ModalBody>
        <Text color="var(--muted)" fontSize="sm" mb={5}>Create your exams, study at your own pace, and pick up where you left off.</Text>
        <Accordion allowMultiple defaultIndex={[0]}>
          {instructions.map((section) => <AccordionItem key={section.title} borderColor="var(--border)">
            <AccordionButton px={0} py={4} _expanded={{ color: "var(--accent-text)" }}><Box flex="1" textAlign="left" fontSize="sm" fontWeight="500">{section.title}</Box><AccordionIcon /></AccordionButton>
            <AccordionPanel px={1} pb={4}><UnorderedList spacing={3} fontSize="sm" color="var(--muted)" lineHeight="1.8">{section.steps.map((step) => <ListItem key={step}>{step}</ListItem>)}</UnorderedList></AccordionPanel>
          </AccordionItem>)}
        </Accordion>
        <Heading as="h3" size="xs" mt={6} mb={4}>Keyboard shortcuts</Heading>
        <Stack spacing={3} fontSize="xs" color="var(--muted)" pb={2}>
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
