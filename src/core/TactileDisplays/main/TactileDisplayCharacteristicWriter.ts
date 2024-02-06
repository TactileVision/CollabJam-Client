import { Characteristic, Peripheral } from "@abandonware/noble";
import { SetFrequencyTask, TactileTask } from "@sharedTypes/tactonTypes";
import { tactileDisplayService } from "../../Ble/main/BleServices";

//TODO Change TactileTask to SetAmplitudeTask


/**
 * Vibrate the first channel of the specified display (`deviceUuid`) for `durationMs` milliseconds
 */
export async function pingDisplayViaNode(device: Peripheral, durationMs: number) {
    writeAmplitudeBuffer(device, [{ channelIds: [0], intensity: 1 }])
    await new Promise(resolve => setTimeout(resolve, durationMs))
    writeAmplitudeBuffer(device, [{ channelIds: [0], intensity: 0 }])
}

/**
 * method to controll the vibrotactile device
 * it needed the peripheral, with the specicic characteristic
 * and a custom format for the vibrotactile instructions, 
 * it will transform it to the VTProto format and will use the characteristic to controll the device 
 */
export const writeAmplitudeBuffer = (device: Peripheral, taskList: TactileTask[]) => {
    const service = device.services.find((x) => x.uuid === tactileDisplayService.service.uuid)
    if (service !== undefined) {
        const characteristic = service.characteristics.find((characteristic) => characteristic.uuid === tactileDisplayService.characteristics!.amplitudeValues.uuid);
        if (characteristic !== undefined) {

            const buf = getBufferFromAmplitudeTasks(taskList)
            writeAmplitudeBufferCharacteristic(buf, characteristic);
        }
    }
}
export const writeAmplitudeBuffers = (devices: Peripheral[], taskList: TactileTask[]) => {
    devices.forEach(device => {
        writeAmplitudeBuffer(device, taskList)
    })
}

function getBufferFromAmplitudeTasks(taskList: TactileTask[]): Buffer {
    const numOut = Math.max(...taskList.map(o => Math.max.apply(Math, o.channelIds)))
    const output = new Uint8Array(numOut + 1).fill(255);

    const map = (value: number, x1: number, y1: number, x2: number, y2: number) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;
    taskList.forEach(task => {
        const intensity = map((task.intensity * 100), 0, 100, 0, 254);

        task.channelIds.forEach(channelId => {
            output[channelId] = intensity;
        }
        );
    });
    return Buffer.from(output);
}

function getBufferFromFrequencyTasks(taskList: SetFrequencyTask[]): Buffer {
    const numOut = Math.max(...taskList.map(o => Math.max.apply(Math, o.channelIds)))
    const output = new Uint8Array(2 * (numOut + 1)).fill(0);
    taskList.forEach(task => {
        task.channelIds.forEach(channel => {
            output[2 * channel] = task.frequency
            output[2 * channel + 1] = task.frequency >> 8

            console.log(task)
        })

    })
    return Buffer.from(output);
}

function writeAmplitudeBufferCharacteristic(buffer: Buffer, characteristic: Characteristic) {
    characteristic.write(buffer, false, (error) => {
        if (error !== null) {
            console.log("Error sending data");
            console.log(error);
            throw error;
        }
    });
}

export function writeFrequencyBuffer(device: Peripheral, taskList: SetFrequencyTask[]) {
    console.log("writing frequency alda")
    const service = device.services.find((x) => x.uuid === tactileDisplayService.service.uuid)
    if (service !== undefined) {
        const characteristic = service.characteristics.find((characteristic) => characteristic.uuid === tactileDisplayService.characteristics!.frequencyValues.uuid);
        if (characteristic !== undefined) {
            const buf = getBufferFromFrequencyTasks(taskList)
            console.log(buf);
            writeFrequencyBuffercharacteristic(buf, characteristic)
        }
    }
}

// export function writeFreqBuffer(device: Peripheral, freqBuffer: number[]) {
//     const service = device.services.find((x) => x.uuid === tactileDisplayService.service.uuid)
//     if (service !== undefined) {
//         const characteristic = service.characteristics.find((characteristic) => characteristic.uuid === tactileDisplayService.characteristics!.frequencyValues.uuid);
//         if (characteristic !== undefined) {
//             writeFrequencyBuffercharacteristic(freqBuffer, characteristic)
//         }
//     }
// }

function writeFrequencyBuffercharacteristic(buffer: Buffer, characteristic: Characteristic) {
    // const raw = new Uint8Array(freqBuffer.length * 2).fill(0)
    // for (let i = 0; i < freqBuffer.length; i = i + 2) {
    //     raw[i] = freqBuffer[i]
    //     raw[i + 1] = freqBuffer[i] >> 8
    // }
    // const buf = Buffer.from(raw);
    characteristic.write(buffer, false, (error) => {
        //go always in this callback if error is null;all is fine
        // console.log(buf);
        if (error !== null) {
            console.log("Error sending freq data");
            console.log(error);
            throw error;
        }
    });
}
