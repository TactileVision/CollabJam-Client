import { Characteristic, Peripheral } from "@abandonware/noble";
import { TactileTask } from "@sharedTypes/tactonTypes";
import { tactileDisplayService } from "./Services";

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
            writeAmplitudeBufferCharacteristic(taskList, characteristic);
        }
    }
}

export function writeAmplitudeBufferCharacteristic(taskList: TactileTask[], characteristic: Characteristic) {

    const numOut = Math.max(...taskList.map(o => Math.max.apply(Math, o.channelIds)))
    let output = new Uint8Array(numOut + 1).fill(255);

    const map = (value: number, x1: number, y1: number, x2: number, y2: number) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;
    taskList.forEach(task => {
        const intensity = map((task.intensity * 100), 0, 100, 0, 254);

        task.channelIds.forEach(channelId => {
            console.log("ChannelID:" + channelId)
            console.log("Intensity:" + intensity)
            output[channelId] = intensity;
        }
        );
    });
    console.log(output)
    const buf = Buffer.from(output);
    console.log(buf)
    characteristic.write(buf, false, (error) => {
        //go always in this callback if error is null;all is fine
        // console.log(buf);
        if (error !== null) {
            console.log("Error sending data");
            console.log(error);
            throw error;
        }

    });
}

export function writeFreqBuffer(device: Peripheral, freqBuffer: number[]) {
    const service = device.services.find((x) => x.uuid === tactileDisplayService.service.uuid)
    if (service !== undefined) {
        const characteristic = service.characteristics.find((characteristic) => characteristic.uuid === tactileDisplayService.characteristics!.frequencyValues.uuid);
        if (characteristic !== undefined) {
            const raw = new Uint8Array(freqBuffer.length * 2).fill(0)
            for (let i = 0; i < freqBuffer.length; i = i + 2) {
                raw[i] = freqBuffer[i]
                raw[i + 1] = freqBuffer[i] >> 8
            }
            const buf = Buffer.from(raw);
            characteristic.write(buf, false, (error) => {
                //go always in this callback if error is null;all is fine
                // console.log(buf);
                if (error !== null) {
                    console.log("Error sending freq data");
                    console.log(error);
                    throw error;
                }
            });
        }
    }
}
