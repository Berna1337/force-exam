// Electron loads its entry module through its own loader, so require.main is
// not a reliable way to decide whether to start the application.
require('./main.cjs').startApp();
