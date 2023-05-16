
import { MutationTree, GetterTree, ActionTree, ActionContext } from 'vuex'
import { RootState, useStore } from '../../store';
import { v4 as uuidv4 } from 'uuid';
import { sendSocketMessage } from '@/renderer/CommunicationManager/WebSocketManager';
import { WS_MSG_TYPE } from '@/renderer/CommunicationManager/WebSocketManager/ws_types';
import { PlayGroundActionTypes, PlayGroundMutations } from './types';
import { IPC_CHANNELS } from '@/electron/IPCMainManager/IPCChannels';
import { InputBinding, InputDevice, InputDeviceBindings, compareDevices, isTriggerActuatorAction } from '@/types/InputBindings';
import { UserInput, compareInputs } from '@/types/InputDetection';

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
    deviceBindings: [],
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
        if(index == -1) {
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
        payload: { device: InputDevice, input: UserInput }, // Obsolete in here but left as an example
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
    [PlayGroundActionTypes.activateKey]({ commit }, payload: { device: InputDevice, input: UserInput }) {
        const deviceIndex = state.deviceBindings.findIndex((deviceBinding) => compareDevices(deviceBinding.device, payload.device));
        if (deviceIndex == -1) return;

        const index = state.deviceBindings[deviceIndex].bindings.findIndex(binding => compareInputs(binding.inputs[0], payload.input));
        if(index == -1) return;

        const binding = state.deviceBindings[deviceIndex].bindings[index];

        if(binding.activeTriggers === 0) {
            const store = useStore();
            const actuatorActions = binding.actions.filter(isTriggerActuatorAction);
            sendSocketMessage(WS_MSG_TYPE.SEND_INSTRUCTION_SERV, {
                roomId: store.state.roomSettings.id,
                instructions: [{
                    keyId: binding.uid,
                    channels: actuatorActions.map(action => action.channel),
                    intensity: actuatorActions[0].intensity * state.globalIntensity
                }]
            });
        }

        commit(PlayGroundMutations.UPDATE_GRID_ITEM, { index, deviceIndex, binding: { ...binding, activeTriggers: binding.activeTriggers + 1 } });
    },
    [PlayGroundActionTypes.deactivateKey]({ commit }, payload: { device: InputDevice, input: UserInput }) {
        const deviceIndex = state.deviceBindings.findIndex((deviceBinding) => compareDevices(deviceBinding.device, payload.device));
        if (deviceIndex == -1) return;

        const index = state.deviceBindings[deviceIndex].bindings.findIndex(binding => compareInputs(binding.inputs[0], payload.input));
        if(index == -1) return;

        const binding = state.deviceBindings[deviceIndex].bindings[index];

        if(binding.activeTriggers === 1) {
           const store = useStore();
           const actuatorActions = binding.actions.filter(isTriggerActuatorAction);
           sendSocketMessage(WS_MSG_TYPE.SEND_INSTRUCTION_SERV, {
                roomId: store.state.roomSettings.id,
                instructions: [
                    {
                        keyId: binding.uid,
                        channels: actuatorActions.map(action => action.channel),
                        intensity: 0
                    }]
            });
        }
        commit(PlayGroundMutations.UPDATE_GRID_ITEM, { index, deviceIndex, binding: { ...binding, activeTriggers: binding.activeTriggers - 1 } });
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
        if(index == -1) return;

        const { activeTriggers, ...oldBinding } = state.deviceBindings[deviceIndex].bindings[index];
        const binding = { ...oldBinding, ...payload.props };

        //save updated keyBoard inside of config
        window.api.send(
            IPC_CHANNELS.main.saveKeyBoardButton,
            { device: { ...payload.device }, binding },
        );
        commit(PlayGroundMutations.UPDATE_GRID_ITEM, { index, deviceIndex, binding: { activeTriggers, ...binding} });
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
                    const actuatorActions = item.actions.filter(isTriggerActuatorAction);
                    instructionList.push({
                        keyId: item.uid,
                        channels: actuatorActions.map(action => action.channel),
                        intensity: actuatorActions[0].intensity * intensity
                    });
                }
                })
        });

        if (instructionList.length > 0) {
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
        for(const deviceBinding of state.deviceBindings) {
            for(const binding of deviceBinding.bindings) {
                if(binding.uid === id)
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
        if(index == -1) return false;

        if (index == -1)
            return false;

        if (originalId !== undefined) {
            //find the same button as updated, its valid to change
            return state.deviceBindings[deviceIndex].bindings[index].uid !== originalId
        }

        return true;
    }
};
