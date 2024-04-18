import { BrowserWindow, ipcMain, clipboard } from "electron";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import DeviceManager from "@/main/BleConnection/BlePeripheralConnectionManager";
import { SetFrequencyTask, TactileTask } from "@sharedTypes/tactonTypes";
import SettingManager from "../FileManager/SettingManager";
import { LoggingLevel } from "../FileManager/LoggingLevel";
import LoggingManager from "../FileManager/LoggingManager";
import { InputBinding } from "@/main/Input/InputDetection/InputBindings";
import {
  writeAmplitudeBuffer,
  writeAmplitudeBuffers,
  writeFrequencyBuffer,
} from "@/main/BleTactileDisplays/TactileDisplayCharacteristicWriter";

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

// ipcMain.on(IPC_CHANNELS.main.actuator, (event, actuator) => {
//   _win.webContents.send(IPC_CHANNELS.renderer.actuator, actuator);
// });

//change scan for the ble devices
ipcMain.on(
  IPC_CHANNELS.main.changeScan,
  (event, data: { scanStatus: boolean }) => {
    if (data.scanStatus) {
      DeviceManager.startScan();
    } else {
      DeviceManager.stopScan();
    }
  },
);

ipcMain.on(
  IPC_CHANNELS.main.connectDevice,
  (event, data: { deviceId: string }) => {
    DeviceManager.connectDevice(data.deviceId);
  },
);

ipcMain.on(
  IPC_CHANNELS.main.disconnectDevice,
  (event, data: { deviceId: string }) => {
    DeviceManager.disconnectDevice(data.deviceId);
  },
);

ipcMain.on(
  IPC_CHANNELS.bluetooth.main.writeAllAmplitudeBuffers,
  (event, data: { taskList: TactileTask[] }) => {
    writeAmplitudeBuffers(
      [...DeviceManager.connectedDevices.values()],
      data.taskList,
    );
  },
);

ipcMain.on(
  IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer,
  (event, data: { deviceId: string; taskList: TactileTask[] }) => {
    const d = DeviceManager.connectedDevices.get(data.deviceId);
    if (d == null) return;
    writeAmplitudeBuffer(d, data.taskList);
  },
);

ipcMain.on(
  IPC_CHANNELS.bluetooth.main.writeFrequencyBuffer,
  (event, data: { deviceId: string; taskList: SetFrequencyTask[] }) => {
    const d = DeviceManager.connectedDevices.get(data.deviceId);
    if (d == null) return;
    writeFrequencyBuffer(d, data.taskList);
  },
);

//copy roomName and adress
ipcMain.on(
  IPC_CHANNELS.main.copyToClipBoard,
  (event, data: { adress: string }) => {
    clipboard.writeText(data.adress);
  },
);

//read the current user configs and send it to renderer
// ipcMain.on(
//   IPC_CHANNELS.main.modifyUserConfig,
//   (event, setting: { key: string; value: any }) => {
//     _settingManager.sendSettings();
//   },
// );

//save the user name in the config
ipcMain.on(
  IPC_CHANNELS.main.saveUserName,
  (event, data: { userName: string }) => {
    _settingManager.updateUserName(data.userName);
  },
);

//save one updated keyboard buttton
ipcMain.on(
  IPC_CHANNELS.main.saveKeyBoardButton,
  (event, data: { profileUid: string; binding: InputBinding }) => {
    _settingManager.updateBinding(data.profileUid, data.binding);
  },
);

//log informations
ipcMain.on(
  IPC_CHANNELS.main.logMessageInfos,
  (
    event,
    data: {
      level: LoggingLevel;
      type: string;
      startTimeStamp: number;
      endTimeStamp: number;
    },
  ) => {
    _loggingManager.writeLog(
      data.level,
      data.type,
      data.endTimeStamp - data.startTimeStamp,
    );
  },
);

//save one tacton as json in vtproto format
// ipcMain.on(IPC_CHANNELS.main.saveTacton, async (event, data: any) => {
//   const file = await dialog.showSaveDialog(_win, {
//     title: "Download to File…",
//     filters: [{ name: "Json", extensions: [".json"] }],
//   });
//   if (!file.canceled && file.filePath !== undefined) {
//     fs.writeFile(file.filePath, JSON.stringify(payload), (err) => {
//       if (err) {
//         console.log(err);
//       }
//     });
//   }
// });

// receive tacton to play back
// ipcMain.on(IPC_CHANNELS.main.getRecordedTacton, async (event, data: any) => {
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
// });

//generell function, which get called if on module want to communicate with the renderer
//TODO Specify payload type w/ a union type of specific message types
export function sendMessageToRenderer(channel: string, data: object): void {
  _win.webContents.send(channel, data);
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
