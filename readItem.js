const { BrowserWindow } = require('electron');

// Offscreen BrowserWindow
let offscreenWindow;

// Export readItem function
module.exports = (url, callback) => {
  // Create the offscreen window
  offscreenWindow = new BrowserWindow({
    width: 500,
    height: 500,
    show: false,
    webPreferences: {
      offscreen: true,
    },
  });

  // Load item url
  offscreenWindow.loadURL(url);

  // Wait for content to finish loading
  offscreenWindow.webContents.on('did-finish-load', e => {
    // Get page title
    const title = offscreenWindow.getTitle();

    // Get screenshot (thumbnail)
    offscreenWindow.webContents.capturePage(image => {
      // Get image as dataURL
      const screenshot = image.toDataURL();

      // Execute callback with new item object
      callback({ title, screenshot, url });

      // Clean up
      offscreenWindow.close();
      offscreenWindow = null;
    });
  });
};
