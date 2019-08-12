// Modules
const { dialog, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

// Enable logging
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Disable auto downloading
autoUpdater.autoDownload = false;

// Check for updates
exports.check = () => {
  // Start update check
  autoUpdater.checkForUpdates();

  // Listen for download (update)
  autoUpdater.on('update-available', async () => {
    // Track progress percent
    let downloadProgress = 0;

    // Prompt the user to update
    const buttonIndex = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'A new version of Readit is available. Do you want update now?',
      buttons: ['Update', 'No'],
    });

    // If not "Update" button, return
    if (buttonIndex !== 0) return;

    // Create progress window
    let progressWin = new BrowserWindow({
      width: 350,
      height: 35,
      useContentSize: true,
      autoHideMenuBar: true,
      maximizable: false,
      fullscreen: false,
      fullscreenable: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // Load progress HTML
    progressWin.loadFile('renderer/progress.html');

    // Handle win close event
    progressWin.on('close', () => {
      progressWin = null;
    });

    // Listen for progress from progressWin
    ipcMain.on('download-progress-request', e => {
      e.returnValue = downloadProgress;
    });

    // Track download progress on autoUpdater
    autoUpdater.on('download-progress', d => {
      downloadProgress = d.percent;
      autoUpdater.logger.info(downloadProgress);
    });

    // Listen for completed update download
    autoUpdater.on('update-downloaded', () => {
      // Close progressWin
      if (progressWin) progressWin.close();

      // Prompt user to quit and install update
      const installPrompt = dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'A new version of Readit is ready. Quit and install now?',
        buttons: ['Yes', 'Later'],
      });

      if (installPrompt === 0) {
        autoUpdater.quitAndInstall();
      }
    });

    // Else start the download and show download progress in new window
    autoUpdater.downloadUpdate();
  });
};
