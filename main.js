// Imports
import 'dotenv/config';
import { app, BrowserWindow, desktopCapturer } from 'electron';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import cors from 'cors';
// Variables
const __dirname = path.resolve();

class Main {
  constructor() {
    this.backend = express();
    this.backend.use(cors({ origin: '*' }));
    this.backend.use(express.json());
    this.backend.use(express.static(path.join(__dirname, 'public')));
    this.server = http.createServer(this.backend);
    this.addRoutes();
    this.start();
  }
  addRoutes() {
    // Routes
  }
  addIO() {
    this.io.on('connection', (socket) => {
      console.log('socket connected');
      socket.on('disconnect', () => {
        console.log('we should disconnect this...');
      });
      socket.on('connected', async () => {
        console.log('we connected');
      });
    });
    this.io.attach(this.server, {
      cors: {
        origin: '*'
      }
    });
  }
  start() {
    this.server.listen(6969, () => {
      console.log(`Server listening on port ${6969}`);
    });
    setTimeout(() => {
      console.log('SCREENSHOT');
      desktopCapturer
        .getSources({
          types: ['window'],
          thumbnailSize: {
            height: 768,
            width: 1366
          }
        })
        .then((sources) => {
          for (let s in sources) {
            console.log('s and sources', s, sources);
            if (sources[s].name === 'Screengrabber') {
              const content = sources[s].thumbnail.toPNG();
              console.log(content);
              fs.writeFile('test.png', content, (error) => {
                if (error) {
                  console.error('Error saving PNG file:', error);
                } else {
                  console.log('PNG file saved successfully!');
                }
              });
            }
          }
        });
    }, 5000);
  }
}

new Main();

async function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 768,
    title: 'Screengrabber',
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // win.loadFile('index.html');
  await win.loadURL('http://127.0.0.1:6969');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
