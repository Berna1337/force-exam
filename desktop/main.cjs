const { app, BrowserWindow, dialog, ipcMain, net, protocol, session, shell } = require('electron');
const { createExamGit } = require('./exam-git.cjs');
const { prepareExamExport, prepareCollectionExport } = require('./export.cjs');
const { downloadImage, createNetImageFetch } = require('./images.cjs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { stat } = require('node:fs/promises');

const APP_URL = 'app://force-exam/';
const externalLinks = new Set([
  'https://github.com/Berna1337/force-exam',
  'https://buymeacoffee.com/berna1337',
]);

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

async function registerProtocol() {
  const root = path.join(app.getAppPath(), 'out');
  protocol.handle('app', async (request) => {
    try {
      const url = new URL(request.url);
      if (url.host !== 'force-exam' || !['GET', 'HEAD'].includes(request.method)) {
        return new Response('Forbidden', { status: 403 });
      }
      const pathname = decodeURIComponent(url.pathname);
      const filePath = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      const relative = path.relative(root, filePath);
      if (relative.startsWith('..') || path.isAbsolute(relative) || !(await stat(filePath)).isFile()) {
        return new Response('Not found', { status: 404 });
      }
      const response = await net.fetch(pathToFileURL(filePath).toString());
      response.headers.set('Content-Security-Policy', [
        "default-src 'self'",
        // Next.js emits inline hydration data; Chakra emits inline styles.
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: http:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "frame-src 'none'",
        "form-action 'none'",
      ].join('; '));
      return response;
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
}

function openExternal(url) {
  if (externalLinks.has(url)) void shell.openExternal(url).catch(console.error);
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 640,
    minHeight: 480,
    title: 'Force Exam',
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin'
      ? { trafficLightPosition: { x: 14, y: 12 } }
      : { titleBarOverlay: { color: '#191919', symbolColor: '#bdbdbd', height: 38 } }),
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: true,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.cjs') },
  });
  if (process.platform !== 'darwin') window.removeMenu();
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== new URL(APP_URL).origin || !url.startsWith(APP_URL)) {
      event.preventDefault();
      openExternal(url);
    }
  });
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  await window.loadURL(APP_URL);
  return window;
}

function startApp() {
  app.whenReady().then(async () => {
    ipcMain.handle('exam-images:download', (event, url) => {
      if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== APP_URL) throw new Error('Image downloads are only available to the local workspace.');
      return downloadImage(url, createNetImageFetch(net));
    });
    for (const collection of [false, true]) ipcMain.handle(collection ? 'exam-files:export-collection' : 'exam-files:export', async (event, data) => {
      if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== APP_URL) throw new Error('Export is only available to the local workspace.');
      const { fileName, content } = collection ? prepareCollectionExport(data) : prepareExamExport(data);
      const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), {
        title: collection ? 'Export folder collection' : 'Export exam JSON', defaultPath: fileName,
        filters: [{ name: 'JSON exam', extensions: ['json'] }], properties: ['showOverwriteConfirmation'],
      });
      if (result.canceled || !result.filePath) return { saved: false };
      await require('node:fs/promises').writeFile(result.filePath, content, 'utf8');
      return { saved: true };
    });
    const examGit = createExamGit(path.join(app.getPath('userData'), 'exam-repositories'));
    for (const method of ['save', 'list', 'read', 'remove']) {
      ipcMain.handle(`exam-git:${method}`, (event, ...args) => {
        if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== APP_URL) {
          throw new Error('Exam history is only available to the local workspace.');
        }
        return examGit[method](...args);
      });
    }
    await registerProtocol();
    await createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) void createWindow();
    });
  }).catch((error) => {
    dialog.showErrorBox('Could not open Force Exam', error.message);
    app.quit();
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

module.exports = { startApp };
