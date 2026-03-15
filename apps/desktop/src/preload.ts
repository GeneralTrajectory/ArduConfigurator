import { contextBridge, ipcRenderer } from 'electron'

interface DesktopOpenedTextFile {
  path: string
  name: string
  contents: string
}

interface DesktopSavedTextFile {
  path: string
  name: string
}

interface DesktopSaveTextFileRequest {
  title: string
  suggestedName: string
  contents: string
  existingPath?: string
}

contextBridge.exposeInMainWorld('arduconfigDesktop', {
  platform: 'electron' as const,
  openSnapshotFile: () => ipcRenderer.invoke('desktop:snapshots:open-file') as Promise<DesktopOpenedTextFile | undefined>,
  saveSnapshotLibrary: (request: DesktopSaveTextFileRequest) =>
    ipcRenderer.invoke('desktop:snapshots:save-library', request) as Promise<DesktopSavedTextFile | undefined>,
  saveSnapshotBackup: (request: DesktopSaveTextFileRequest) =>
    ipcRenderer.invoke('desktop:snapshots:save-backup', request) as Promise<DesktopSavedTextFile | undefined>
})
