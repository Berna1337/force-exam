const { app, dialog, net, session } = require('electron');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');

app.setAppPath(process.env.FORCE_EXAM_TEST_APP_PATH || path.resolve(__dirname, '..'));
app.setPath('userData', path.join(app.getPath('temp'), `force-exam-smoke-${process.pid}`));
const timeout = setTimeout(() => {
  console.error('Desktop smoke test timed out');
  app.exit(1);
}, 60000);
const loadedWindow = new Promise((resolve) => {
  app.once('browser-window-created', (_event, window) => {
    window.webContents.once('did-finish-load', () => resolve(window));
  });
});

app.whenReady().then(async () => {
  // Block every internet request: all UI, fonts, and sample media must be bundled.
  const remoteRequests = [];
  let localImageOrigin = '';
  const linkedImageRequests = [];
  const downloadedImages = [];
  const originalFetch = net.fetch;
  const originalRequest = net.request;
  const fixturePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=', 'base64');
  let fixturesOffline = false;
  net.fetch = (url, options) => {
    if (typeof url === 'string' && url.startsWith('https://images.example.test/')) {
      if (fixturesOffline) return Promise.reject(new Error('Image server is offline'));
      downloadedImages.push(url);
      return Promise.resolve(new Response(fixturePng, { headers: { 'content-type': 'image/png' } }));
    }
    return originalFetch.call(net, url, options);
  };
  net.request = (options) => {
    if (!options.url?.startsWith('https://images.example.test/')) return originalRequest.call(net, options);
    const { EventEmitter } = require('node:events');
    const request = new EventEmitter();
    request.abort = () => {};
    request.end = () => queueMicrotask(() => {
      if (fixturesOffline) return request.emit('error', new Error('Image server is offline'));
      downloadedImages.push(options.url);
      const response = new EventEmitter(); response.statusCode = 200; response.headers = { 'content-type': 'image/png' };
      request.emit('response', response);
      response.emit('data', fixturePng); response.emit('end');
    });
    return request;
  };
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
    if (localImageOrigin && details.url.startsWith(`${localImageOrigin}/`)) return callback({ cancel: false });
    if (details.url.startsWith('https://images.example.test/')) linkedImageRequests.push(details.url);
    else remoteRequests.push(details.url);
    callback({ cancel: true });
  });
  const window = await loadedWindow;
  // Exercise Electron's real network stack, including redirects, without internet access.
  const imageServer = require('node:http').createServer((request, response) => {
    if (request.url === '/redirect') { response.writeHead(302, { location: '/image.png' }); response.end(); }
    else { response.writeHead(200, { 'content-type': 'image/png' }); response.end(fixturePng); }
  });
  await new Promise(resolve => imageServer.listen(0, '127.0.0.1', resolve));
  localImageOrigin = `http://127.0.0.1:${imageServer.address().port}`;
  const nativeDownload = await window.webContents.executeJavaScript(`window.examImages.download(${JSON.stringify(localImageOrigin + '/redirect')})`);
  assert.equal(nativeDownload, `data:image/png;base64,${fixturePng.toString('base64')}`);
  await new Promise(resolve => imageServer.close(resolve));
  localImageOrigin = '';
  assert.equal((await net.fetch('app://force-exam/..%2fpackage.json')).status, 404);
  assert.equal((await net.fetch('app://other/index.html')).status, 403);
  const errors = [];
  window.webContents.on('render-process-gone', (_event, details) => errors.push(details.reason));
  const run = (source) => window.webContents.executeJavaScript(source);
  const waitFor = async (source) => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await run(source)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Timed out waiting for: ${source}`);
  };
  const click = async (text) => {
    const source = `Array.from(document.querySelectorAll('button')).find(b => b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden' && b.textContent.trim() === ${JSON.stringify(text)})`;
    await waitFor(`!!(${source})`);
    await run(`${source}.click()`);
  };
  const submitImport = async () => {
    await run(`document.querySelector('main button[aria-label="Import exam file"]').click()`);
  };
  const fill = async (label, value) => {
    const selector = `[aria-label=${JSON.stringify(label)}]`;
    await run(`(() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      Object.getOwnPropertyDescriptor(input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
  };
  const enterStudy = async () => {
    await waitFor('Array.from(document.querySelectorAll(\'[aria-label="Exam overview"]\')).some(el => el.getClientRects().length)');
    await run(`(() => {
      const overview = Array.from(document.querySelectorAll('[aria-label="Exam overview"]')).find(el => el.getClientRects().length);
      Array.from(overview.querySelectorAll('button')).find(button => ['Start practice', 'Start exam', 'Resume practice', 'Resume exam', 'View last result'].includes(button.textContent.trim())).click();
    })()`);
    await waitFor('!Array.from(document.querySelectorAll(\'[aria-label="Exam overview"]\')).some(el => el.getClientRects().length)');
    await run('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  };
  const returnAndResume = async () => {
    const before = await run('localStorage.getItem("force-exam-library-v1")');
    const distractions = ['Import', 'New attempt', 'Edit exam', 'Delete exam', 'Versions', 'Export JSON', 'Download images', 'Move to folder', 'Archive exam', 'Score history'];
    assert.deepEqual(await run(`Array.from(document.querySelectorAll('main button')).filter(button => button.getClientRects().length && ${JSON.stringify(distractions)}.includes(button.textContent.trim())).map(button => button.textContent.trim())`), []);
    await click('Back to overview');
    await waitFor('Array.from(document.querySelectorAll(\'[aria-label="Exam overview"]\')).some(el => el.getClientRects().length)');
    assert.equal(await run('localStorage.getItem("force-exam-library-v1")'), before, 'Returning to overview preserves the complete session and scores');
    await enterStudy();
    assert.equal(await run('localStorage.getItem("force-exam-library-v1")'), before, 'Resuming preserves answers, question position, mode and shuffled order');
  };
  for (let attempt = 0; !window.isVisible() && attempt < 100; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(window.isVisible(), true, 'Desktop startup must show a window');
  window.setSize(1200, 850);
  await waitFor('document.body.textContent.includes("A little focus. A lot of progress.")');
  await waitFor('document.documentElement.dataset.theme === "dark"');
  const screenshot = async (name) => {
    if (!process.env.FORCE_EXAM_SCREENSHOT_DIR) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
    const image = await window.webContents.capturePage();
    await fs.writeFile(path.join(process.env.FORCE_EXAM_SCREENSHOT_DIR, name), image.toPNG());
  };
  await screenshot('workspace-home.png');
  assert.equal(await run('getComputedStyle(document.querySelector(".app-titlebar")).getPropertyValue("-webkit-app-region")'), 'drag');
  assert.equal(await run('getComputedStyle(document.querySelector(\'[aria-label="Help and instructions"]\')).getPropertyValue("-webkit-app-region")'), 'no-drag');
  if (process.platform !== 'darwin') {
    await waitFor('navigator.windowControlsOverlay?.visible');
    assert.equal(await run(`(() => {
      const rect = navigator.windowControlsOverlay.getTitlebarAreaRect();
      return document.querySelector('[aria-label="Help and instructions"]').getBoundingClientRect().right <= rect.x + rect.width + 1;
    })()`), true, 'Help must not overlap native window controls');
  }
  await click('View');
  await run('Array.from(document.querySelectorAll(\'[role="menuitem"]\')).find(b => b.textContent.startsWith("Toggle sidebar")).click()');
  await waitFor('!document.querySelector(\'[aria-label="Exam library"]\')');
  await click('View');
  await run('Array.from(document.querySelectorAll(\'[role="menuitem"]\')).find(b => b.textContent.startsWith("Toggle sidebar")).click()');
  await waitFor('!!document.querySelector(\'[aria-label="Exam library"]\')');
  await run('document.querySelector(\'[aria-label="Help and instructions"]\').click()');
  await waitFor('!!document.querySelector(\'[role="dialog"]\')');
  await waitFor('document.querySelector(\'[role="dialog"]\').innerText.includes("Force Exam guide")');
  await click('Study, pause, and resume');
  await screenshot('workspace-help.png');
  await click('Got it');
  await waitFor('!document.querySelector(\'[role="dialog"]\')');
  await run('window.dispatchEvent(new KeyboardEvent("keydown", { key: "F1", bubbles: true, cancelable: true }))');
  await waitFor('!!document.querySelector(\'[role="dialog"]\')');
  window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await waitFor('!document.querySelector(\'[role="dialog"]\')');
  await click('Import exam');
  await waitFor('!!document.querySelector("textarea")');
  // Ensure React has hydrated: controlled textarea must receive the bundled sample.
  await waitFor('document.querySelector("textarea").value.includes("Force Exam schema sample")');
  // Exercise the local file picker and an embedded image, without a native dialog.
  await run(`(() => {
    const exam = JSON.parse(document.querySelector('textarea').value);
    exam.questions[0].imageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=';
    const transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(exam)], 'offline-exam.json', { type: 'application/json' }));
    const input = document.querySelector('input[type="file"]');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor('document.querySelector("textarea").value.includes("data:image/png;base64,")');
  await submitImport();
  await waitFor('Array.from(document.querySelectorAll(\'[aria-label="Exam overview"]\')).some(el => el.getClientRects().length)');
  const importedWithoutSession = await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0]');
  assert.equal(importedWithoutSession.progress, undefined, 'Importing does not create a practice session');
  assert.deepEqual(importedWithoutSession.attempts, []);
  assert.equal(await run('Array.from(document.querySelectorAll(\'[role="radiogroup"][aria-label^="Question "]\')).some(el => el.getClientRects().length)'), false);
  await enterStudy();
  await waitFor('document.body.textContent.includes("Which field contains")');
  await waitFor('document.images.length > 0 && Array.from(document.images).every(i => i.complete && i.naturalWidth > 0)');
  await run('document.querySelectorAll(\'[role="radio"]\')[2].click()');
  await waitFor('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.answers["question-0"] === 2');
  assert.deepEqual(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.questionOrder'), ['question-0', 'question-1', 'question-2', 'question-3', 'question-4']);
  await click('Next');
  await waitFor('document.body.textContent.includes("What can the answer field contain")');
  await click('Next');
  await waitFor('document.images.length > 0 && Array.from(document.images).every(i => i.complete && i.naturalWidth > 0)');
  await returnAndResume();
  await click('Workspace');
  await waitFor('document.body.textContent.includes("EXAM LIBRARY")');
  await run('Array.from(document.querySelectorAll(\'[aria-label="Open tabs"] button\')).find(b => b.textContent.trim() === "Force Exam schema sample · Practice").click()');
  await waitFor('document.querySelector("main").innerText.includes("Question 3 of 5")');
  // Simulate restarting during an unfinished attempt.
  const reopen = async () => {
    const before = await run('localStorage.getItem("force-exam-library-v1")');
    await new Promise((resolve) => { window.webContents.once('did-finish-load', resolve); window.reload(); });
    await waitFor('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).some(b => b.textContent.includes("Force Exam schema sample"))');
    await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).find(b => b.textContent.includes("Force Exam schema sample")).click()');
    await waitFor('!!document.querySelector(\'[aria-label="Exam overview"]\')');
    assert.equal(await run('Array.from(document.querySelectorAll(\'[role="radiogroup"][aria-label^="Question "]\')).some(el => el.getClientRects().length)'), false, 'Selecting an exam must not start practice');
    assert.equal(await run('localStorage.getItem("force-exam-library-v1")'), before, 'Browsing an exam must not change progress');
    await screenshot('workspace-exam-overview.png');
    await enterStudy();
  };
  await reopen();
  await waitFor('document.querySelector("main").innerText.includes("Question 3 of 5")');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.answers["question-0"]'), 2);
  await screenshot('workspace-practice.png');
  await run('document.querySelector(\'[aria-label="Hide sidebar"]\').click()');
  await waitFor('!document.querySelector(\'[aria-label="Exam library"]\')');
  await run('document.querySelector(\'[aria-label="Show sidebar"]\').click()');
  await waitFor('!!document.querySelector(\'[aria-label="Exam library"]\')');
  assert.equal(await run('typeof window.require'), 'undefined');
  assert.equal(await run('typeof window.process'), 'undefined');
  await click('Finish');
  await waitFor('document.body.textContent.includes("Review")');
  await waitFor('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].attempts.length === 1');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].attempts[0].score'), 1);
  const saved = await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))');
  assert.ok(saved.some(exam => exam.title === 'Force Exam schema sample'));
  await reopen();
  await waitFor('document.querySelector("main").innerText.includes("1 / 5 correct")');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].attempts.length'), 1);
  await click('Score history');
  await waitFor('document.querySelector(\'[aria-label="Score history"]\')?.innerText.includes("20%")');
  await screenshot('workspace-history.png');
  await click('Retake');
  await waitFor('document.querySelector("main").innerText.includes("Question 1 of 5")');
  assert.deepEqual(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.answers'), {});
  await click('Finish');
  await waitFor('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].attempts.length === 2');
  // Reimporting the same file opens the existing overview, keeping its history and session.
  const originalJson = saved[0].json;
  await click('Go to overview');
  await click('Import exam');
  await waitFor('!!document.querySelector("textarea")');
  await run(`(() => {
    const input = document.querySelector('input[type="file"]');
    const transfer = new DataTransfer();
    transfer.items.add(new File([${JSON.stringify(originalJson)}], 'same-exam.json', { type: 'application/json' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor('document.querySelector("textarea").value.includes("data:image/png;base64,")');
  await submitImport();
  await waitFor('!document.querySelector("textarea")');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1")).length'), 1);
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].attempts.length'), 2);
  // Metadata edits retain scores and progress; question edits create a new version.
  await click('Edit exam');
  await waitFor('!!document.querySelector(\'[aria-label="Exam editor"]\')');
  await fill('Description', 'Updated in the visual editor');
  await click('Save exam');
  await waitFor('!document.querySelector(\'[aria-label="Exam editor"]\')');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].revision'), 1);
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.isReviewing'), true);
  await click('Edit exam');
  await waitFor('!!document.querySelector(\'[aria-label="Question text"]\')');
  await fill('Question text', 'This question was updated in the editor.');
  await click('Save exam');
  await waitFor('document.querySelector(\'[aria-label="Exam editor"]\').innerText.includes("Earlier scores remain")');
  await screenshot('workspace-editor.png');
  await click('Save new version');
  await waitFor('!document.querySelector(\'[aria-label="Exam editor"]\')');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].revision'), 2);
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].attempts.length'), 2);
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress'), undefined);
  await enterStudy();
  await waitFor('document.querySelector("main").innerText.includes("This question was updated")');
  const examId = saved[0].id;
  const history = await run(`window.examGit.list(${JSON.stringify(examId)})`);
  assert.equal(history.length, 3);
  const oldVersion = history.find(version => version.oid === saved[0].gitCommit);
  const newVersion = history.find(version => version.revision === 2);
  const switchTo = async (version) => {
    const exit = await run(`Array.from(document.querySelectorAll('main button')).find(button => button.getClientRects().length && ['Back to overview', 'Go to overview'].includes(button.textContent.trim()))?.textContent.trim()`);
    if (exit) await click(exit);
    await click('Versions');
    const label = `Switch to ${version.oid.slice(0, 7)}`;
    await waitFor(`!!document.querySelector('[aria-label="${label}"]')`);
    await run(`document.querySelector('[aria-label="${label}"]').click()`);
    await waitFor(`JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].gitCommit === ${JSON.stringify(version.oid)}`);
    await enterStudy();
  };
  await switchTo(oldVersion);
  await waitFor('document.querySelector("main").innerText.includes("0 / 5 correct")');
  await switchTo(newVersion);
  await waitFor('document.querySelector("main").innerText.includes("This question was updated")');
  await run('document.querySelectorAll(\'[role="radio"]\')[0].click()');
  await click('Next');
  await switchTo(oldVersion);
  await reopen();
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].gitCommit'), oldVersion.oid);
  await switchTo(newVersion);
  await waitFor('document.querySelector("main").innerText.includes("Question 2 of 5")');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.answers["question-0"]'), 0);
  await switchTo(oldVersion);
  await click('Edit exam');
  await waitFor('!!document.querySelector(\'[aria-label="Question text"]\')');
  await fill('Question text', 'A new edit based on the original Git snapshot.');
  await fill('Answer 2 text', 'An updated answer choice');
  await run('document.querySelector(\'[aria-label="Answer 2 is correct"]\').click()');
  await fill('Explanation', 'A new explanation for this version.');
  await click('Save exam');
  await click('Save new version');
  await waitFor('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].revision === 3');
  const branchedHistory = await run(`window.examGit.list(${JSON.stringify(examId)})`);
  assert.equal(branchedHistory[0].basedOn, oldVersion.oid);
  assert.equal(branchedHistory.length, 4);
  assert.ok(branchedHistory.some(version => version.oid === newVersion.oid));
  await click('Versions');
  await waitFor('document.querySelector(\'[aria-label="Exam versions"]\').innerText.includes("Version 3")');
  await screenshot('workspace-versions.png');
  const beforeComparison = await run('localStorage.getItem("force-exam-library-v1")');
  await click('Compare versions');
  await waitFor('document.querySelector(\'[aria-label="Version comparison results"]\')?.textContent.includes("Question text changed")');
  assert.equal(await run('document.querySelector(\'[aria-label="Version comparison results"]\').textContent.includes("Answer choices changed")'), true);
  assert.equal(await run('document.querySelector(\'[aria-label="Version comparison results"]\').textContent.includes("Correct answer changed")'), true);
  await screenshot('workspace-comparison.png');
  await click('Swap versions');
  await waitFor(`document.querySelector('[aria-label="Compare from version"]').value === ${JSON.stringify(branchedHistory[0].oid)}`);
  await waitFor('!!document.querySelector(\'[aria-label="Version comparison results"]\')');
  assert.equal(await run('localStorage.getItem("force-exam-library-v1")'), beforeComparison, 'Comparing must not change selection, progress, or scores');
  await click('Close comparison');
  window.setSize(640, 720);
  await new Promise((resolve) => setTimeout(resolve, 250));
  assert.equal(await run('document.documentElement.scrollWidth <= innerWidth'), true, 'Workspace must fit the minimum window width');
  await screenshot('workspace-narrow.png');
  await click('Delete exam');
  await click('Keep exam');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1")).length'), 1);
  await click('Delete exam');
  await click('Delete permanently');
  await waitFor('JSON.parse(localStorage.getItem("force-exam-library-v1")).length === 0');
  await waitFor(`window.examGit.list(${JSON.stringify(examId)}).then(items => items.length === 0)`);
  assert.equal(await run('document.querySelector(\'[aria-label="Open tabs"]\').innerText.includes("Force Exam schema sample")'), false);
  await new Promise((resolve) => { window.webContents.once('did-finish-load', resolve); window.reload(); });
  await waitFor('document.body.textContent.includes("Make room for your next exam.")');
  // Author an exam without JSON, restore its draft, and verify its scoring.
  await click('File');
  await run('Array.from(document.querySelectorAll(\'[role="menuitem"]\')).find(b => b.textContent === "Create exam").click()');
  await waitFor('!!document.querySelector(\'[aria-label="Exam editor"]\')');
  await click('Save exam');
  await waitFor('document.querySelector(\'[aria-label="Exam editor"]\').innerText.includes("Give your exam a title")');
  await fill('Exam title', 'Visual editor exam');
  await fill('Question text', 'Which number is one?');
  await fill('Answer 1 text', 'One');
  await fill('Answer 2 text', 'Two');
  await run('document.querySelector(\'[aria-label="Answer 1 is correct"]\').click()');
  await fill('Explanation', 'One is the correct number.');
  await run(`(() => {
    const input = document.querySelector('[aria-label="Add question images"]');
    const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII='), c => c.charCodeAt(0));
    const transfer = new DataTransfer(); transfer.items.add(new File([bytes], 'local-image.png', { type: 'image/png' }));
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor('document.querySelector(\'[aria-label="Exam editor"] img\')?.src.startsWith("data:image/png;base64,")');
  await fill('Question images URL', 'javascript:alert(1)');
  await run('document.querySelector(\'[aria-label="Add question images URL"]\').click()');
  await waitFor('document.querySelector(\'[aria-label="Exam editor"]\').textContent.includes("Enter a valid http:// or https:// image URL")');
  await fill('Question images URL', 'https://images.example.test/question.png');
  await run('document.querySelector(\'[aria-label="Add question images URL"]\').click()');
  await waitFor('document.querySelectorAll(\'[aria-label="Exam editor"] img\').length >= 2');
  await fill('Answer 1 images URL', 'https://images.example.test/answer.png');
  await run('document.querySelector(\'[aria-label="Add answer 1 images URL"]\').click()');
  await waitFor('document.querySelectorAll(\'[aria-label="Exam editor"] img\').length >= 3');
  // Simulate a restored older draft that still contains an image link.
  await run(`(() => { const key = 'force-exam-editor-new'; const stored = JSON.parse(localStorage.getItem(key)); stored.draft.questions[0].images.push({ url: 'https://images.example.test/save.png' }); localStorage.setItem(key, JSON.stringify(stored)); })()`);
  await new Promise((resolve) => { window.webContents.once('did-finish-load', resolve); window.reload(); });
  await click('Create exam');
  await waitFor('document.querySelector(\'[aria-label="Exam title"]\')?.value === "Visual editor exam"');
  assert.equal(await run('document.querySelector(\'[aria-label="Question text"]\').value'), 'Which number is one?');
  await click('Add question');
  await fill('Question text', 'Which number is two?');
  await fill('Answer 1 text', 'Zero');
  await fill('Answer 2 text', 'One');
  await click('Add answer');
  await fill('Answer 3 text', 'Two');
  await run('document.querySelector(\'[aria-label="Answer 3 is correct"]\').click()');
  await run('document.querySelector(\'[aria-label="Remove answer 1"]\').click()');
  await run('document.querySelector(\'[aria-label="Duplicate question"]\').click()');
  await run('document.querySelector(\'[aria-label="Delete question"]\').click()');
  await run('document.querySelector(\'[aria-label="Move question up"]\').click()');
  await run('document.querySelector(\'[aria-label="Move question down"]\').click()');
  const beforeEditorImageFailure = await run('localStorage.getItem("force-exam-library-v1")');
  fixturesOffline = true;
  await click('Save exam');
  await waitFor('document.querySelector(\'[aria-label="Exam editor"]\')?.textContent.includes("offline")');
  assert.equal(await run('localStorage.getItem("force-exam-library-v1")'), beforeEditorImageFailure, 'Failed save downloads preserve the library');
  assert.ok(await run('localStorage.getItem("force-exam-editor-new")'), 'The unfinished draft is kept');
  fixturesOffline = false;
  await click('Save exam');
  await waitFor('!document.querySelector(\'[aria-label="Exam editor"]\')');
  await waitFor('!!document.querySelector(\'[aria-label="Exam overview"]\')');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress'), undefined);
  const createdExam = await run('JSON.parse(JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].json)');
  assert.ok(createdExam.questions[0].images.every(image => image.url.startsWith('data:image/png;base64,')));
  assert.ok(createdExam.questions[0].options[0].images.every(image => image.url.startsWith('data:image/png;base64,')));
  assert.ok(downloadedImages.includes('https://images.example.test/save.png'), 'Saving embeds any remaining image links');
  await enterStudy();
  await waitFor('document.querySelector("main").innerText.includes("Which number is one?")');
  assert.equal(await run('Array.from(document.querySelectorAll("main button")).some(button => button.getClientRects().length && button.textContent.trim() === "Import")'), false);
  await run('document.querySelectorAll(\'[role="radio"]\')[0].click()');
  await click('Next');
  await run('document.querySelectorAll(\'[role="radio"]\')[1].click()');
  await click('Finish');
  await waitFor('document.querySelector("main").innerText.includes("2 / 2 correct")');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].attempts[0].mode'), 'practice');
  assert.equal(await run('Array.from(document.querySelectorAll("button")).some(b => b.textContent.trim() === "Import another")'), false);
  await click('Go to overview');
  await waitFor('Array.from(document.querySelectorAll(\'[aria-label="Exam overview"]\')).some(el => el.getClientRects().length)');
  const originalSaveDialog = dialog.showSaveDialog;
  const exportPath = path.join(app.getPath('userData'), 'shared-exam.json');
  dialog.showSaveDialog = async () => ({ canceled: false, filePath: exportPath });
  await click('Export JSON');
  for (let i = 0; i < 100; i++) { try { await fs.access(exportPath); break; } catch { await new Promise(resolve => setTimeout(resolve, 50)); } }
  dialog.showSaveDialog = originalSaveDialog;
  const exported = JSON.parse(await fs.readFile(exportPath, 'utf8'));
  assert.equal(exported.title, 'Visual editor exam');
  assert.equal(exported.questions.length, 2);
  assert.ok(exported.questions[0].images[1].url.startsWith('data:image/png;base64,'));
  assert.ok(exported.questions[0].options[0].images[0].url.startsWith('data:image/png;base64,'));
  assert.equal('progress' in exported || 'attempts' in exported || 'gitCommit' in exported, false);
  // Selecting a mode works from the card padding and description, not just its title.
  for (const mode of ['exam', 'practice']) {
    await run(`(() => {
      const input = Array.from(document.querySelectorAll('[aria-label="Run mode"] input[value="${mode}"]')).find(input => input.closest('label').getClientRects().length);
      const card = input.closest('[data-run-mode-card]'); card.scrollIntoView({ block: 'center' });
      const style = getComputedStyle(card); if (style.borderTopStyle !== 'solid' || style.borderTopWidth !== '1px') throw new Error('Mode card border is missing');
      const bounds = card.getBoundingClientRect(); document.elementFromPoint(bounds.right - 8, bounds.bottom - 8).click();
    })()`);
    assert.equal(await run(`Array.from(document.querySelectorAll('[aria-label="Run mode"] input[value="${mode}"]')).find(input => input.closest('label').getClientRects().length).checked`), true);
  }
  await screenshot('workspace-mode-cards.png');
  await run(`(() => {
    const input = Array.from(document.querySelectorAll('[aria-label="Run mode"] input[value="exam"]')).find(input => input.closest('label').getClientRects().length);
    input.closest('[data-run-mode-card]').querySelector('p').click();
  })()`);
  assert.equal(await run(`Array.from(document.querySelectorAll('[aria-label="Run mode"] input[value="exam"]')).find(input => input.closest('label').getClientRects().length).checked`), true);
  // Deterministic randomness verifies the actual exam UI uses the saved permutation.
  await run('window.__savedRandom = Math.random; Math.random = () => 0; document.querySelector(\'[aria-label="Run mode"] input[value="exam"]\').click()');
  await click('Start new attempt');
  await waitFor('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.mode === "exam"');
  await run('Math.random = window.__savedRandom; delete window.__savedRandom');
  const shuffled = await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.questionOrder');
  assert.deepEqual(shuffled, ['question-1', 'question-0']);
  await waitFor('document.querySelector("main").innerText.includes("Which number is two?")');
  assert.equal(await run('Array.from(document.querySelectorAll("main button")).some(button => button.getClientRects().length && button.textContent.trim() === "Import")'), false);
  await run('document.querySelectorAll(\'[role="radio"]\')[1].click()');
  await click('Next');
  await waitFor('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.currentIndex === 1');
  await returnAndResume();
  await new Promise((resolve) => { window.webContents.once('did-finish-load', resolve); window.reload(); });
  await waitFor('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).some(b => b.textContent.includes("Visual editor exam"))');
  await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).find(b => b.textContent.includes("Visual editor exam")).click()');
  await enterStudy();
  assert.deepEqual(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.questionOrder'), shuffled);
  await waitFor('document.querySelector("main").innerText.includes("Which number is one?")');
  assert.equal(await run('Array.from(document.querySelectorAll("main button")).some(button => button.getClientRects().length && button.textContent.trim() === "Import")'), false);
  await run('document.querySelectorAll(\'[role="radio"]\')[0].click()');
  await click('Finish');
  await waitFor('document.querySelector("main").innerText.includes("2 / 2 correct")');
  const modeScores = await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].attempts');
  assert.deepEqual(modeScores.map(attempt => attempt.mode), ['exam', 'practice']);
  await click('Score history');
  await waitFor('Array.from(document.querySelectorAll(\'[aria-label="Score history"]\')).some(el => el.getClientRects().length && el.textContent.includes("Exam Mode") && el.textContent.includes("Practice Mode"))');
  assert.equal(await run('document.querySelector("main").scrollWidth <= document.querySelector("main").clientWidth'), true, 'Exam actions must fit narrow windows');
  await screenshot('workspace-run-modes.png');
  const completedAttemptId = await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.attemptId');
  await run('window.__savedRandom = Math.random; Math.random = () => 0.9999; void 0');
  await click('Retake');
  await waitFor(`JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.attemptId !== ${JSON.stringify(completedAttemptId)}`);
  await run('Math.random = window.__savedRandom; delete window.__savedRandom');
  assert.deepEqual(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.questionOrder'), ['question-0', 'question-1']);
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.mode'), 'exam');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].attempts.length'), 2);
  assert.ok(downloadedImages.includes('https://images.example.test/question.png'));
  assert.ok(downloadedImages.includes('https://images.example.test/answer.png'));
  // Imports embed linked and bundled images before saving; exports remain portable offline.
  await click('Import exam');
  await waitFor('!!document.querySelector("textarea")');
  const legacy = { title: 'Linked image exam', questions: [{ question: 'Offline images?',
    images: [{ url: 'https://images.example.test/legacy.png', caption: 'Keep caption' }, '/sample-images/wide.svg'],
    options: [{ text: 'Yes', imageUrl: 'https://images.example.test/legacy.png' }, 'No'], answer: 0 }] };
  await run(`(() => {
    const input = document.querySelector('input[type="file"]'); const transfer = new DataTransfer();
    transfer.items.add(new File([${JSON.stringify(JSON.stringify(legacy))}], 'linked.json', { type: 'application/json' }));
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor('document.querySelector("textarea").value.includes("Linked image exam")');
  const beforeImageFailure = await run('localStorage.getItem("force-exam-library-v1")');
  fixturesOffline = true;
  await submitImport();
  await waitFor('document.querySelector("main [role=alert]")?.textContent.includes("offline")');
  assert.equal(await run('localStorage.getItem("force-exam-library-v1")'), beforeImageFailure, 'Failed image downloads must not save an incomplete exam');
  assert.ok(await run('document.querySelector("textarea").value.includes("legacy.png")'), 'Failed imports keep the original file ready to retry');
  fixturesOffline = false;
  await submitImport();
  await enterStudy();
  await waitFor('document.querySelector("main").innerText.includes("Offline images?")');
  await run('Array.from(document.querySelectorAll(\'[role="radio"]\')).find(el => el.getClientRects().length).click()');
  await waitFor('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.answers["question-0"] === 0');
  await click('Back to overview');
  const linkedBefore = await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0]');
  const importedMedia = JSON.parse(linkedBefore.json).questions[0];
  assert.ok(importedMedia.images[0].url.startsWith('data:image/png;base64,'));
  assert.ok(importedMedia.images[1].startsWith('data:image/png;base64,'));
  assert.ok(importedMedia.options[0].imageUrl.startsWith('data:image/png;base64,'));
  assert.equal(importedMedia.images[0].caption, 'Keep caption');
  assert.equal((await run(`window.examGit.list(${JSON.stringify(linkedBefore.id)})`)).length, 1, 'Initial history already contains offline images');
  assert.equal(await run('Array.from(document.querySelectorAll("button")).some(button => button.textContent.trim() === "Download images")'), false);
  fixturesOffline = true;
  const legacyExport = path.join(app.getPath('userData'), 'linked-export.json');
  dialog.showSaveDialog = async () => ({ canceled: false, filePath: legacyExport });
  await click('Export JSON');
  for (let i = 0; i < 100; i++) { try { await fs.access(legacyExport); break; } catch { await new Promise(resolve => setTimeout(resolve, 50)); } }
  dialog.showSaveDialog = originalSaveDialog;
  const portable = JSON.parse(await fs.readFile(legacyExport, 'utf8'));
  assert.ok(portable.questions[0].images[0].url.startsWith('data:image/png;base64,'));
  assert.ok(portable.questions[0].images[1].startsWith('data:image/png;base64,'), 'Bundled SVGs must be portable PNGs');
  assert.equal(portable.questions[0].images[0].caption, 'Keep caption');
  assert.ok(portable.questions[0].options[0].imageUrl.startsWith('data:image/png;base64,'));
  const linkedAfter = await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0]');
  assert.deepEqual(linkedAfter.progress, linkedBefore.progress);
  assert.equal(linkedAfter.revision, linkedBefore.revision);
  assert.equal(linkedAfter.gitCommit, linkedBefore.gitCommit);
  fixturesOffline = true;
  await enterStudy();
  await waitFor('Array.from(document.images).filter(image => image.getClientRects().length).every(image => image.complete && image.naturalWidth > 0)');
  assert.deepEqual(await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0].progress.answers'), { 'question-0': 0 });
  // A later metadata edit preserves the imported images and session while adding history.
  await click('Back to overview');
  await click('Edit exam'); await waitFor('!!document.querySelector(\'[aria-label="Exam editor"]\')');
  await fill('Description', 'An offline collection exam'); await click('Save exam');
  await waitFor('!document.querySelector(\'[aria-label="Exam editor"]\')');
  await enterStudy();
  // Organize an existing exam without changing its content, Git history, or sessions.
  const organizedBefore = await run('JSON.parse(localStorage.getItem("force-exam-library-v1"))[0]');
  const createFolder = async (name) => {
    await run('document.querySelector(\'[aria-label="New folder"]\').click()');
    await waitFor('!!document.querySelector(\'[aria-label="Folder name"]\')');
    await fill('Folder name', name); await click('Create folder');
    await waitFor(`JSON.parse(localStorage.getItem("force-exam-folders-v1")).some(folder => folder.name === ${JSON.stringify(name)})`);
    return await run(`JSON.parse(localStorage.getItem("force-exam-folders-v1")).find(folder => folder.name === ${JSON.stringify(name)}).id`);
  };
  const courses = await createFolder('Courses');
  const biology = await createFolder('Biology');
  assert.equal(await run(`JSON.parse(localStorage.getItem("force-exam-folders-v1")).find(folder => folder.id === ${JSON.stringify(biology)}).parentId`), courses);
  await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).find(button => button.textContent.includes("Linked image exam")).click()');
  await click('Move to folder');
  await waitFor('!!document.querySelector(\'[aria-label="Destination folder"]\')');
  await run(`(() => { const select = document.querySelector('[aria-label="Destination folder"]'); select.value = ${JSON.stringify(biology)}; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await click('Move');
  await waitFor(`JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.id === ${JSON.stringify(organizedBefore.id)}).folderId === ${JSON.stringify(biology)}`);
  await run('document.querySelector(\'[aria-label="Actions for folder Courses / Biology"]\').click()');
  await click('Rename folder');
  await fill('Folder name', 'Biology revision'); await click('Rename folder');
  await waitFor('JSON.parse(localStorage.getItem("force-exam-folders-v1")).some(folder => folder.name === "Biology revision")');
  await run('document.querySelector(\'[aria-label="Collapse folder Courses"]\').click()');
  assert.equal(await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).some(button => button.textContent.includes("Linked image exam"))'), false);
  await run('document.querySelector(\'[aria-label="Expand folder Courses"]\').click()');
  // Drag the exam to the root, then back into the nested folder.
  await run(`(() => { const transfer = new DataTransfer(); transfer.setData('application/x-force-exam-exam', ${JSON.stringify(organizedBefore.id)}); document.querySelector('[aria-label="Show library"]').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer })); })()`);
  await waitFor(`!JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.id === ${JSON.stringify(organizedBefore.id)}).folderId`);
  await run(`(() => { const transfer = new DataTransfer(); transfer.setData('application/x-force-exam-exam', ${JSON.stringify(organizedBefore.id)}); Array.from(document.querySelectorAll('[aria-label="Exam library"] button')).find(button => button.textContent.trim() === 'Biology revision').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer })); })()`);
  await waitFor(`JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.id === ${JSON.stringify(organizedBefore.id)}).folderId === ${JSON.stringify(biology)}`);
  await fill('Filter exams', 'Biology revision');
  assert.equal(await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).some(button => button.textContent.includes("Visual editor exam"))'), false);
  await fill('Filter exams', '');
  window.setSize(1200, 850); await screenshot('workspace-folders.png');
  await run('document.querySelector(\'[aria-label="Actions for folder Courses"]\').click()');
  await click('Archive folder');
  await waitFor('JSON.parse(localStorage.getItem("force-exam-folders-v1")).find(folder => folder.name === "Courses").archivedAt');
  assert.equal(await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).some(button => button.textContent.includes("Linked image exam"))'), false);
  await run('document.querySelector(\'[aria-label="Show archive"]\').click()');
  await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).find(button => button.textContent.includes("Linked image exam")).click()');
  await waitFor('document.querySelector("main").textContent.includes("This exam is archived")');
  assert.equal(await run('Array.from(document.querySelectorAll(\'[aria-label="Run mode"]\')).some(el => el.getClientRects().length)'), false);
  await click('Versions');
  await waitFor('!!document.querySelector(\'[aria-label="Exam versions"] button[aria-label^="Switch to"]\')');
  assert.equal(await run('Array.from(document.querySelectorAll(\'[aria-label="Exam versions"] button[aria-label^="Switch to"]\')).every(button => button.disabled)'), true);
  await click('Compare versions');
  await waitFor('!!document.querySelector(\'[aria-label="Version comparison results"]\')');
  await click('Close comparison');
  await screenshot('workspace-archive.png');
  await new Promise(resolve => { window.webContents.once('did-finish-load', resolve); window.reload(); });
  await waitFor('!!document.querySelector(\'[aria-label="Show archive"]\')');
  await run('document.querySelector(\'[aria-label="Show archive"]\').click()');
  await waitFor('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).some(button => button.textContent.includes("Linked image exam"))');
  await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).find(button => button.textContent.includes("Linked image exam")).click()');
  await click('Restore exam');
  await waitFor(`!JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.id === ${JSON.stringify(organizedBefore.id)}).folderId`);
  assert.ok(await run('JSON.parse(localStorage.getItem("force-exam-folders-v1")).find(folder => folder.name === "Courses").archivedAt'), 'Restoring one exam must not restore its archived folder');
  await run('document.querySelector(\'[aria-label="Show archive"]\').click()');
  await run('document.querySelector(\'[aria-label="Actions for folder Courses"]\').click()');
  await click('Restore folder');
  await waitFor('!JSON.parse(localStorage.getItem("force-exam-folders-v1")).find(folder => folder.name === "Courses").archivedAt');
  const organizedAfter = await run(`JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.id === ${JSON.stringify(organizedBefore.id)})`);
  assert.deepEqual(organizedAfter.progress, organizedBefore.progress);
  assert.deepEqual(organizedAfter.attempts, organizedBefore.attempts);
  assert.equal(organizedAfter.json, organizedBefore.json); assert.equal(organizedAfter.gitCommit, organizedBefore.gitCommit);
  const commitsAfterOrganization = await run(`window.examGit.list(${JSON.stringify(organizedBefore.id)})`);
  assert.equal(commitsAfterOrganization.length, 2);
  // A newly imported exam inherits the selected folder.
  await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).find(button => button.textContent.trim() === "Biology revision").click()');
  await click('Import exam'); await waitFor('!!document.querySelector("textarea")');
  const folderExam = { title: 'Folder import', questions: [{ question: 'Filed correctly?', options: ['Yes', 'No'], answer: 0 }] };
  await run(`(() => { const transfer = new DataTransfer(); transfer.items.add(new File([${JSON.stringify(JSON.stringify(folderExam))}], 'folder.json', { type: 'application/json' })); const input = document.querySelector('input[type="file"]'); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await waitFor('document.querySelector("textarea").value.includes("Folder import")'); await submitImport();
  await waitFor(`JSON.parse(localStorage.getItem("force-exam-library-v1")).some(exam => exam.title === "Folder import" && exam.folderId === ${JSON.stringify(biology)})`);
  await waitFor('Array.from(document.querySelectorAll(\'[aria-label="Exam overview"]\')).some(el => el.getClientRects().length)');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.title === "Folder import").progress'), undefined);
  await click('Archive exam');
  await run('document.querySelector(\'[aria-label="Show archive"]\').click()');
  await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).find(button => button.textContent.includes("Folder import")).click()');
  await click('Restore exam');
  assert.equal(await run('JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.title === "Folder import").folderId'), biology);
  // Export a complete nested folder, then import a second independent copy offline.
  await run(`(() => { const transfer = new DataTransfer(); transfer.setData('application/x-force-exam-exam', ${JSON.stringify(organizedBefore.id)}); Array.from(document.querySelectorAll('[aria-label="Exam library"] button')).find(button => button.textContent.trim() === 'Biology revision').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer })); })()`);
  await run('Array.from(document.querySelectorAll(\'[aria-label="Exam library"] button\')).find(button => button.textContent.trim() === "Biology revision").click()');
  await createFolder('Empty folder');
  const collectionPath = path.join(app.getPath('userData'), 'collection.json');
  dialog.showSaveDialog = async () => ({ canceled: false, filePath: collectionPath });
  await run('document.querySelector(\'[aria-label="Actions for folder Courses"]\').click()');
  await run(`Array.from(document.querySelectorAll('[role="menuitem"]')).find(item => item.getClientRects().length && item.textContent.trim() === 'Export folder').click()`);
  await waitFor('!document.body.textContent.includes("Preparing collection and images…")');
  const collectionText = await fs.readFile(collectionPath, 'utf8');
  dialog.showSaveDialog = originalSaveDialog;
  const collectionData = JSON.parse(collectionText);
  assert.equal(collectionData.folders.length, 3); assert.equal(collectionData.exams.length, 2);
  assert.ok(collectionText.includes('data:image/png;base64,'));
  assert.equal(collectionText.includes('"attempts"'), false); assert.equal(collectionText.includes('"progress"'), false);
  await run('document.querySelector(\'[aria-label="Show library"]\').click()');
  const loadCollection = async (text) => {
    await click('Import collection');
    await waitFor('!!document.querySelector(\'[aria-label="Collection JSON file"]\')');
    await run(`(() => { const transfer = new DataTransfer(); transfer.items.add(new File([${JSON.stringify(text)}], 'collection.json', { type: 'application/json' })); const input = document.querySelector('[aria-label="Collection JSON file"]'); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await waitFor('document.querySelector("[role=dialog]").textContent.includes("3 folders · 2 exams")');
  };
  const originals = [organizedBefore.id, await run('JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.title === "Folder import").id')];
  await loadCollection(collectionText);
  await run(`Array.from(document.querySelectorAll('[role=dialog] button')).find(button => button.textContent.trim() === 'Import collection').click()`);
  await waitFor('!document.querySelector(\'[aria-label="Collection JSON file"]\')');
  const importedRoot = await run('JSON.parse(localStorage.getItem("force-exam-folders-v1")).find(folder => folder.name === "Courses (2)")');
  assert.ok(importedRoot);
  const importedExams = await run(`JSON.parse(localStorage.getItem("force-exam-library-v1")).filter(exam => !${JSON.stringify(originals)}.includes(exam.id) && ['Linked image exam', 'Folder import'].includes(exam.title))`);
  assert.equal(importedExams.length, 2);
  for (const exam of importedExams) {
    assert.deepEqual(exam.attempts, []); assert.equal(exam.progress, undefined);
    assert.equal((await run(`window.examGit.list(${JSON.stringify(exam.id)})`)).length, 1);
  }
  // Archive destination, modal moves, folder dragging, and root drops retain archive status.
  await run('document.querySelector(\'[aria-label="Actions for folder Courses (2)"]\').click()'); await click('Archive folder');
  await run('document.querySelector(\'[aria-label="Show archive"]\').click()');
  const archiveTarget = await createFolder('Archived collections');
  await run(`(() => { const transfer = new DataTransfer(); transfer.setData('application/x-force-exam-folder', ${JSON.stringify(importedRoot.id)}); Array.from(document.querySelectorAll('[aria-label="Exam library"] button')).find(button => button.textContent.trim() === 'Archived collections').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer })); })()`);
  await waitFor(`JSON.parse(localStorage.getItem("force-exam-folders-v1")).find(folder => folder.id === ${JSON.stringify(importedRoot.id)}).parentId === ${JSON.stringify(archiveTarget)}`);
  const archivedExam = importedExams.find(exam => exam.title === 'Linked image exam');
  await run(`Array.from(document.querySelectorAll('[aria-label="Exam library"] button')).find(button => button.textContent.includes('Linked image exam')).click()`);
  await waitFor('Array.from(document.images).filter(image => image.getClientRects().length).every(image => image.complete && image.naturalWidth > 0)');
  await click('Move to folder');
  await run(`(() => { const select = document.querySelector('[aria-label="Destination folder"]'); select.value = ${JSON.stringify(archiveTarget)}; select.dispatchEvent(new Event('change', { bubbles: true })); })()`); await click('Move');
  await waitFor(`JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.id === ${JSON.stringify(archivedExam.id)}).folderId === ${JSON.stringify(archiveTarget)}`);
  await run(`(() => { const transfer = new DataTransfer(); transfer.setData('application/x-force-exam-exam', ${JSON.stringify(archivedExam.id)}); document.querySelector('[aria-label="Show archive"]').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer })); })()`);
  await waitFor(`!JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.id === ${JSON.stringify(archivedExam.id)}).folderId`);
  assert.ok(await run(`JSON.parse(localStorage.getItem("force-exam-library-v1")).find(exam => exam.id === ${JSON.stringify(archivedExam.id)}).archivedAt`));
  // A failed storage write must leave both organization and library unchanged.
  const beforeFailedImport = await run('[localStorage.getItem("force-exam-folders-v1"), localStorage.getItem("force-exam-library-v1")]');
  await loadCollection(collectionText);
  await run(`(() => { const original = Storage.prototype.setItem; window.restoreStorageTest = () => { Storage.prototype.setItem = original; }; Storage.prototype.setItem = function(key, value) { if (key === 'force-exam-library-v1') throw new DOMException('Full', 'QuotaExceededError'); return original.call(this, key, value); }; })()`);
  await run(`Array.from(document.querySelectorAll('[role=dialog] button')).find(button => button.textContent.trim() === 'Import collection').click()`);
  await waitFor('document.querySelector("[role=dialog]").textContent.includes("No exams were imported")');
  await run('window.restoreStorageTest()');
  assert.deepEqual(await run('[localStorage.getItem("force-exam-folders-v1"), localStorage.getItem("force-exam-library-v1")]'), beforeFailedImport);
  await click('Cancel');
  await loadCollection(collectionText);
  await run(`Array.from(document.querySelectorAll('[role=dialog] button')).find(button => button.textContent.trim() === 'Import collection').click()`);
  await waitFor('!document.querySelector(\'[aria-label="Collection JSON file"]\')');
  const archiveImport = await run(`JSON.parse(localStorage.getItem("force-exam-folders-v1")).find(folder => folder.name === 'Courses' && folder.parentId === ${JSON.stringify(archiveTarget)})`);
  assert.equal(archiveImport?.parentId, archiveTarget, 'Imports directly into Archive retain their destination');
  await new Promise(resolve => { window.webContents.once('did-finish-load', resolve); window.reload(); });
  await waitFor('!!document.querySelector(\'[aria-label="Show archive"]\')');
  await run('document.querySelector(\'[aria-label="Show archive"]\').click()');
  assert.ok(await run(`JSON.parse(localStorage.getItem("force-exam-folders-v1")).some(folder => folder.id === ${JSON.stringify(archiveImport.id)} && folder.parentId === ${JSON.stringify(archiveTarget)})`));
  await screenshot('workspace-collection-archive.png');
  assert.deepEqual(remoteRequests, []);
  assert.deepEqual(errors, []);
  console.log('PASS: collection export/import with embedded images, archive moves and failed-import rollback; nested folders, rename/move/drag-and-drop/search, folder and exam archive/restore across restart, content/history/progress preservation, inherited import folder; offline images, Git, modes and scoring.');
  clearTimeout(timeout);
  app.exit(0);
}).catch((error) => {
  console.error(error);
  clearTimeout(timeout);
  app.exit(1);
});

// Exercise the same unconditional entry point as `electron .` and the packages.
require(path.join(app.getAppPath(), 'desktop', 'entry.cjs'));
