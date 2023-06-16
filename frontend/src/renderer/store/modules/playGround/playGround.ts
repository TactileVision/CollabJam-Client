
import { MutationTree, GetterTree, ActionTree, ActionContext } from 'vuex'
import { RootState, useStore } from '../../store';
import { v4 as uuidv4 } from 'uuid';
import { PlayGroundActionTypes, PlayGroundMutations } from './types';
import { IPC_CHANNELS } from '@/electron/IPCMainManager/IPCChannels';
import { DeviceType, GamepadDevice, InputBinding, InputDevice, InputProfile, KeyboardDevice, TactileAction, compareDevices } from '@/types/InputBindings';
import { GamepadAxisInput, GamepadButtonInput, KeyInput, UserInput, UserInputType, compareInputs } from '@/types/InputDetection';
import { executeAllInputHandlers } from '@/renderer/InputHandling/InputHandlerManager';
import { TactonMutations } from '../tactonSettings/tactonSettings';
import profiles from './profiles';

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

export interface StateProfile extends InputProfile {
    bindings: StateInputBinding[];
}

export type State = {
    gridLayout: Layout
    profiles: StateProfile[],
    // The value is the index into the profiles array.
    selectedProfiles: { device: InputDevice, profileIndex: number }[]
    globalIntensity: number,
    inEditMode: boolean
};

export const state: State = {
    gridLayout: { x: 11, y: 8 },
    profiles: profiles,
    selectedProfiles: [
        {
            device: { type: DeviceType.StandardGamepad, name: "Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 02fd)", index: 0 } as GamepadDevice,
            profileIndex: 0
        },
        {
            device: { type: DeviceType.Keyboard },
            profileIndex: 3,
        },
    ],
    globalIntensity: 1,
    inEditMode: false,
};
/**
 * mutations
 *
 */
export type Mutations<S = State> = {
    [PlayGroundMutations.BULK_GRID_UPDATE](state: S, deviceBindings: InputProfile[]): void
    [PlayGroundMutations.UPDATE_GRID_ITEM](state: S, payload: { index: number, profile: StateProfile, binding: StateInputBinding }): void
    [PlayGroundMutations.ADD_ITEM_TO_GRID](state: S, payload: { profile: StateProfile, binding: StateInputBinding }): void
    [PlayGroundMutations.DELETE_ITEM_FROM_GRID](state: S, payload: { profileUid: string, uid: string }): void
    [PlayGroundMutations.UPDATE_GLOBAL_INTENSITY](state: S, intensity: number): void
    [PlayGroundMutations.UPDATE_EDIT_MDOE](state: S, edditModeOn: boolean): void
    [PlayGroundMutations.UPDATE_PROFILE](state: S, payload: { device: InputDevice; profileUid: string }): void
}

export const mutations: MutationTree<State> & Mutations = {
    [PlayGroundMutations.BULK_GRID_UPDATE](state, profiles) {
        state.profiles = profiles.map(profile => (
            {
                ...profile,
                bindings: profile.bindings.map(binding => ({ ...binding, activeTriggers: 0 }))
            }
        ))
    },
    [PlayGroundMutations.UPDATE_GRID_ITEM](state, payload) {
        const profileIndex = state.profiles.findIndex(profile => profile.uid === payload.profile.uid);
        if (profileIndex === -1)
            return;
        state.profiles[profileIndex].bindings[payload.index] = payload.binding;
    },
    [PlayGroundMutations.ADD_ITEM_TO_GRID](state, payload) {
        const index = state.profiles.findIndex(profile => profile.uid === payload.profile.uid);
        if (index == -1) {
            state.profiles.push({ ...payload.profile, bindings: [payload.binding] })
        } else {
            state.profiles[index].bindings.push(payload.binding);
        }
    },
    [PlayGroundMutations.DELETE_ITEM_FROM_GRID](state, payload) {
        const deviceIndex = state.profiles.findIndex(profile => profile.uid === payload.profileUid);
        const index = state.profiles[deviceIndex].bindings.findIndex(binding => binding.uid === payload.uid);
        if (index != -1)
            state.profiles[deviceIndex].bindings.splice(index, 1);
    },
    [PlayGroundMutations.UPDATE_GLOBAL_INTENSITY](state, intensity) {
        state.globalIntensity = intensity;
    },
    [PlayGroundMutations.UPDATE_EDIT_MDOE](state, edditModeOn) {
        state.inEditMode = edditModeOn;
    },
    [PlayGroundMutations.UPDATE_PROFILE](state, { device, profileUid }) {
        const profileIndex = state.profiles.findIndex(
            (profile) => profile.uid === profileUid
        );
        if (profileIndex == -1) return;

        const selectedProfileIndex = state.selectedProfiles.findIndex(
            ({ device: selectedDevice }) => compareDevices(selectedDevice, device)
        );

        if (selectedProfileIndex === -1) {
          state.selectedProfiles.push({ device, profileIndex });
        } else {
          state.selectedProfiles[selectedProfileIndex].profileIndex = profileIndex;
        }
    }
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
        payload: { profile: StateProfile, input: UserInput, value: number, wasActive: boolean }, // Obsolete in here but left as an example
    ): void;
    [PlayGroundActionTypes.deactivateKey](
        { commit }: AugmentedActionContext,
        payload: { profile: StateProfile, input: UserInput }, // Obsolete in here but left as an example
    ): void;
    [PlayGroundActionTypes.addButtonToGrid](
        { commit }: AugmentedActionContext,
        payload: { binding: Omit<InputBinding, "uid" | "position">, profile: StateProfile }, // Obsolete in here but left as an example
    ): void;
    [PlayGroundActionTypes.updateKeyButton](
        { commit }: AugmentedActionContext,
        payload: { id: string, profileUid: string, props: any }, // Obsolete in here but left as an example
    ): void;
    [PlayGroundActionTypes.modifyGlobalIntensity](
        { commit }: AugmentedActionContext,
        payload: number, // Obsolete in here but left as an example
    ): void;
}

export const actions: ActionTree<State, RootState> & Actions = {
    [PlayGroundActionTypes.activateKey]({ commit }, payload: { profile: StateProfile, input: UserInput, value: number, wasActive: boolean }) {
        const index = payload.profile.bindings.findIndex(binding => compareInputs(binding.inputs[0], payload.input));
        if (index == -1) return;

        const binding = payload.profile.bindings[index];

        const store = useStore();
        const newBinding = { ...binding, activeTriggers: binding.activeTriggers + 1 };

        const instructions = executeAllInputHandlers({
            binding: newBinding,
            value: payload.value,
            wasActive: payload.wasActive,
            globalIntensity: state.globalIntensity
        });

        if (instructions.length > 0) {
            store.commit(TactonMutations.APPEND_DEBOUNCE_BUFFER, instructions)
        }

        if (!payload.wasActive)
            commit(PlayGroundMutations.UPDATE_GRID_ITEM, { index, profile: payload.profile, binding: newBinding });
    },
    [PlayGroundActionTypes.deactivateKey]({ commit }, payload: { profile: StateProfile, input: UserInput }) {
        const index = payload.profile.bindings.findIndex(binding => compareInputs(binding.inputs[0], payload.input));
        if (index == -1) return;

        const binding = payload.profile.bindings[index];

        const store = useStore();
        const newBinding = { ...binding, activeTriggers: binding.activeTriggers - 1 };

        const instructions = executeAllInputHandlers({ binding: newBinding, value: 0, wasActive: true, globalIntensity: state.globalIntensity });
        if (instructions.length > 0) {
            store.commit(TactonMutations.APPEND_DEBOUNCE_BUFFER, instructions.map((instruction) => ({ keyId: binding.uid, ...instruction })))
        }

        commit(PlayGroundMutations.UPDATE_GRID_ITEM, { index, profile: payload.profile, binding: newBinding });
    },
    [PlayGroundActionTypes.addButtonToGrid]({ commit }, payload: { binding: Omit<InputBinding, "uid" | "position">, profile: StateProfile }) {
        const uid = uuidv4();
        /**function to find free Space at start,
         * if there is no space set it x:0,y:0
         * */
        const usedPositions = state.profiles.flatMap(profile => profile.bindings).map(binding => binding.position);
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
        // get profile by device -> add profile uid to ipc call
        window.api.send(
            IPC_CHANNELS.main.saveKeyBoardButton,
            { profileUid: payload.profile.uid, binding: inputBinding },
        );
        //save it in store
        commit(PlayGroundMutations.ADD_ITEM_TO_GRID, { profile: payload.profile, binding: { activeTriggers: 0, ...inputBinding } });
    },
    [PlayGroundActionTypes.updateKeyButton]({ commit }, payload: { id: string, profileUid: string, props: any }) {
        const profileIndex = state.profiles.findIndex(profile => profile.uid === payload.profileUid);
        if (profileIndex == -1) return;

        const index = state.profiles[profileIndex].bindings.findIndex(binding => binding.uid === payload.id);
        if (index == -1) return;

        const { activeTriggers, ...oldBinding } = state.profiles[profileIndex].bindings[index];
        const binding = { ...oldBinding, ...payload.props };

        //save updated keyBoard inside of config
        window.api.send(
            IPC_CHANNELS.main.saveKeyBoardButton,
            { profileUid: payload.profileUid, binding },
        );
        commit(PlayGroundMutations.UPDATE_GRID_ITEM, { index, profile: state.profiles[profileIndex], binding: { activeTriggers, ...binding } });
    },
    [PlayGroundActionTypes.modifyGlobalIntensity]({ commit }, intensity: number) {
        console.log("intensity " + intensity);
        commit(PlayGroundMutations.UPDATE_GLOBAL_INTENSITY, intensity);

        const instructionList: {
            keyId: string,
            channels: number[],
            intensity: number
        }[] = []

        state.profiles.forEach(profile => {
            profile.bindings.forEach(item => {
                if (item.activeTriggers > 0) {
                    instructionList.push(
                        ...executeAllInputHandlers({ binding: item, value: 1, wasActive: false, globalIntensity: intensity })
                            .map(instruction => ({ keyId: item.uid, ...instruction }))
                    );
                }
            })
        });

        if (instructionList.length > 0) {
            const store = useStore();
            store.commit(TactonMutations.APPEND_DEBOUNCE_BUFFER, instructionList)
        }
    },
};

/**
 * Getters
 */
export type Getters = {
    getKeyButton(state: State): (id: string) => { binding: StateInputBinding, profile: StateProfile } | undefined,
    getProfileByDevice(state: State): (device: InputDevice) => StateProfile | undefined,
    isActiveKey(state: State): (id: string) => boolean,
    isInputAlreadyTaken(state: State): (originalId: string | undefined, profile: StateProfile, input: UserInput) => boolean,
}

export const getters: GetterTree<State, RootState> & Getters = {
    getKeyButton: (state) => (id) => {
        for (const profile of state.profiles) {
            for (const binding of profile.bindings) {
                if (binding.uid === id)
                    return { binding, profile };
            }
        }
    },
    getProfileByDevice: (state) => (device) => {
        const selection = state.selectedProfiles.find(({ device: profileDevice }) => compareDevices(profileDevice, device));
        if (!selection) return undefined;

        return state.profiles[selection.profileIndex];
    },
    isActiveKey: (state) => (id) => {
        const binding = state.profiles.flatMap(profile => profile.bindings).find(binding => binding.uid === id);
        if (!binding)
            return false;

        return binding.activeTriggers > 0;
    },
    isInputAlreadyTaken: (state) => (originalId, profile, input) => {
        const binding = profile.bindings.find(binding => compareInputs(binding.inputs[0], input));
        if (!binding) return false;

        if (originalId !== undefined) {
            //find the same button as updated, its valid to change
            return binding.uid !== originalId
        }

        return true;
    }
};
