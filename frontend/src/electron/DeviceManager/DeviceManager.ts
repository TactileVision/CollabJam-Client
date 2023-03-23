import { TactileTask } from "@/types/GeneralType";
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
let connectedDevice: Peripheral | undefined = undefined;
let connectedDevices = new Set<Peripheral>();

const startScan = () => {
    discoveredDevices = [];
    disconnectDevice()
    startBluetoothScan()
}

const stopScan = () => {
    stopBluetoothScan()
}

const addDevice = (peripheral: Peripheral) => {
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
        // connectedDevice = peripheral;
        connectedDevices.add(peripheral);
    } else {
        // connectedDevice = undefined;
        connectedDevices.delete(peripheral);
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
    if (!connectedDevices.has(device)) {
        console.log("Device not in list yet");
        connectBlutetoothDevice(device);
    }
}

//TODO: Add id or device instant to remove a specific device
const disconnectDevice = () => {
    if (connectedDevice == null) return;
    disconnectBlutetoothDevice(connectedDevice)
}

const executeTask = (taskList: TactileTask[]) => {
    connectedDevices.forEach(device => {
        executeInstruction(device, taskList)
    })
}

const initialVibration = async () => {
    executeTask([{
        channelId: 0,
        intensity: 1
    }])
    await new Promise((r) => setTimeout(r, 1000));
    executeTask([{
        channelId: 0,
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