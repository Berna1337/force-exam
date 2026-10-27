const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('examImages', { download: (url) => ipcRenderer.invoke('exam-images:download', url) });
contextBridge.exposeInMainWorld('examFiles', {
  exportCollection: (data) => ipcRenderer.invoke('exam-files:export-collection', data),
  exportJson: (data) => ipcRenderer.invoke('exam-files:export', data),
});
contextBridge.exposeInMainWorld('examGit', {
  save: (id, data) => ipcRenderer.invoke('exam-git:save', id, data),
  list: (id) => ipcRenderer.invoke('exam-git:list', id),
  read: (id, oid) => ipcRenderer.invoke('exam-git:read', id, oid),
  remove: (id) => ipcRenderer.invoke('exam-git:remove', id),
});
