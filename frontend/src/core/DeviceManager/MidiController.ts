import { WebMidi } from "../../../node_modules/webmidi/dist/esm/webmidi.esm.js";
import { IPC_CHANNELS } from "@/core/IPCMainManager/IPCChannels";
import { sendMessageToRenderer } from "@/core/IPCMainManager/IPCController";
import { MidiInputInfo, MidiOutputInfo, NoteOn } from "@sharedTypes/midiTypes.js";
import DeviceManager from "./DeviceManager";

// export const startMidiElectron = () => {
// 	window.api.send(IPC_CHANNELS.midi.main.startMidi, {});
// }
export const initMidi = () => {
	console.log("init Midi!")
	WebMidi.enable()
		// .then(onEnabled)
		.catch(err => console.log(err));

	WebMidi.addListener("connected", (e) => {
		console.log(e.port)
		if (e.port._midiInput !== undefined) {
			// console.log("Input connected, sending to client")
			const device: MidiInputInfo = { id: e.port._midiInput.id, name: e.port._midiInput.name, channels: e.port.channels.length - 1 }
			sendMessageToRenderer(IPC_CHANNELS.midi.renderer.inputDeviceAvailable, device)
		} else if (e.port._midiOutput !== undefined) {
			// console.log("Output connected, sending to client")
			const device: MidiOutputInfo = { id: e.port._midiOutput.id, name: e.port._midiOutput.name, channels: e.port.channels.length - 1 }
			sendMessageToRenderer(IPC_CHANNELS.midi.renderer.outputDeviceAvailable, device)
			DeviceManager.addMidiOutput(device)
		}
	})

	WebMidi.addListener("disconnected", (e) => {
		console.log(e)
	})

}

export const midiNoteOn = (params: NoteOn) => {
	//TODO Lookup Table for frequency to midi number conversion
	console.log("Playing note")
	console.log(params)
	const device = WebMidi.getOutputById(params.deviceId)
	// console.log(device?.connection)
	//https://rdrr.io/github/pmcharrison/hrep/src/R/scales.R
	const midiNum = Math.ceil(69 + Math.log2(params.frequency / 440) * 12)
	console.log(midiNum)
	device?.sendNoteOn(midiNum, { channels: params.channels, attack: params.amplitude })
	// WebMidi.getOutputById(params.deviceId)?.sendNoteOn()

}