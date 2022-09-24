const { app, BrowserWindow } = require("electron");
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
  });
  win.webContents.openDevTools()
  win.loadURL('https://ib.bri.co.id/ib-bri/Login.html')
};

app.whenReady().then(() => {
  createWindow();
});
