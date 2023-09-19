import { TactileTask } from "@sharedTypes/tactonTypes";
import { Peripheral } from "@abandonware/noble";
import { IPC_CHANNELS } from "../IPCMainManager/IPCChannels";
import { sendMessageToRenderer } from "../IPCMainManager/IPCController";
import { connectBlutetoothDevice, disconnectBlutetoothDevice, startBluetoothScan, stopBluetoothScan } from "./BluetoothController"
import { writeAmplitudeBuffer } from "./BluetoothWriter";
import { tactileDisplayService, tactileDisplayServiceReadingProgress } from "./Services";
import { TactileDisplay } from "./store/DeviceManagerStore";

/**
 * Generell Device Module, which will handle all devices
* it will controll the device with the bluetooth controller and and the vtproto transformer
 */
let discoveredDevices = [] as Peripheral[]
const connectedDevice: Peripheral | undefined = undefined;
// let connectedDevices = new Set<Peripheral>();
const connectedDevices = new Map<string, Peripheral>();
// const discoveryTable = new Map<string, 
const characteristicReadingProgress = new Map<string, Map<string, boolean>>()

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

    sendMessageToRenderer(IPC_CHANNELS.bluetooth.renderer.discoveredPeripheral, {
        id: peripheral.id,
        name: peripheral.advertisement.localName,
        rssi: peripheral.rssi,
        connectionState: peripheral.state,
    })
}

const updateConnectedDevice = async (peripheral: Peripheral) => {
    if (peripheral.state == "connected") {
        connectedDevices.set(peripheral.uuid, peripheral);
        // connectedDevice = peripheral;
    } else {
        connectedDevices.delete(peripheral.uuid);
        sendMessageToRenderer(IPC_CHANNELS.bluetooth.renderer.disconnectedFromDevice, peripheral.uuid)
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
const writeAllAmplitudeBuffers = (taskList: TactileTask[]) => {
    connectedDevices.forEach(device => {
        // console.log(`writeAmplitudeBuffer ${n}`)
        writeAmplitudeBuffer(device, taskList)
        // ++n
    })
}

const executeTask = (display: Peripheral, taskList: TactileTask[]) => {
    writeAmplitudeBuffer(display, taskList);
}

// TODO Move to own file that is concerned with the service
/* const write = (write: WriteCharacteristic) => {
    const d = connectedDevices.get(write.deviceUuid)
    if (d == null) return

    const service = d.services.find((x) => x.uuid === tactileDisplayService.service.uuid)
    if (service == null) return

    const characteristic = service.characteristics.find((characteristic) => characteristic.uuid === write.characteristicUuid);
    if (characteristic == null) return

    const buf = Buffer.from(write.buffer);
    characteristic.write(buf, false, (error) => {
        //go always in this callback if error is null;all is fine
        // console.log(buf);
        if (error !== null) {
            console.log("Error sending data");
            console.log(error);
            throw error;
        }

    });
} */

// const executeTask = 


const initialVibration = async () => {
    writeAllAmplitudeBuffers([{
        channelIds: [0],
        intensity: 1
    }])
    await new Promise((r) => setTimeout(r, 1000));
    writeAllAmplitudeBuffers([{
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
    writeAllAmplitudeBuffers,
    executeTask,
    initialVibration,
    connectedDevices,
}

// function getTactileDisplayInfo(peripheralId: string): TactileDisplay | null {
//     const peripheral = connectedDevices.get(peripheralId);
//     if (peripheral == null) { return null }
//     //Get number of outputs
//     const service = peripheral.services.filter(service => service.uuid = tactileDisplayService.service.uuid).at(0)
//     if (service == null) { return null }
//     if (service.characteristics == null) { return null }

//     service.characteristics.forEach(c => {

//         console.log(c.uuid)
//         console.log(c.)
//     })
//     const numOfOutputsChar = service.characteristics.filter(c => c.uuid == tactileDisplayService.characteristics.numberOfOutputs.uuid)
//     if (numOfOutputsChar == null) { return null }
//     console.log(numOfOutputsChar.values)
//     return null
// }
