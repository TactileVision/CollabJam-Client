import { IPC_CHANNELS } from "../IPCMainManager/IPCChannels";
import { sendMessageToRenderer } from "../IPCMainManager/IPCController";
import DeviceManager from "./DeviceManager";

const hm10Service: Service = {
    service: {
        uuid: "5eb8eec2b92d4dca901c3bc3b69936e6",
        callbacks: [
            (service: any) => {
                service.once("characteristicsDiscover", (characteristic: any) => {
                    console.log(
                        "[HM10 Service] Test Callback, characteristic Discovered!"
                    );
                });
            },
        ],
    },
    characteristics: {
        writeBuffer: {
            uuid: "0000ffe100001000800000805f9b34fb",
        },
        readBuffer: {
            uuid: "00ee4dd0b68d459fb67dbd6ea3297dd0",
            callbacks: [
                (characteristic: any) => {
                    characteristic.notify(true);
                    characteristic.on("data", (state: any) => {
                        // console.log(state);
                        if (state.readInt8(1) === 0) {
                            console.log(
                                "[HM10 BLE Service] Received State update from peripheral"
                            );
                            /**
                            if (webSocketServer != null) {
                                webSocketServer.broadcastData(
                                    WS_SIMPLE_TACTON.tactonUpdatePlaybackState,
                                    state.readInt8(2)
                                );
                            }
                             */
                        }
                    });
                },
            ],
        },
    },
};
const pwmService: Service = {
    service: { uuid: "f20913f7faa84f7b8d21f932d63af743", },
};
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

export interface tactileDisplayServiceReadingProgress {
    numberOfOutputs: boolean,
    canChangeAmplitude: boolean,
    canChangeFrequency: boolean,
    amplitudeValues: boolean,
    frequencyValues: boolean,
}

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
const knownServices: Service[] = [pwmService, hm10Service, tactileDisplayService];
//important
const knownServiceUuids = [
    pwmService.service.uuid,
    hm10Service.service.uuid,
    tactileDisplayService.service.uuid,
];

const isKnownService = (serviceIds: string[]): boolean => {
    return serviceIds.some((serviceId) =>
        knownServiceUuids.includes(serviceId)
    )
}



export {
    hm10Service,
    pwmService,
    tactileDisplayService,
    knownServiceUuids,
    knownServices,
    isKnownService
}