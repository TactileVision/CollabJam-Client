
import { MutationTree, GetterTree, ActionTree, ActionContext } from 'vuex'
import { RootState, useStore } from '../../store';
import { v4 as uuidv4 } from 'uuid';
import { sendSocketMessage } from '@/renderer/CommunicationManager/WebSocketManager';
import { WS_MSG_TYPE } from '@/renderer/CommunicationManager/WebSocketManager/ws_types';
import { PlayGroundActionTypes, PlayGroundMutations } from './types';
import { IPC_CHANNELS } from '@/electron/IPCMainManager/IPCChannels';
import { GamepadDevice, InputBinding, InputDevice, InputDeviceBindings, TactileAction, compareDevices } from '@/types/InputBindings';
import { GamepadAxisInput, GamepadButtonInput, UserInput, UserInputType, compareInputs } from '@/types/InputDetection';
import { executeAllInputHandlers } from '@/renderer/InputHandling/InputHandlerManager';

export interface Layout {
    x: number,
    y: number
}
/**
 * state
 *
 */

export interface StateInputBinding extends InputBinding {
    activeTriggers: number;
}

export interface StateDeviceBindings extends InputDeviceBindings {
    bindings: StateInputBinding[];
}

export type State = {
    gridLayout: Layout
    deviceBindings: StateDeviceBindings[],
    globalIntensity: number,
    inEditMode: boolean
};

export const state: State = {
    gridLayout: { x: 11, y: 8 },
    deviceBindings: [{
        device: { type: "gamepad", name: "Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 02fd)", index: 0 } as GamepadDevice,
        bindings: [

            {
                inputs: [{ type: UserInputType.GamepadAxis, index: 0 } as GamepadAxisInput],
                activeTriggers: 0,
                uid: "UNIQUE",
                position: { x: 1, y: 5, w: 1, h: 1 },
                name: "dynamic",
                color: "#ff0000",
                actions: [{ type: "trigger_actuator_with_dynamic_intensity", channel: 1 } as TactileAction]
            },
            // {
            //     inputs: [{ type: UserInputType.GamepadAxis, index: 1 } as GamepadAxisInput],
            //     activeTriggers: 0,
            //     uid: "UNIQUE2",
            //     position: { x: 1, y: 5, w: 1, h: 1 },
            //     name: "dynamic2",
            //     color: "#ff0000",
            //     actions: [{ type: "trigger_actuator_with_dynamic_intensity", channel: 2 } as TactileAction]
            // },
            {
                inputs: [{ type: UserInputType.GamepadButton, index: 6 } as GamepadButtonInput],
                activeTriggers: 0,
                uid: "SET_INTENSITY",
                position: { x: 0, y: 1, w: 1, h: 1 },
                name: "set",
                color: "#00ffff",
                actions: [{ type: "set_intensity_action", name: "intensity_test" } as TactileAction]
            },
            {
                inputs: [{ type: UserInputType.GamepadButton, index: 0 } as GamepadButtonInput],
                activeTriggers: 0,
                uid: "USE_INTENSITY",
                position: { x: 4, y: 2, w: 1, h: 1 },
                name: "get",
                color: "#00ffff",
                actions: [{ type: "trigger_actuator_with_variable_intensity_action", name: "intensity_test", channel: 1 } as TactileAction]
            },
            {
                inputs: [{ type: UserInputType.GamepadButton, index: 1 } as GamepadButtonInput],
                activeTriggers: 0,
                uid: "USE_INTENSITY2",
                position: { x: 5, y: 1, w: 1, h: 1 },
                name: "get",
                color: "#00ffff",
                actions: [{ type: "trigger_actuator_with_variable_intensity_action", name: "intensity_test", channel: 2 } as TactileAction]
            },
            {
                inputs: [{ type: UserInputType.GamepadButton, index: 2 } as GamepadButtonInput],
                activeTriggers: 0,
                uid: "USE_INTENSITY3",
                position: { x: 3, y: 1, w: 1, h: 1 },
                name: "get",
                color: "#00ffff",
                actions: [{ type: "trigger_actuator_with_variable_intensity_action", name: "intensity_test", channel: 3 } as TactileAction]
            },
            {
                inputs: [{ type: UserInputType.GamepadButton, index: 3 } as GamepadButtonInput],
                activeTriggers: 0,
                uid: "USE_INTENSITY4",
                position: { x: 4, y: 0, w: 1, h: 1 },
                name: "get",
                color: "#00ffff",
                actions: [{ type: "trigger_actuator_with_variable_intensity_action", name: "intensity_test", channel: 4 } as TactileAction]
            }
        ]
    }],
    globalIntensity: 1,
    inEditMode: false,
};
/**
 * mutations
 *
 */
export type Mutations<S = State> = {
    [PlayGroundMutations.BULK_GRID_UPDATE](state: S, deviceBindings: InputDeviceBindings[]): void
    [PlayGroundMutations.UPDATE_GRID_ITEM](state: S, payload: { index: number, deviceIndex: number, binding: StateInputBinding }): void
    [PlayGroundMutations.ADD_ITEM_TO_GRID](state: S, payload: { device: InputDevice, binding: StateInputBinding }): void
    [PlayGroundMutations.DELETE_ITEM_FROM_GRID](state: S, payload: { device: InputDevice, uid: string }): void
    [PlayGroundMutations.UPDATE_GLOBAL_INTENSITY](state: S, intensity: number): void
    [PlayGroundMutations.UPDATE_EDIT_MDOE](state: S, edditModeOn: boolean): void
}

export const mutations: MutationTree<State> & Mutations = {
    [PlayGroundMutations.BULK_GRID_UPDATE](state, deviceBindings) {
        state.deviceBindings = deviceBindings.map(deviceBinding => (
            {
                device: deviceBinding.device,
                bindings: deviceBinding.bindings.map(binding => ({ ...binding, activeTriggers: 0 }))
            }
        ))
    },
    [PlayGroundMutations.UPDATE_GRID_ITEM](state, payload) {
        state.deviceBindings[payload.deviceIndex].bindings[payload.index] = payload.binding;
    },
    [PlayGroundMutations.ADD_ITEM_TO_GRID](state, payload) {
        const index = state.deviceBindings.findIndex(deviceBinding => compareDevices(deviceBinding.device, payload.device));
        if (index == -1) {
            state.deviceBindings.push({ device: payload.device, bindings: [payload.binding] })
        } else {
            state.deviceBindings[index].bindings.push(payload.binding);
        }
    },
    [PlayGroundMutations.DELETE_ITEM_FROM_GRID](state, payload) {
        const deviceIndex = state.deviceBindings.findIndex(deviceBinding => compareDevices(deviceBinding.device, payload.device));
        const index = state.deviceBindings[deviceIndex].bindings.findIndex(binding => binding.uid === payload.uid);
        if (index != -1)
            state.deviceBindings[deviceIndex].bindings.splice(index, 1);
    },
    [PlayGroundMutations.UPDATE_GLOBAL_INTENSITY](state, intensity) {
        state.globalIntensity = intensity;
    },
    [PlayGroundMutations.UPDATE_EDIT_MDOE](state, edditModeOn) {
        state.inEditMode = edditModeOn;
    },
};

/**
 * actions
 *
 */

type AugmentedActionContext = {
    commit<K extends keyof Mutations>(
        key: K,
        payload: Parameters<Mutations[K]>[1],
    ): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, RootState>, 'commit'>

export interface Actions {
    [PlayGroundActionTypes.activateKey](
        { commit }: AugmentedActionContext,
        payload: { device: InputDevice, input: UserInput, value: number, wasActive: boolean }, // Obsolete in here but left as an example
    ): void;
    [PlayGroundActionTypes.deactivateKey](
        { commit }: AugmentedActionContext,
        payload: { device: InputDevice, input: UserInput }, // Obsolete in here but left as an example
    ): void;
    [PlayGroundActionTypes.addButtonToGrid](
        { commit }: AugmentedActionContext,
        payload: { binding: Omit<InputBinding, "uid" | "position">, device: InputDevice }, // Obsolete in here but left as an example
    ): void;
    [PlayGroundActionTypes.updateKeyButton](
        { commit }: AugmentedActionContext,
        payload: { id: string, device: InputDevice, props: any }, // Obsolete in here but left as an example
    ): void;
    [PlayGroundActionTypes.modifyGlobalIntensity](
        { commit }: AugmentedActionContext,
        payload: number, // Obsolete in here but left as an example
    ): void;
}

export const actions: ActionTree<State, RootState> & Actions = {
    [PlayGroundActionTypes.activateKey]({ commit }, payload: { device: InputDevice, input: UserInput, value: number, wasActive: boolean }) {
        const deviceIndex = state.deviceBindings.findIndex((deviceBinding) => compareDevices(deviceBinding.device, payload.device));
        if (deviceIndex == -1) return;

        const index = state.deviceBindings[deviceIndex].bindings.findIndex(binding => compareInputs(binding.inputs[0], payload.input));
        if (index == -1) return;

        const binding = state.deviceBindings[deviceIndex].bindings[index];

        const store = useStore();
        const newBinding = { ...binding, activeTriggers: binding.activeTriggers + 1 };

        const instructions = executeAllInputHandlers({
            binding: newBinding,
            value: payload.value,
            wasActive: payload.wasActive,
            globalIntensity: state.globalIntensity
        });

        if (instructions.length > 0) {
            // console.log(instructions)
            sendSocketMessage(WS_MSG_TYPE.SEND_INSTRUCTION_SERV, {
                roomId: store.state.roomSettings.id,
                instructions: instructions.map((instruction) => ({ keyId: binding.uid, ...instruction }))
            });
        }

        if (!payload.wasActive)
            commit(PlayGroundMutations.UPDATE_GRID_ITEM, { index, deviceIndex, binding: newBinding });
    },
    [PlayGroundActionTypes.deactivateKey]({ commit }, payload: { device: InputDevice, input: UserInput }) {
        const deviceIndex = state.deviceBindings.findIndex((deviceBinding) => compareDevices(deviceBinding.device, payload.device));
        if (deviceIndex == -1) return;

        const index = state.deviceBindings[deviceIndex].bindings.findIndex(binding => compareInputs(binding.inputs[0], payload.input));
        if (index == -1) return;

        const binding = state.deviceBindings[deviceIndex].bindings[index];

        const store = useStore();
        const newBinding = { ...binding, activeTriggers: binding.activeTriggers - 1 };

        const instructions = executeAllInputHandlers({ binding: newBinding, value: 0, wasActive: true, globalIntensity: state.globalIntensity });
        if (instructions.length > 0) {
            sendSocketMessage(WS_MSG_TYPE.SEND_INSTRUCTION_SERV, {
                roomId: store.state.roomSettings.id,
                instructions: instructions.map((instruction) => ({ keyId: binding.uid, ...instruction }))
            });
        }

        commit(PlayGroundMutations.UPDATE_GRID_ITEM, { index, deviceIndex, binding: newBinding });
    },
    [PlayGroundActionTypes.addButtonToGrid]({ commit }, payload: { binding: Omit<InputBinding, "uid" | "position">, device: InputDevice }) {
        const uid = uuidv4();
        /**function to find free Space at start,
         * if there is no space set it x:0,y:0
         * */
        const usedPositions = state.deviceBindings.flatMap(deviceBinding => deviceBinding.bindings).map(binding => binding.position);
        let space = { x: 0, y: 0 };
        loop1: for (let posY = 0; posY < state.gridLayout.y; posY++) {
            for (let posX = 0; posX < state.gridLayout.x; posX++) {
                let freeSpace = true;
                for (const position of usedPositions) {
                    if (position.x == posX && position.y == posY) {
                        freeSpace = false;
                        break;
                    }
                }
                if (freeSpace) {
                    space = { x: posX, y: posY };
                    break loop1;
                }
            }
        }
        const inputBinding = { uid, position: { h: 1, w: 1, ...space }, ...payload.binding }
        //save updated keyBoard inside of config
        window.api.send(
            IPC_CHANNELS.main.saveKeyBoardButton,
            { device: { ...payload.device }, binding: inputBinding },
        );
        //save it in store
        commit(PlayGroundMutations.ADD_ITEM_TO_GRID, { device: payload.device, binding: { activeTriggers: 0, ...inputBinding } });
    },
    [PlayGroundActionTypes.updateKeyButton]({ commit }, payload: { id: string, device: InputDevice, props: any }) {
        const deviceIndex = state.deviceBindings.findIndex((deviceBinding) => compareDevices(deviceBinding.device, payload.device));
        if (deviceIndex == -1) return;

        const index = state.deviceBindings[deviceIndex].bindings.findIndex(binding => binding.uid === payload.id);
        if (index == -1) return;

        const { activeTriggers, ...oldBinding } = state.deviceBindings[deviceIndex].bindings[index];
        const binding = { ...oldBinding, ...payload.props };

        //save updated keyBoard inside of config
        window.api.send(
            IPC_CHANNELS.main.saveKeyBoardButton,
            { device: { ...payload.device }, binding },
        );
        commit(PlayGroundMutations.UPDATE_GRID_ITEM, { index, deviceIndex, binding: { activeTriggers, ...binding } });
    },
    [PlayGroundActionTypes.modifyGlobalIntensity]({ commit }, intensity: number) {
        console.log("intensity " + intensity);
        commit(PlayGroundMutations.UPDATE_GLOBAL_INTENSITY, intensity);

        const instructionList: {
            keyId: string,
            channels: number[],
            intensity: number
        }[] = []

        state.deviceBindings.forEach(deviceBinding => {
            deviceBinding.bindings.forEach(item => {
                if (item.activeTriggers > 0) {
                    instructionList.push(
                        ...executeAllInputHandlers({ binding: item, value: 1, wasActive: false, globalIntensity: intensity })
                            .map(instruction => ({ keyId: item.uid, ...instruction }))
                    );
                }
            })
        });

        if (instructionList.length > 0) {
            console.log("instructionList")
            console.log(instructionList)
            const store = useStore();
            sendSocketMessage(WS_MSG_TYPE.SEND_INSTRUCTION_SERV, {
                roomId: store.state.roomSettings.id,
                instructions: instructionList
            });
        }
    },
};

/**
 * Getters
 */
export type Getters = {
    getKeyButton(state: State): (id: string) => { device: InputDevice, binding: StateInputBinding } | undefined,
    isActiveKey(state: State): (id: string) => boolean,
    isKeyAlreadyTaken(state: State): (originalId: string | undefined, device: InputDevice, input: UserInput) => boolean,
}

export const getters: GetterTree<State, RootState> & Getters = {
    getKeyButton: (state) => (id) => {
        for (const deviceBinding of state.deviceBindings) {
            for (const binding of deviceBinding.bindings) {
                if (binding.uid === id)
                    return { device: deviceBinding.device, binding };
            }
        }
    },
    isActiveKey: (state) => (id) => {
        const binding = state.deviceBindings.flatMap(deviceBinding => deviceBinding.bindings).find(binding => binding.uid === id);
        if (!binding)
            return false;

        return binding.activeTriggers > 0;
    },
    isKeyAlreadyTaken: (state) => (originalId, device, input) => {
        const deviceIndex = state.deviceBindings.findIndex((deviceBinding) => compareDevices(deviceBinding.device, device));
        if (deviceIndex == -1) return false;

        const index = state.deviceBindings[deviceIndex].bindings.findIndex(binding => compareInputs(binding.inputs[0], input));
        if (index == -1) return false;

        if (index == -1)
            return false;

        if (originalId !== undefined) {
            //find the same button as updated, its valid to change
            return state.deviceBindings[deviceIndex].bindings[index].uid !== originalId
        }

        return true;
    }
};
