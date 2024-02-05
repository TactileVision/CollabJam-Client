import { IPC_CHANNELS } from "../IPC/IpcChannels";
import { sendMessageToRenderer } from "../IPC/IpcController";
import DeviceManager from "./BlePeripheralConnectionManager";

const tactileDisplayService: Service = {
    service: { uuid: "f33c00018ebf4c9c83ecbfff479a930b", },
    characteristics: {
        numberOfOutputs: {
            uuid: "f33c00028ebf4c9c83ecbfff479a930b",
            callbacks: [
                (characteristic: any) => {
                    characteristic.read((error: any, data: any) => {
                        if (error) {
                            console.log(error);
                        }
                        console.log("num outputs")
                        const x = data.readUInt32LE()
                        sendMessageToRenderer(IPC_CHANNELS.bluetooth.renderer.readNumberOfOutputs, {
                            deviceId: characteristic._peripheralId,
                            numOfOutputs: x
                        })
                    });
                },
            ],
        },
        canChangeAmplitude: {
            uuid: "f33c00038ebf4c9c83ecbfff479a930b",
            callbacks: [
                (characteristic: any) => {
                    characteristic.read((error: any, data: any) => {
                        if (error) {
                            console.log(error);
                        }
                        console.log("amp config")
                        const x = data.readUInt32LE()
                        console.log(x)
                        sendMessageToRenderer(IPC_CHANNELS.bluetooth.renderer.readAmpAvailability, {
                            deviceId: characteristic._peripheralId,
                            ampConf: x
                        })
                    });
                },
            ],
        },
        canChangeFrequency: {
            uuid: "f33c00048ebf4c9c83ecbfff479a930b",
            callbacks: [
                (characteristic: any) => {
                    characteristic.read((error: any, data: any) => {
                        if (error) {
                            console.log(error);
                        }
                        console.log("freq config")
                        const x = data.readUInt32LE()
                        console.log(x)
                        sendMessageToRenderer(IPC_CHANNELS.bluetooth.renderer.readFreqAvailability, {
                            deviceId: characteristic._peripheralId,
                            freqConf: x
                        })
                    });
                },
            ],
        },
        frequencyRange: {
            uuid: "f33c00058ebf4c9c83ecbfff479a930b",
            callbacks: [
                (characteristic: any) => {
                    characteristic.read((error: any, data: any) => {
                        if (error) {
                            console.log(error);
                        }
                        const fMin = data.readUInt16LE(0)
                        const fMax = data.readUInt16LE(2)
                        const fResonance = data.readUInt16LE(4)
                        console.log(fMin, fMax, fResonance);
                        sendMessageToRenderer(IPC_CHANNELS.bluetooth.renderer.readFreqRange, {
                            deviceId: characteristic._peripheralId,
                            freqInfo: { fMin: fMin, fMax: fMax, fResonance: fResonance }
                        })
                    });
                },
            ],
        },
        amplitudeValues: {
            uuid: "f33c00328ebf4c9c83ecbfff479a930b",
            callbacks: [
                (characteristic: any) => {
                    console.log("amplitudeValues")
                }
            ]
        },
        frequencyValues: {
            uuid: "f33c00338ebf4c9c83ecbfff479a930b",
            callbacks: [
                (characteristic: any) => {
                    console.log("frequencyValues")
                }
            ]
        },
    },
};

interface Service {
    service: {
        uuid: string,
        callbacks?: any[],
    },
    characteristics?: {
        [key: string]: {
            uuid: string,
            callbacks?: any[],
        },
    },
}

const knownServices: Service[] = [tactileDisplayService];
//important
const knownServiceUuids = [
    tactileDisplayService.service.uuid,
];

const isKnownService = (serviceIds: string[]): boolean => {
    return serviceIds.some((serviceId) =>
        knownServiceUuids.includes(serviceId)
    )
}



export {
    tactileDisplayService,
    knownServiceUuids,
    knownServices,
    isKnownService
}