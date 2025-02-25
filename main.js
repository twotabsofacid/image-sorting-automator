// Imports
import 'dotenv/config';
import { app, BrowserWindow, desktopCapturer } from 'electron';
import axios from 'axios';
import { google } from 'googleapis';
import { generate, count } from 'random-words';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import cors from 'cors';
import { Server } from 'socket.io';
// Variables
const __dirname = path.resolve();
const API_KEY = process.env.API_KEY;

class Main {
  constructor() {
    this.backend = express();
    this.backend.use(cors({ origin: '*' }));
    this.backend.use(express.json());
    this.backend.use(express.static(path.join(__dirname, 'public')));
    this.server = http.createServer(this.backend);
    this.io = new Server(this.server);
    this.addRoutes();
    this.addIO();
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
      socket.on('video', (data) => {
        console.log('WE ARE PLAYING A NEW VIDEO');
        setTimeout(() => {
          this.grabScreenshot();
        }, 300000);
      });
      socket.on('image', (data) => {
        console.log('we got an image', data, data.length);
      });
    });
    this.io.attach(this.server, {
      cors: {
        origin: '*'
      }
    });
  }
  grabScreenshot() {
    console.log('Taking screenshot...');
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
          if (sources[s].name === 'Screengrabber') {
            const content = sources[s].thumbnail.toPNG();
            console.log(content);
            fs.writeFile(`out/screen-${Date.now()}.png`, content, (error) => {
              if (error) {
                console.error('Error saving PNG file:', error);
              } else {
                console.log('PNG file saved successfully!');
              }
            });
          }
        }
      });
  }
  async getAccessToken() {
    const auth = new google.auth.GoogleAuth({
      keyFilename: 'service-account-key.json',
      // Scopes can be specified at the constructor or at the time of usage.
      scopes: ['https://www.googleapis.com/auth/youtube.readonly']
    });

    const client = await auth.getClient();
    const accessToken = (await client.getAccessToken()).token;

    return accessToken;
  }
  async getRandomVideoID() {
    console.log('getting random video id');
    return new Promise((resolve, reject) => {
      this.getAccessToken()
        .catch((e) => {
          reject(e);
        })
        .then(async (token) => {
          try {
            const randomWords = generate(2).join(' ');
            console.log('random words', randomWords);
            const response = await axios({
              method: 'get',
              url: 'https://youtube.googleapis.com/youtube/v3/search',
              params: {
                part: 'snippet',
                q: randomWords,
                maxResults: 4,
                order: 'viewCount',
                type: 'video',
                key: API_KEY // API Key
              },
              headers: {
                Authorization: `Bearer ${token}`, // Replace with your actual access token
                Accept: 'application/json'
              }
            });
            if (
              response.data &&
              response.data.items &&
              response.data.items.length
            ) {
              console.log('we got data', response.data.items.length);
              resolve(response.data.items[response.data.items.length - 1]);
            } else {
              reject('No data received');
            }
          } catch (error) {
            console.error(
              'Error:',
              error.response ? error.response.data : error.message
            );
            reject(error);
          }
        });
    });
  }
  start() {
    this.server.listen(6969, () => {
      console.log(`Server listening on port ${6969}`);
    });
    // setInterval(() => {
    //   this.getRandomVideoID()
    //     .catch(console.error)
    //     .then((video) => {
    //       console.log('what the fuck we have something', video.snippet.title);
    //       this.io.emit('video', video);
    //     });
    // }, 10000);
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
