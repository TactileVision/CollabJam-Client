const { ipcMain } = require('electron');
import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "./IPCChannels";
import DeviceManager from "../BluetootManager/DeviceManager"
let _win: BrowserWindow;
/*
to recieve messages from the renderer process
--------------------------------------------------------------
ipcMain.on("tactile-jam.send.output.scanning", (event, scanning) => {
    console.log(scanning);
    //send reply back
      event.reply('tactile-jam.receive', 'pong')
  });

-------------------------------------------------------
*/

/*
to send directly messages to the renderer process
--------------------------------------------------------------
electronCache.getBrowserWindow().webContents.send('tactile-jam.receive', 'pong')
---function to send informations to the renderer
*/


ipcMain.on(IPC_CHANNELS.main.actuator, (event, actuator) => {
    console.log("User pressed " + actuator)
    _win.webContents.send(IPC_CHANNELS.renderer.actuator, actuator)
});

ipcMain.on(IPC_CHANNELS.main.changeScan, (event, scanStatus: boolean) => {
    console.log("recieved meesageL: " + scanStatus)
    if (scanStatus) {
        DeviceManager.startScan()
    } else {
        DeviceManager.stopScan()
    }
});

export function setBrowserWindow(browserWindow: BrowserWindow) {
    _win = browserWindow;
};