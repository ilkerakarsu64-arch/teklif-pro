const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function startServer() {
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');
  try {
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: '3000', NODE_ENV: 'production' }
    });

    serverProcess.on('message', (msg) => {
      console.log('[Server Message]:', msg);
    });

    serverProcess.on('error', (err) => {
      console.error('[Server Error]:', err);
    });
  } catch (err) {
    console.error('Failed to fork server process:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'TeklifPRO - Kurumsal Teklif ve Müşteri Otomasyonu',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  Menu.setApplicationMenu(null);

  // Wait a moment for server to start, then load URL
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000').catch((err) => {
      console.error('Retrying loadURL http://localhost:3000...', err);
      setTimeout(() => mainWindow.loadURL('http://localhost:3000'), 2000);
    });
  }, 1500);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
