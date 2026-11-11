const { app } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
app.setAppPath(process.env.FORCE_EXAM_TEST_APP_PATH || path.resolve(__dirname, '..'));
app.setPath('userData', path.join(app.getPath('temp'), `force-exam-confetti-${process.pid}`));
const timeout = setTimeout(() => { console.error('Confetti test timed out'); app.exit(1); }, 60000);
const loaded = new Promise(resolve => app.once('browser-window-created', (_event, window) => window.webContents.once('did-finish-load', () => resolve(window))));
app.whenReady().then(async () => {
  const window = await loaded;
  const run = code => window.webContents.executeJavaScript(code);
  const wait = async code => { for (let i = 0; i < 100; i++) { if (await run(code)) return; await new Promise(resolve => setTimeout(resolve, 50)); } throw new Error(`Timed out: ${code}`); };
  window.webContents.on('console-message', event => { if (event.level === 'error') console.error('Renderer:', event.message); });
  const exam = { id: 'confetti-check', title: 'Confetti check', questionCount: 1, passingScore: 70, revision: 1, attempts: [], json: JSON.stringify({ title: 'Confetti check', questions: [{ question: 'Choose the correct answer.', options: ['Correct', 'Incorrect'], answer: 0 }] }) };
  await wait(`!!document.querySelector('[aria-label="Exam library"]')`);
  await run(`localStorage.setItem('force-exam-library-v1', ${JSON.stringify(JSON.stringify([exam]))})`);
  await new Promise(resolve => { window.webContents.once('did-finish-load', resolve); window.reload(); });
  await wait(`Array.from(document.querySelectorAll('[aria-label="Exam library"] button')).some(b => b.textContent.includes('Confetti check'))`);
  await run(`Array.from(document.querySelectorAll('[aria-label="Exam library"] button')).find(b => b.textContent.includes('Confetti check')).click()`);
  await wait(`!!document.querySelector('[aria-label="Exam overview"]')`);
  await run(`Array.from(document.querySelectorAll('[aria-label="Exam overview"] button')).find(b => b.textContent === 'Start practice').click()`);
  await wait(`!!document.querySelector('[role="radiogroup"][aria-label^="Question "] [role="radio"]')`);
  await run(`document.querySelector('[role="radiogroup"][aria-label^="Question "] [role="radio"]').click()`);
  await run(`Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Finish').click()`);
  await wait(`document.body.textContent.includes('Passed — well done!')`);
  const diagnostics = await run(`({ motion: matchMedia('(prefers-reduced-motion: reduce)').matches, appMotion: document.documentElement.dataset.reducedMotion, visibility: document.visibilityState, userAgent: navigator.userAgent })`);
  console.log('Celebration environment:', JSON.stringify(diagnostics));
  if (diagnostics.motion) {
    // Windows hosted runners disable animations by default. Verify that policy,
    // then emulate an animation-enabled desktop to exercise the renderer too.
    assert.equal(await run(`!!document.querySelector('canvas.passing-confetti')`), false);
    await wait(`document.body.textContent.includes('disabled by your system animation settings')`);
    window.webContents.debugger.attach('1.3');
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await wait(`!matchMedia('(prefers-reduced-motion: reduce)').matches`);
    await run(`Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Retake').click()`);
    await wait(`!!document.querySelector('[role="radiogroup"][aria-label^="Question "] [role="radio"]')`);
    await run(`document.querySelector('[role="radiogroup"][aria-label^="Question "] [role="radio"]').click()`);
    await run(`Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Finish').click()`);
    await wait(`document.body.textContent.includes('Passed — well done!')`);
    console.log('Verified system motion suppression; testing with animation effects enabled');
  }
  const pixelCheck = `(() => { const canvas = document.querySelector('canvas.passing-confetti'); if (!canvas || !canvas.width || !canvas.height) return false; return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0); })()`;
  try {
    await wait(pixelCheck);
    assert.equal(await run(`(() => { const c = document.querySelector('canvas.passing-confetti'); const r = c.getBoundingClientRect(); return r.width === innerWidth && r.height === innerHeight && getComputedStyle(c).display !== 'none'; })()`), true);
    console.log('PASS: fresh 100% result draws confetti across the window');
  } finally {
    if (process.env.FORCE_EXAM_SCREENSHOT_DIR) {
      await fs.mkdir(process.env.FORCE_EXAM_SCREENSHOT_DIR, { recursive: true });
      await fs.writeFile(path.join(process.env.FORCE_EXAM_SCREENSHOT_DIR, 'confetti.png'), (await window.webContents.capturePage()).toPNG());
    }
  }
  clearTimeout(timeout); app.exit(0);
}).catch(error => { console.error(error); clearTimeout(timeout); app.exit(1); });
require(path.join(app.getAppPath(), 'desktop', 'entry.cjs'));
