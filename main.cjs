const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 600, // Adjusted for portrait feel
    height: 900,
    title: "retroRacer",
    icon: path.join(__dirname, 'build/icon.png'), // Will be handled by builder
    resizable: true, // Allow resizing to fit different screens
    fullscreenable: true,
    autoHideMenuBar: true, // Hide the File/Edit menu
    backgroundColor: '#050505', // Match the body background
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // In development, load from the local dev server (usually localhost:3000 or 5173)
  // In production, load the built index.html
  const isDev = !app.isPackaged;

  if (isDev) {
    // Adjust this port if your dev server runs on a different one (e.g. 5173 for Vite)
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools(); // Uncomment to debug
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});