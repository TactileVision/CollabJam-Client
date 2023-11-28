import { IPC_CHANNELS } from "@/core/IPCMainManager/IPCChannels";


export const initMIDI = () => {
	window.api.send(IPC_CHANNELS.midi.main.startMidi);

}