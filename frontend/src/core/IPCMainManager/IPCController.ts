import fs from 'fs';
import { BrowserWindow, dialog, ipcMain, clipboard } from "electron";
import { IPC_CHANNELS } from "./IPCChannels";
import DeviceManager from "../DeviceManager/DeviceManager"
import { TactileTask } from "@sharedTypes/tactonTypes";
import SettingManager from "../FileManager/SettingManager";
import { LoggingLevel } from "../FileManager/LoggingLevel";
import LoggingManager from "../FileManager/LoggingManager";
import { InputBinding } from '@/core/Input/InputDetection/types/InputBindings';
import { writeAmplitudeBuffer, writeFreqBuffer } from '../DeviceManager/BluetoothWriter';

let _win: BrowserWindow;
let _settingManager: SettingManager;
let _loggingManager: LoggingManager;
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

/**
 * initiate listener for the renderer process
 */

ipcMain.on(IPC_CHANNELS.main.actuator, (event, actuator) => {
    _win.webContents.send(IPC_CHANNELS.renderer.actuator, actuator)
});

//change scan for the ble devices
ipcMain.on(IPC_CHANNELS.main.changeScan, (event, scanStatus: boolean) => {
    //console.log("recieved meesage to make Scan: " + scanStatus)
    if (scanStatus) {
        DeviceManager.startScan()
    } else {
        DeviceManager.stopScan()
    }
});

//connect with specific device
ipcMain.on(IPC_CHANNELS.main.connectDevice, (event, deviceID: string) => {
    // console.log("Starting Connection");
    DeviceManager.connectDevice(deviceID);
});

//disconnect with specific device
ipcMain.on(IPC_CHANNELS.main.disconnectDevice, (event, deviceID: string) => {
    // console.log("Starting Discconnect");
    DeviceManager.disconnectDevice(deviceID);
});

//controll the vibrotactile device
ipcMain.on(IPC_CHANNELS.bluetooth.main.writeAllAmplitudeBuffers, (event, taskList: TactileTask[]) => {
    console.log("writeAllAmplitudeBuffers");
    DeviceManager.writeAllAmplitudeBuffers(taskList)
});

ipcMain.on(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, (event, payload: {deviceId: string, taskList: TactileTask[]}) => {
    const d = DeviceManager.connectedDevices.get(payload.deviceId)
    if (d == null) return
    writeAmplitudeBuffer(d, payload.taskList)
});

ipcMain.on(IPC_CHANNELS.bluetooth.main.writeFrequencyBuffer, (event, payload: {deviceId: string, freqBuffer: number[] }) => {
    const d = DeviceManager.connectedDevices.get(payload.deviceId)
    if (d == null) return
    writeFreqBuffer(d, payload.freqBuffer)
});

// ipcMain.on(IPC_CHANNELS.bluetooth.main.writeCharacteristic, (event, write: WriteCharacteristic) => {
//     //console.log("writeAllAmplitudeBuffers");
// });


//copy roomName and adress
ipcMain.on(IPC_CHANNELS.main.copyToClipBoard, (event, adress: string) => {
    //console.log("copyToClipBoard");
    clipboard.writeText(adress);
});

//read the current user configs and send it to renderer
ipcMain.on(IPC_CHANNELS.main.modifyUserConfig, (event, setting: { key: string, value: any }) => {
    //console.log("modifyUserConfig");
    _settingManager.sendSettings();
});

//save the user name in the config
ipcMain.on(IPC_CHANNELS.main.saveUserName, (event, userName: string) => {
    //console.log("saveUserName");
    _settingManager.updateUserName(userName);
});

//save one updated keyboard buttton
ipcMain.on(IPC_CHANNELS.main.saveKeyBoardButton, (event, payload: { profileUid: string, binding: InputBinding }) => {
    _settingManager.updateBinding(payload.profileUid, payload.binding);
});

//log informations
ipcMain.on(IPC_CHANNELS.main.logMessageInfos, (event, payload: {
    level: LoggingLevel,
    type: string;
    startTimeStamp: number;
    endTimeStamp: number
}
) => {
    _loggingManager.writeLog(payload.level, payload.type, payload.endTimeStamp - payload.startTimeStamp);
});

//save one tacton as json in vtproto format
ipcMain.on(IPC_CHANNELS.main.saveTacton, async (event, payload: any) => {
    //console.log("saveKeyBoardButton");
    const file = await dialog.showSaveDialog(_win, {
        title: 'Download to File…',
        filters: [
            { name: 'Json', extensions: ['.json'] }
        ]
    });
    if (!file.canceled && file.filePath !== undefined) {
        fs.writeFile(file.filePath, JSON.stringify(payload), err => {
            if (err) {
                console.log(err);
            }
        })
    }
});

// receive tacton to play back
ipcMain.on(IPC_CHANNELS.main.getRecordedTacton, async (event, payload: any) => {
    // let p = payload as [InstructionServerPayload]
    // let t: TactonInstruction[] = []
    // p.forEach(inst => {
    //     if (isInstructionWait(inst.Instruction) || isInstructionSetParameter(inst.Instruction)) {
    //         t.push(inst.Instruction)
    //     } else {
    //         console.log("Unknown payload")
    //     }
    // })
    // playbackRecordedTacton(t)
});

//generell function, which get called if on module want to communicate with the renderer
export function sendMessageToRenderer(channel: string, payload: any): void {
    _win.webContents.send(channel, payload)
}

//for internal use, get initiated at starting the application
export function setBrowserWindow(browserWindow: BrowserWindow) {
    _win = browserWindow;
    _loggingManager = new LoggingManager();

}

//for internal use, get initiated at starting the application
export function initSettingManager() {
    _settingManager = new SettingManager();

}