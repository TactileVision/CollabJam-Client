import { TactileTask } from "@sharedTypes/tactonTypes";
import { Peripheral } from "@abandonware/noble";
import { IPC_CHANNELS } from "../IPCMainManager/IPCChannels";
import { sendMessageToRenderer } from "../IPCMainManager/IPCController";
import { connectBlutetoothDevice, disconnectBlutetoothDevice, startBluetoothScan, stopBluetoothScan } from "./BluetoothController"
import { executeInstruction } from "./VTProtoTransformer";

/**
 * Generell Device Module, which will handle all devices
 * it will controll the device with the bluetooth controller and and the vtproto transformer
 */
let discoveredDevices = [] as Peripheral[]
const connectedDevice: Peripheral | undefined = undefined;
// let connectedDevices = new Set<Peripheral>();
const connectedDevices = new Map<string, Peripheral>();

const startScan = () => {
    discoveredDevices = [];
    // disconnectDevice()
    startBluetoothScan()
}

const stopScan = () => {
    stopBluetoothScan()
}

const addDevice = (peripheral: Peripheral) => {
    //TODO Check if not alreadt connected
    discoveredDevices.push(peripheral);
    sendMessageToRenderer(IPC_CHANNELS.renderer.foundDevice, {
        id: peripheral.id,
        name: peripheral.advertisement.localName,
        rssi: peripheral.rssi,
        state: peripheral.state
    })
}

const updateConnectedDevice = async (peripheral: Peripheral) => {
    if (peripheral.state == "connected") {
        connectedDevices.set(peripheral.uuid, peripheral);
        // connectedDevice = peripheral;
    } else {
        connectedDevices.delete(peripheral.uuid);
        // connectedDevice = undefined;
        // connectedDevices.delete(peripheral);
    }
    sendMessageToRenderer(IPC_CHANNELS.renderer.deviceStatusChanged, {
        id: peripheral.id,
        name: peripheral.advertisement.localName,
        rssi: peripheral.rssi,
        state: peripheral.state,
    });
}

const connectDevice = (deviceID: string) => {
    //Check if specified device is in list of discovered deviceds
    console.log("Connecting device");
    const device = discoveredDevices.find(device => device.id === deviceID);
    //check if device is already connected
    if (device == undefined || device.state === "connected") return;

    // //TODO: Check if device is in set of peripherals
    // //Richards code disconnects an alredy connected device which allows him to connect the new device
    // if (connectedDevice !== undefined && connectedDevice !== null)
    //     disconnectBlutetoothDevice(connectedDevice);

    //if number of connected devies is at maximum ignore
    if (!connectedDevices.has(device.uuid)) {
        console.log("Device not in list yet");
        connectBlutetoothDevice(device);
    }
}

//TODO: Add id or device instant to remove a specific device
const disconnectDevice = (deviceID: string) => {
    const d = connectedDevices.get(deviceID)
    if (d != null) {
        disconnectBlutetoothDevice(d)
    }
}

let n = 0
// let millis = new Date()
const executeTask = (taskList: TactileTask[]) => {
    connectedDevices.forEach(device => {
        console.log(`executeInstruction ${n}`)
        executeInstruction(device, taskList)
        ++n
    })
}

const initialVibration = async () => {
    executeTask([{
        channelIds: [0],
        intensity: 1
    }])
    await new Promise((r) => setTimeout(r, 1000));
    executeTask([{
        channelIds: [0],
        intensity: 0
    }])
}
export default {
    startScan,
    stopScan,
    addDevice,
    updateConnectedDevice,
    connectDevice,
    disconnectDevice,
    executeTask,
    initialVibration,
}