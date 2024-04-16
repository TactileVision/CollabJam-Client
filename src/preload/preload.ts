// // src/preload.ts

// // `contextBridge` expose an API to the renderer process.
// // `ipcRenderer` is used for IPC (inter-process communication) with main process.
// // We use it in the preload instead of renderer in order to expose only
// // whitelisted wrappers to increase the security of our aplication.
// import { Peripheral } from "@abandonware/noble";
// import { contextBridge, ipcRenderer } from "electron";
// import { IPC_CHANNELS } from "./IpcChannels";
// import { InputBinding } from "@/shared/types/InputDetection/InputBindings";
// import { TactileTask } from "@/shared/types/tactonTypes";

// // Create a type that should contain all the data we need to expose in the
// // renderer process using `contextBridge`.
// export type ContextBridgeApi = {
//   // Declare a `readFile` function that will return a promise. This promise
//   // will contain the data of the file read from the main process.
//   // readFile: () => Promise<string>;
//   toMain: {
//     debug: {
//       logMessageInfo: () => void;
//     };
//     data: {
//       copyToClipboard: (content: string) => void;
//       saveUserName: (userName: string) => void;
//       saveKeyboardButton: (profileUid: string, binding: InputBinding) => void;
//       // saveTacton: () => void;
//       // loadRecordedTacton: () => Tacton;
//     };
//     ble: {
//       setScanMode: (isScanning: boolean) => void;
//       connectToDevice: (uuid: string) => void;
//       disconnectFromDevice: (uuid: string) => void;
//     };
//     tactileDisplay: {
//       writeAmplitudeBuffer: (deviceUuid: string, tasks: TactileTask[]) => void;
//       writeAllAmplitudeBuffers: (tasks: TactileTask[]) => void;
//       writeFrequencyBuffer: (deviceUuid: string, tasks: TactileTask[]) => void;
//     };
//   };
// };

// const exposedApi: ContextBridgeApi = {
//   // ble: {
//   //   setScanMode: function (isScanning: boolean): void {
//   //     ipcRenderer.send(IPC_CHANNELS.main.changeScan, isScanning);
//   //   },
//   //   connectToDevice: function (uuid: string): void {
//   //     throw new Error("Function not implemented.");
//   //   },
//   //   disconnectFromDevice: function (device: Peripheral): void {
//   //     throw new Error("Function not implemented.");
//   //   },
//   // },
// };

// // Expose our functions in the `api` namespace of the renderer `Window`.
// //
// // If I want to call `readFile` from the renderer process, I can do it by
// // calling the function `window.api.readFile()`.
// contextBridge.exposeInMainWorld("api", exposedApi);
