import { MutationTree, GetterTree, ActionTree, ActionContext } from 'vuex'
import { RootState } from '@/app/store/store';
import { MidiInputInfo, MidiOutputInfo } from '@sharedTypes/midiTypes';

/**
 * Types
 * 
 */
export interface PeripheralInformation {
	id: string,
	name: string,
	rssi: number,
	connectionState: 'error' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected',
}

export interface ActuatorParameter {
	amplitude: boolean,
	frequency: boolean,
	// voltage: boolean
}

export interface TactileDisplay {
	info: PeripheralInformation,
	numOfOutputs: number,
	outputParameter: ActuatorParameter[],
	freqInformation: FrequencyInformation
}

export interface FrequencyInformation {
	fMin: number, fMax: number, fResonance: number
}

/**
 * state
 * 
 */
export type State = {
	midiInputs: MidiInputInfo[],
	midiOutputs: MidiOutputInfo[],
	discoveredPeripherals: PeripheralInformation[],
	exist: boolean,
	connectedTactileDisplays: TactileDisplay[]
};

export const state: State = {
	midiInputs: [],
	midiOutputs: [],
	discoveredPeripherals: [],
	exist: true,
	connectedTactileDisplays: [],
};

/**
 * mutations
 * 
 */
export enum DeviceMutations {
	ADD_CONNECTED_DISPLAY = "DM_ADD_CONNECTED_DISPLAY",
	REMOVE_DISPLAY = "DM_REMOVE_DISPLAY",
	UPDATE_CONNECTED_DISPLAY_LIST = "DM_UPDATE_CONNECTED_DISPLAY_LIST",
	UPDATE_CONNECTED_DISPLAY = "DM_UPDATE_CONNECTED_DISPLAY",
	ADD_SCANNED_PERIPHERAL = "DM_ADD_SCANNED_PERIPHERAL",
	UPDATE_SCANNED_PERIPHERAL_LIST = "DM_UPDATE_SCANNED_PERIPHERAL_LIST",
	UPDATE_FREQ_INFORMATION = "DM_UPDATE_FREQ_INFORMATION",
	ADD_MIDI_INPUT = "DM_ADD_MIDI_INPUT",
	ADD_MIDI_OUTPUT = "DM_ADD_MIDI_OUTPUT"
}

export type Mutations<S = State> = {
	[DeviceMutations.ADD_CONNECTED_DISPLAY](state: S, device: TactileDisplay): void
	[DeviceMutations.REMOVE_DISPLAY](state: S, uuid: string): void
	[DeviceMutations.UPDATE_CONNECTED_DISPLAY_LIST](state: S, deviceList: TactileDisplay[]): void
	[DeviceMutations.UPDATE_CONNECTED_DISPLAY](state: S, item: { index: number, device: TactileDisplay }): void
	[DeviceMutations.ADD_SCANNED_PERIPHERAL](state: S, device: PeripheralInformation): void
	[DeviceMutations.UPDATE_SCANNED_PERIPHERAL_LIST](state: S, deviceList: PeripheralInformation[]): void
	[DeviceMutations.UPDATE_FREQ_INFORMATION](state: S, info: { uuid: string, freqInfo: FrequencyInformation }): void
	[DeviceMutations.ADD_MIDI_INPUT](state: S, device: MidiInputInfo): void
	[DeviceMutations.ADD_MIDI_OUTPUT](state: S, device: MidiOutputInfo): void
}

export const mutations: MutationTree<State> & Mutations = {
	[DeviceMutations.ADD_CONNECTED_DISPLAY](state, device) {
		state.connectedTactileDisplays.push(device);
	},
	[DeviceMutations.REMOVE_DISPLAY](state, uuid) {
		const index = state.connectedTactileDisplays.findIndex(e => e.info.id == uuid)
		if (index > -1) {
			state.connectedTactileDisplays.splice(index, 1);
		}
	},
	[DeviceMutations.UPDATE_CONNECTED_DISPLAY_LIST](state, deviceList) {
		state.connectedTactileDisplays = deviceList;
	},
	[DeviceMutations.UPDATE_CONNECTED_DISPLAY](state, item) {
		state.connectedTactileDisplays[item.index] = item.device;
		console.log(state)
	},
	[DeviceMutations.ADD_SCANNED_PERIPHERAL](state, device) {
		state.discoveredPeripherals.push(device);
	},
	[DeviceMutations.UPDATE_SCANNED_PERIPHERAL_LIST](state, deviceList) {
		state.discoveredPeripherals = deviceList;
	},
	[DeviceMutations.UPDATE_FREQ_INFORMATION](state, info) {
		const index = state.connectedTactileDisplays.findIndex(e => e.info.id == info.uuid)
		if (index > -1) {
			state.connectedTactileDisplays[index].freqInformation = info.freqInfo
		}
	},
	[DeviceMutations.ADD_MIDI_INPUT](state, device) {
		state.midiInputs.push(device)

	},
	[DeviceMutations.ADD_MIDI_OUTPUT](state, device) {
		state.midiOutputs.push(device)
	}

};

/**
 * actions
 * 
 */
export enum DeviceManagerStoreActionTypes {
	discoveredPeripheral = 'discoveredPeripheral',
	addConnectedDisplay = 'connectedToDisplay',
	removeDisconnectedDisplay = 'removeDisconnectedDisplay',
	updatePeripheralStatus = 'updateDeviceStatus',
	setNumberOfOutputs = "setNumberOfOutputs",
	setFreqAvailability = "setFreqAvailability",
	setAmpAvailability = "setAmpAvailability",
	setFreqInfo = "setFreqInfo",
	addMidiInput = "addMidiInput",
	addMidiOutput = "addMidiOutput"
}

type AugmentedActionContext = {
	commit<K extends keyof Mutations>(
		key: K,
		payload: Parameters<Mutations[K]>[1],
	): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, RootState>, 'commit'>

export interface Actions {
	[DeviceManagerStoreActionTypes.discoveredPeripheral](
		{ commit }: AugmentedActionContext,
		payload: PeripheralInformation, // Obsolete in here but left as an example
	): void;
	[DeviceManagerStoreActionTypes.addConnectedDisplay](
		{ commit }: AugmentedActionContext,
		payload: TactileDisplay, // Obsolete in here but left as an example
	): void;
	[DeviceManagerStoreActionTypes.removeDisconnectedDisplay](
		{ commit }: AugmentedActionContext,
		payload: string, // Obsolete in here but left as an example
	): void;
	[DeviceManagerStoreActionTypes.updatePeripheralStatus](
		{ commit }: AugmentedActionContext,
		payload: TactileDisplay, // Obsolete in here but left as an example
	): void;

	[DeviceManagerStoreActionTypes.setNumberOfOutputs](
		{ commit }: AugmentedActionContext,
		payload: { deviceId: string, numOfOutputs: number }
	): void;
	[DeviceManagerStoreActionTypes.setFreqAvailability](
		{ commit }: AugmentedActionContext,
		payload: { deviceId: string, freqConf: number }
	): void;
	[DeviceManagerStoreActionTypes.setAmpAvailability](
		{ commit }: AugmentedActionContext,
		payload: { deviceId: string, ampConf: number }
	): void;
	[DeviceManagerStoreActionTypes.setFreqInfo](
		{ commit }: AugmentedActionContext,
		payload: { deviceId: string, freqInfo: FrequencyInformation }
	): void;
	[DeviceManagerStoreActionTypes.addMidiInput](
		{ commit }: AugmentedActionContext,
		payload: MidiInputInfo
	): void;
	[DeviceManagerStoreActionTypes.addMidiOutput](
		{ commit }: AugmentedActionContext,
		payload: MidiOutputInfo
	): void;
}

export const actions: ActionTree<State, RootState> & Actions = {
	[DeviceManagerStoreActionTypes.discoveredPeripheral]({ commit }, newDevice: PeripheralInformation) {
		if (state.discoveredPeripherals.some(device => device.id == newDevice.id))
			return;
		commit(DeviceMutations.ADD_SCANNED_PERIPHERAL, newDevice);
	},
	[DeviceManagerStoreActionTypes.addConnectedDisplay]({ commit }, newDevice: TactileDisplay) {
		if (state.connectedTactileDisplays.some(device => device.info.id == newDevice.info.id))
			return;

		commit(DeviceMutations.ADD_CONNECTED_DISPLAY, newDevice);
	},
	[DeviceManagerStoreActionTypes.removeDisconnectedDisplay]({ commit }, uuid: string) {
		commit(DeviceMutations.REMOVE_DISPLAY, uuid);
	},
	[DeviceManagerStoreActionTypes.updatePeripheralStatus]({ commit }, modifiedDevice: TactileDisplay) {
		const index = state.connectedTactileDisplays.findIndex(device => device.info.id === modifiedDevice.info.id);
		//no device found
		if (index == -1)
			return;

		commit(DeviceMutations.UPDATE_CONNECTED_DISPLAY, { index: index, device: modifiedDevice });
	},
	[DeviceManagerStoreActionTypes.setNumberOfOutputs]({ commit }, payload: { deviceId: string, numOfOutputs: number }) {
		const index = state.connectedTactileDisplays.findIndex(device => device.info.id === payload.deviceId);
		//no device found
		if (index == -1)
			return;
		state.connectedTactileDisplays[index].numOfOutputs = payload.numOfOutputs
		commit(DeviceMutations.UPDATE_CONNECTED_DISPLAY, { index: index, device: { ...state.connectedTactileDisplays[index] } });
	},
	[DeviceManagerStoreActionTypes.setFreqAvailability]({ commit }, payload: { deviceId: string, freqConf: number }) {
		const index = state.connectedTactileDisplays.findIndex(device => device.info.id === payload.deviceId);
		//no device found
		if (index == -1)
			return;
		const d = state.connectedTactileDisplays[index]
		for (let i = 0; i < 32; i++) {
			if (d.outputParameter[i] == undefined) {
				d.outputParameter[i] = { amplitude: false, frequency: false };
			}
			d.outputParameter[i].frequency = ((payload.freqConf >> i) & 0x01) == 1
		}
		commit(DeviceMutations.UPDATE_CONNECTED_DISPLAY, { index: index, device: { ...state.connectedTactileDisplays[index] } });
	},
	[DeviceManagerStoreActionTypes.setAmpAvailability]({ commit }, payload: { deviceId: string, ampConf: number }) {
		const index = state.connectedTactileDisplays.findIndex(device => device.info.id === payload.deviceId);
		//no device found
		if (index == -1)
			return;

		const d = state.connectedTactileDisplays[index]
		if (d == null) return;
		for (let i = 0; i < 32; i++) {
			if (d.outputParameter[i] == undefined) {
				d.outputParameter[i] = { amplitude: false, frequency: false };
			}
			d.outputParameter[i].amplitude = ((payload.ampConf >> i) & 0x01) == 1
		}
		commit(DeviceMutations.UPDATE_CONNECTED_DISPLAY, { index: index, device: { ...state.connectedTactileDisplays[index] } });
	},
	[DeviceManagerStoreActionTypes.setFreqInfo]({ commit }, payload: { deviceId: string, freqInfo: FrequencyInformation }) {
		const index = state.connectedTactileDisplays.findIndex(device => device.info.id === payload.deviceId);
		//no device found
		if (index == -1)
			return;

		const d = state.connectedTactileDisplays[index]
		if (d == null) return;

		commit(DeviceMutations.UPDATE_FREQ_INFORMATION, { uuid: payload.deviceId, freqInfo: payload.freqInfo });
	},

	[DeviceManagerStoreActionTypes.addMidiInput]({ commit }, device: MidiInputInfo) {
		if (state.midiInputs.findIndex((d) => { return d.id === device.id }) == -1) {
			commit(DeviceMutations.ADD_MIDI_INPUT, device)
		}
	},

	[DeviceManagerStoreActionTypes.addMidiOutput]({ commit }, device: MidiOutputInfo) {
		if (state.midiOutputs.findIndex((d) => { return d.id === device.id }) == -1) {
			commit(DeviceMutations.ADD_MIDI_OUTPUT, device)
		}
	},
};

/**
 * Getters
 */
export type Getters = {
	// getDeviceStatus(state: State): (id: string) => DeviceStatus,
	getNumberOfConnectedDisplays(state: State): number,
	getTactileDisplays(state: State): TactileDisplay[]
}

export const getters: GetterTree<State, RootState> & Getters = {
	getNumberOfConnectedDisplays: (state) => {
		return state.connectedTactileDisplays.length
	},
	getTactileDisplays(state) {
		return state.connectedTactileDisplays
	},
	getMidiInputs(state) {
		return state.midiInputs
	},
	getMidiOutputs(state) {
		return state.midiOutputs
	}
};
