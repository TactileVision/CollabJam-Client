import { TactileTask } from "@sharedTypes/tactonTypes";
import { Peripheral } from "@abandonware/noble";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import { sendMessageToRenderer } from "@/main/IpcController/IpcMainController";
import {
  connectBlutetoothDevice,
  disconnectBlutetoothDevice,
  startBluetoothScan,
  stopBluetoothScan,
} from "./BleController";
import { writeAmplitudeBuffer } from "@/main/BleTactileDisplays/TactileDisplayCharacteristicWriter";

/**
 * Generell Device Module, which will handle all devices
 * it will controll the device with the bluetooth controller and and the vtproto transformer
 */
let discoveredDevices = [] as Peripheral[];
const connectedDevices = new Map<string, Peripheral>();

const startScan = () => {
  discoveredDevices = [];
  startBluetoothScan();
};

const stopScan = () => {
  stopBluetoothScan();
};

const addDevice = (peripheral: Peripheral) => {
  //TODO Check if not already connected
  discoveredDevices.push(peripheral);

  sendMessageToRenderer(IPC_CHANNELS.renderer.foundDevice, {
    id: peripheral.id,
    name: peripheral.advertisement.localName,
    rssi: peripheral.rssi,
    state: peripheral.state,
  });

  sendMessageToRenderer(IPC_CHANNELS.bluetooth.renderer.discoveredPeripheral, {
    id: peripheral.id,
    name: peripheral.advertisement.localName,
    rssi: peripheral.rssi,
    connectionState: peripheral.state,
  });
};

const updateConnectedDevice = async (peripheral: Peripheral) => {
  if (peripheral.state == "connected") {
    connectedDevices.set(peripheral.uuid, peripheral);
  } else {
    connectedDevices.delete(peripheral.uuid);
    sendMessageToRenderer(
      IPC_CHANNELS.bluetooth.renderer.disconnectedFromDevice,
      { uuid: peripheral.uuid },
    );
  }

  sendMessageToRenderer(IPC_CHANNELS.renderer.deviceStatusChanged, {
    id: peripheral.id,
    name: peripheral.advertisement.localName,
    rssi: peripheral.rssi,
    state: peripheral.state,
  });
};

const connectDevice = (deviceID: string) => {
  //Check if specified device is in list of discovered deviceds
  console.log("Connecting device");
  const device = discoveredDevices.find((device) => device.id === deviceID);
  //check if device is already connected
  if (device == undefined || device.state === "connected") return;

  //if number of connected devies is at maximum ignore
  if (!connectedDevices.has(device.uuid)) {
    console.log("Device not in list yet");
    connectBlutetoothDevice(device);
  }
};

//TODO: Add id or device instant to remove a specific device
const disconnectDevice = (deviceID: string) => {
  const d = connectedDevices.get(deviceID);
  if (d != null) {
    disconnectBlutetoothDevice(d);
  }
};

const executeTask = (display: Peripheral, taskList: TactileTask[]) => {
  writeAmplitudeBuffer(display, taskList);
};

export default {
  startScan,
  stopScan,
  addDevice,
  updateConnectedDevice,
  connectDevice,
  disconnectDevice,
  executeTask,
  connectedDevices,
};
