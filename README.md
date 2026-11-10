## The Project
This project is a simple web application that allows users to practice for their exams by taking practice exams on Force Exam. Force Exam allows you to take your study to the next level by providing you with the tools needed to create the ultimate practice exams.

For this Force Exam uses JSON as the format of the exams and provides a simple but powerful editor to create the exams.

Currently, Force Exam is in the early stages of development and is not ready for production use.

## JSON Exam Format

Force Exam can import a portable JSON exam and run it locally in the browser.

```json
{
  "title": "Force Exam sample",
  "description": "A short practice set.",
  "questions": [
    {
      "question": "Which image shows where answer choices live in the JSON schema?",
      "images": [
        "https://example.com/question-image-1.png",
        {
          "url": "https://example.com/question-image-2.png",
          "alt": "A second reference image",
          "description": "This description renders under the image."
        }
      ],
      "options": [
        "title",
        {
          "text": "options",
          "images": [
            "https://example.com/answer-image-1.png",
            {
              "url": "https://example.com/answer-image-2.png",
              "caption": "Captions also render under answer images."
            }
          ],
          "imageAlt": "Code showing an options array"
        },
        "description",
        "questions"
      ],
      "answer": "options",
      "explanation": "Each question uses an options array for selectable answers."
    }
  ]
}
```

Each question supports `question` or `prompt`, optional `images`, `imageUrls`, `imageUrl`, or `image`, an `options` array with at least two choices, and `answer` or `correctAnswer`.

Options can be plain strings or objects. Object options support `text`, optional `images`, `imageUrls`, `imageUrl`, or `image`, and optional `imageAlt`, `imageDescription`, or `imageCaption`. Use `images` when you need multiple pictures. Image entries can be URL strings or objects with `url`, optional `alt`, and optional `description` or `caption`. When a question or option has more than one image, Force Exam shows them in a carousel.

The answer can be a zero-based option index, an answer letter like `A` or `B`, or the exact option text. Answer choices render with letter labels, so image-only options can use the letter or zero-based index.


## Offline desktop app

Force Exam exports its Next.js/React interface as static files inside Electron. The packaged app needs no Node.js installation, web server, or internet connection. The font and sample images are bundled.

The desktop workspace has a collapsible exam sidebar, library search, and study tabs. Imported exams are saved in the local library and can be reopened after restarting. Answers and your current question save automatically. Reopen an exam from the library to resume after closing a tab or restarting the app. Finishing an attempt records its date and score; retakes keep earlier scores. Each exam has a score history with latest/best results, and the workspace shows your overall study statistics. Deleting an exam asks for confirmation and removes its saved progress and results from this device. Keep the original exam JSON files as backups. Use Ctrl/Cmd+O for a new import tab and Ctrl/Cmd+\\ to toggle the sidebar.

### Continue studying

The workspace shows up to three unfinished sessions, most recently used first. Each card shows the exam, mode, answered count, and a Resume action. Regular and focused practice are included; completed and archived sessions are excluded. Folder and search filters also apply. The section disappears when no sessions need resuming.

A 30-question testing exam is available in `public/samples/technology-fundamentals-30.json`, with six topics and explanations for every answer. Import it normally; it is not automatically added to other libraries.

### Folders and archive

Create folders using the sidebar's **+** beside EXAMS or **New folder** in the workspace. The folder's **⋯** menu supports subfolders, renaming, moving, and archiving. Drag exams or folders into another folder, or use **Move to folder**; drop on the **Library root** area below the sidebar list (or the **Library** button) to move to the root. The root area appears only while dragging; the destination highlights on hover. Folder moves cannot create cycles. Select a folder before creating or importing an exam to put it there automatically. Search also matches folder paths.

Use **Archive exam** on an overview or the exam's **⋯** menu to put it aside without deleting anything. Archiving a folder also hides its descendants from the active library. The **Archive** view retains all exam content, embedded images, Git snapshots, scores, saved sessions, and drafts; archived overviews allow inspection, comparison, and export, while study and editing require restoration. Active-library statistics exclude archived items.

Use a folder’s **⋯ → Export folder** to share one JSON collection containing all nested folders (including empty ones), exams, and embedded images. Archived descendants are included too. **Import collection** in the sidebar previews the contents and lets you choose a Library or Archive destination. Imports create new identities and rename the root on a name conflict; they do not overwrite existing content. Scores, saved runs, Git history, and archive flags are not shared. Each imported exam starts with a fresh Git snapshot. Collections support up to 100 MB, 1,000 folders, and 5,000 exams; each embedded exam has a 20 MB limit. Image download or storage failures leave the library unchanged.

The Archive supports the same folder creation, renaming, moves, and drag-and-drop as the Library. Drop on the **Archive root** area below the sidebar list (or **Archive**) to move an archived item to its root. Moving keeps items archived; use **Restore** to return them to the Library.

**Restore exam** returns an individually archived exam to its existing folder when that folder is active. An exam restored from an archived folder moves to the library root so restoring one item does not restore everything else. **Restore folder** restores the subtree; if its parent is still archived, the restored folder moves to the root. Individually archived descendants remain archived. Empty folders can be removed, but folders containing exams or subfolders cannot. Folder/archive organization is local workspace metadata and is excluded from shared exam JSON and content-only Git commits.

### Sharing exam JSON

Use **Export JSON** in the exam overview or results toolbar to save the currently selected version. The desktop app opens a Save dialog; browser development uses a download. The file includes the exam title, description, questions, choices, correct answers, explanations, and image references. Local scores, saved answers, and Git history are excluded. All supported images are embedded as data URLs, including remaining links and bundled images, so the recipient can study offline. Export downloads linked images first and stops with an error if a picture cannot be fetched; it never silently leaves a missing linked picture. SVG images are converted to portable PNGs. The recipient can open the file through **Import exam**.

### Automatic offline images

Creating or saving an exam in the editor, and importing a single exam or collection, automatically downloads and embeds linked images before saving. Question and answer images, bundled images, and legacy schema fields are supported. If a download or save fails, the import stays open and the library is unchanged. Export also embeds any remaining linked images, including those in older saved versions; there is no separate download action.

A connection is needed for the initial download. Downloads accept PNG, JPEG, GIF, WebP, AVIF, and SVG; SVGs are converted to PNG. Each downloaded file is limited to 8 MB and the resulting exam to 20 MB. Storage limits still apply when saving an exam locally; errors keep the original exam intact. Browser development may require image servers to allow cross-origin downloads, while the desktop downloader handles public image links directly.

### Practice Mode and Exam Mode

Choose a mode in the exam overview before starting a new attempt. **Practice Mode** follows the saved question order. **Exam Mode** shuffles questions once per attempt; it keeps the same shuffled order, answers, and position after restarting. Answer choices are not shuffled. Retaking an Exam Mode run creates a new shuffle.

Score history records the mode for each run, and the overview shows separate counts, latest scores, and best scores for both modes on the selected question version. Older runs are treated as Practice Mode because they used the original order. There is one saved session per question version; starting a fresh attempt replaces it while retaining completed scores from both modes. Results use **Go to overview** to return to the exam landing page.

### Exam overviews

Importing an exam, or selecting one from the sidebar or workspace, opens its overview. Importing saves its content and offline images without starting a session. It shows the selected version, question count, current-version scores, and saved session without starting practice or changing answers. Choose **Start practice**, **Resume practice**, or **View last result** explicitly. **Start new attempt** replaces the saved session for that version and keeps completed scores. During study, **Back to overview** returns to the landing page while the practice tab keeps your place.

### Git-backed exam versions

The desktop app bundles a JavaScript Git implementation, so users need no Git installation or account. Importing or saving an exam creates a real Git snapshot in its own repository under the app data directory's `exam-repositories/<exam-id>/` folder. Exam content and version metadata are committed; private practice progress and scores stay in the local library.

Choose **Versions** in an exam overview or above a practice session to see commit hashes, dates, and version numbers. **Switch** loads a snapshot without deleting newer history. Progress is remembered separately for each question version. Metadata-only snapshots share their question version's progress and scores. Close an open editor before switching; its draft is retained for that snapshot.

Editing an older snapshot creates a new commit based on that snapshot's content, with a fresh question version number if questions change. Git history remains linear so every saved commit stays reachable; the originating snapshot is recorded as `basedOn` metadata. Switching selects app content without moving the repository's `main` branch away from the latest saved commit. Branch management, remotes, and push/pull are not part of this feature.

Use **Versions → Compare versions** to choose any two Git snapshots. The read-only comparison shows title/description changes and added, removed, moved, or modified questions, including choice text, correct answers, images/captions, and explanations. The From/To selectors and Swap versions control do not change the active version, progress, or scores. Questions and choices saved by the visual editor have stable identities for accurate tracking across reorderings. Older snapshots are matched by content; ambiguous large rewrites may appear as removed and added questions.

Existing libraries start tracking from their currently available question content. Earlier version numbers recorded only scores and cannot reconstruct missing question snapshots. Deleting an exam also deletes its local Git repository. Back up the app data directory if you want to keep the entire library, scores, progress, and repositories together.

### Mark questions for review

Use **Mark for review** while answering in either mode, or on any question in the results review. The question navigator shows flagged questions; marks refer to the original question even when Exam Mode shuffles its position. The results screen includes a **Show marked only** filter. Marking or unmarking does not change answers, scores, or completed attempt history.

Marks save with the current session and exam version, including after finishing, returning to the overview, or restarting. A new attempt or retake starts with no marks. Exam and collection exports exclude these personal marks.

### Focused practice

From an exam overview or results, choose **Practice missed questions** or **Practice marked questions**. Missed questions include unanswered items from a completed session. Focused sets use the original question order and freeze their selected questions when started. Their own answers, marks, and place are saved separately; **Resume focused practice** and **View focused result** are available on the overview. Starting another focused set replaces the previous focused session, while completed scores remain in history. Full exam progress, source JSON, Git snapshots, and original review marks are kept.

Score history labels these runs as focused practice and uses the subset question count. They are excluded from full-exam best/latest scores, mode statistics, and the workspace score average. Focused progress follows the selected exam version and is excluded from shared exam and collection JSON.

### Window and help

The integrated title bar includes File and View menus, the current tab title, and native window controls. Drag the title bar to move the window. Use the question-mark button or **F1** for the built-in guide, then **Esc** to close it. The guide covers creation/import, saved sessions, editing, score history, offline images, and keyboard shortcuts.

### Create and edit exams

Choose **Create exam** in the sidebar to use the visual editor. Add a title and description, write questions and answer choices, select each correct answer, and add optional explanations and pictures. For question or answer images, either upload files or paste a direct HTTP(S) image URL and choose **Add URL**. The app downloads and embeds URL images immediately, so they remain available offline. Questions can be reordered, duplicated, or removed. Uploaded and downloaded pictures are embedded so they work offline.

Choose **Save exam** to add the exam to the library and open its overview. Select **Start practice** when you are ready. Drafts save locally while you work; reopen **Create exam** or the saved exam's editor to continue a draft after restarting. A draft is separate from the published exam in your library.

Use the pencil beside an exam or **Edit exam** in its study toolbar to edit an existing exam. Title and description changes keep progress and results. Question changes require confirming **Save new version**: the active session resets, and past scores remain in the history with their version. Latest and best scores refer to the current version.

### Run from source

Developers need Node.js 24 and an internet connection for the initial dependency download:

```bash
npm ci
npm run desktop
```

For browser development, use `npm run dev`. `npm run build` exports the site to `out/`.

Run `npm test` for saved-library compatibility, editor round trips, correct-answer handling, version comparison, export privacy, and mode/shuffle checks. Run `npm run desktop:test` to verify file import, offline images, saved progress across restarts, score history, retakes, exam deletion, visual creation/editing, and draft restoration with internet requests blocked. On a Linux machine without a display, install Xvfb and use `xvfb-run --auto-servernum npm run desktop:test -- --ozone-platform=x11`. A virtual display is needed to exercise the native title-bar controls.

### Build a portable app

```bash
npm run desktop:build
```

The output is placed in `dist/`. Build on the target operating system for the most reliable results:

| Platform | Command | Run without an installer |
| --- | --- | --- |
| Windows | `npm run desktop:win` | Double-click the portable `.exe` |
| macOS | `npm run desktop:mac` | Unzip and open `Force Exam.app` |
| Linux | `npm run desktop:linux` | Make the `.AppImage` executable and run it, or extract the `.tar.gz` and run `force-exam` |

Linux AppImages may need FUSE on the host. The tar archive is included as an alternative. These packages avoid an installer, but Electron may still write normal application settings/cache to the user's profile.

The **Build desktop apps** GitHub Actions workflow can be run manually or by pushing a `v*` tag. It builds Windows x64, macOS Apple Silicon and Intel, and Linux x64 packages on their respective hosts. Manual branch builds are available as workflow artifacts (GitHub wraps these downloads in ZIP files). Tag builds publish the original packages directly to **GitHub Releases** after every platform succeeds: a Windows `.exe`, macOS `.zip` files containing the `.app`, and Linux `.AppImage` and `.tar.gz` files. There is no extra Actions ZIP wrapper on release assets.

Before a release, update `package.json` and `package-lock.json` together (for example, `npm version 0.2.0 --no-git-tag-version`), commit the release changes, and tag that commit `v0.2.0`. The workflow rejects a tag that does not match the package version. Tags with a prerelease suffix, such as `v0.3.0-beta.1`, publish as prereleases.  This workflow builds unsigned packages; public distribution on macOS generally needs Apple signing and notarization, and unsigned Windows downloads may show a reputation warning. Signing credentials are not configured here.

### Exams with offline images

Open a local `.json` exam file or paste JSON, then choose **Import exam** to save it and open its overview. Choose Practice Mode or Exam Mode and start when ready. Files are read locally without uploading them. Use embedded raster image data URLs to keep custom exam pictures offline:

```json
{
  "imageUrl": "data:image/png;base64,<base64-encoded-image>"
}
```

Supported embedded formats are PNG, JPEG, GIF, WebP, and AVIF. Paths such as `/sample-images/wide.svg` refer to images bundled with the app, not arbitrary files beside an imported JSON file. HTTP(S) image URLs are downloaded and embedded automatically on import and export. The optional GitHub and donation links open the system browser and also need internet access.

### Complete backups

Use **Settings → Backup and restore** in the desktop app (also available in the File menu). Backups contain all `force-exam-` local settings, library records, scores, sessions (including focused practice, timers, and pools), review marks, drafts, folders, archives, and the exact Git repository files for every exam. Images already embedded in exams and history are included; remote links in older data remain as originally stored. No files are uploaded. Backups are unencrypted JSON and have a 250 MB limit, so keep them private.

Close editors first; unfinished drafts remain saved and are included. Choose a backup to preview it, then confirm **Replace my current library… → Restore backup**. Restore replaces the whole library and repositories, preserving commit hashes and matching drafts. It does not merge libraries or remove original exam/export files elsewhere. Invalid paths or damaged history files are rejected. Normal storage failures roll back the previous repositories and settings. Keep your previous backup until the restored library is verified; do not interrupt a restore.

### Timed sessions and question pools

The overview provides options for new attempts. **Questions per attempt** chooses a random subset; zero uses all available questions. An optional topic narrows the bank first. Practice follows original order within the selected pool; Exam Mode shuffles it. The exact pool is saved for resume, and a retake draws a new pool. Pool scores are labeled and excluded from full-run averages and best/latest results.

In Exam Mode, a **Time limit** from 1–240 minutes establishes an absolute deadline. The timer continues when the app is closed or another tab is selected. At expiry the attempt is submitted once, including when reopened after the deadline. Zero is untimed. Resume keeps saved settings and deadline; new attempts and retakes start a new timer. Local device-clock changes affect the deadline.

### Passing scores

In Session options, set an optional **Passing score** from 1–100% for Practice or Exam Mode. Leave it blank to disable the target. The target stays with the saved attempt and retakes; a new attempt can use a different target. Results show whether the exact score meets or exceeds the target, and passing a newly completed attempt triggers a short confetti celebration. Reopening saved results does not trigger confetti. Reduced-motion preferences suppress the animation.

### Practice feedback and keyboard shortcuts

Enable **Show feedback after answering** for a new Practice Mode attempt to reveal the correct answer, explanation and answer images. Revealed answers are locked and remain locked after restarting. Exam Mode never reveals feedback while answering. Score history labels feedback-assisted practice.

On the active question screen, **1–9** choose answers, **Left/Right** navigate, and **F** toggles a review mark. Typing fields, dialogs, and inactive tabs do not receive these shortcuts.

### Topics and progress charts

Questions can have up to 20 comma-separated topics/tags, each up to 60 characters. Tags survive imports, editing, exports and Git comparisons. Tag-only changes preserve progress and question versions. Completed attempts record topic accuracy using the tags on that run; historical scores are never retroactively reclassified.

Open **Progress dashboard** using the chart icon in the left toolbar or the View menu. Filter by exam, Practice/Exam mode, full/focused/pool runs, and current/all versions. Scores use each run’s actual question count, and the trend chart covers the latest 20 matching attempts. Topic accuracy counts each question under each of its tags; untagged or older attempts have no topic statistics. Archived exams remain available in dashboard filters.

### Appearance

The gear icon opens **Settings**. Choose a built-in Graphite, Midnight, Warm charcoal, Forest, Rose, OLED Black, Catppuccin Mocha, One Dark, Daylight, Paper, or Catppuccin Latte palette with visual previews. Customize the accent using Violet, Teal, Blue, or any color from the custom picker. Choose Standard/Larger text and reduced motion. Changes apply immediately, persist on this device, and are included in full backups. System reduced-motion preferences are always respected. **Reset appearance** restores the defaults without changing exams or scores.

No account is required to study. Library and Archive remain in the library panel, and the chart icon opens Progress.
