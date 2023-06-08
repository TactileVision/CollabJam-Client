
import { MutationTree, GetterTree, ActionTree, ActionContext } from 'vuex'
import { RootState, useStore } from '../../store';
import { User } from '../roomSettings/roomSettings';
import { Instruction } from '@/renderer/InputHandling/InputHandlerManager';
import { InstructionToClient } from '@/types/GeneralType';
/**
 * Types
 * 
 */
export interface DeviceChannel {
  channelId: number,
  intensity: number,
  author?: User,
}
/**
 * state
 * 
 */

export type State = {
  // deviceChannel: DeviceChannel[],
  deviceChannel: DeviceChannel[],
  insertValues: boolean,
  instructions: Instruction[]
};

export const state: State = {
  deviceChannel: [],
  insertValues: false,
  instructions: []
};
/**
 * mutations
 * 
 */
export enum TactonMutations {
  UDPATE_CHANNELS = "UDPATE_CHANNELS",
  UPDATE_SPECIFIC_CHANNEL = "UPDATE_SPECIFIC_CHANNEL",
  UPDATE_INSERT_VALUES = "UPDATE_INSERT_VALUES",
  APPEND_DEBOUNCE_BUFFER = "APPEND_DEBOUNCE_BUFFER",
  SET_DEBOUNCE_BUFFER = "SET_DEBOUNCE_BUFFER"
}

export type Mutations<S = State> = {
  [TactonMutations.UDPATE_CHANNELS](state: S, channels: DeviceChannel[]): void
  [TactonMutations.UPDATE_SPECIFIC_CHANNEL](state: S, payload: { index: number, channel: DeviceChannel }): void
  [TactonMutations.UPDATE_INSERT_VALUES](state: S, insertFirtsValue: boolean): void
  [TactonMutations.APPEND_DEBOUNCE_BUFFER](state: S, newInstructions: Instruction[]): void
  [TactonMutations.SET_DEBOUNCE_BUFFER](state: S, newDebounceBuffer: Instruction[]): void
}

export const mutations: MutationTree<State> & Mutations = {
  [TactonMutations.UDPATE_CHANNELS](state, channels) {
    state.deviceChannel = channels;
  },
  [TactonMutations.UPDATE_SPECIFIC_CHANNEL](state, payload) {
    state.deviceChannel[payload.index] = payload.channel;
  },
  [TactonMutations.UPDATE_INSERT_VALUES](state, insertFirtsValue) {
    state.insertValues = insertFirtsValue;
  },
  [TactonMutations.APPEND_DEBOUNCE_BUFFER](state, newInstructions) {
    newInstructions.forEach(n => { state.instructions.push(n) })
  },
  [TactonMutations.SET_DEBOUNCE_BUFFER](state, newDebounceBuffer) {
    state.instructions = newDebounceBuffer
  },
};

/**
 * actions
 * 
 */
export enum TactonSettingsActionTypes {
  instantiateArray = 'instantiateArray',
  modifySpecificChannel = 'modifySpecificChannel',
  addInstructionsToDebounceBuffer = 'addInstructionsToDebounceBuffer',
  clearDebounceBuffer = 'clearDebounceBuffer'
}

type AugmentedActionContext = {
  commit<K extends keyof Mutations>(
    key: K,
    payload: Parameters<Mutations[K]>[1],
  ): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, RootState>, 'commit'>

export interface Actions {
  [TactonSettingsActionTypes.instantiateArray](
    { commit }: AugmentedActionContext,
  ): void;
  [TactonSettingsActionTypes.modifySpecificChannel](
    { commit }: AugmentedActionContext,
    payload: InstructionToClient[], // Obsolete in here but left as an example
  ): void;
  [TactonSettingsActionTypes.addInstructionsToDebounceBuffer](
    { commit }: AugmentedActionContext,
    payload: Instruction[]
  ): void;
  [TactonSettingsActionTypes.clearDebounceBuffer](
    { commit }: AugmentedActionContext,
  ): void;
}

export const actions: ActionTree<State, RootState> & Actions = {
  [TactonSettingsActionTypes.instantiateArray]({ commit }) {
    const store = useStore();

    const numberOfOutputs = store.getters.getNumberOfOutputs;
    //console.log("instantiate channels: " + numberOfOutputs)
    const deviceChannelArray: DeviceChannel[] = [];
    for (let i = 0; i < numberOfOutputs; i++) {
      deviceChannelArray.push({ channelId: i, intensity: 0 })
    }
    commit(TactonMutations.UDPATE_CHANNELS, deviceChannelArray);
  },
  [TactonSettingsActionTypes.modifySpecificChannel]({ commit }, channels: InstructionToClient[]) {
    //console.log("action " + state.deviceChannel)
    // Iterate through all channels
    const uniqueChannels = [...new Set(channels.map(item => item.channelIds).flat())]; // [ 'A', 'B']
    //Get last item with containing channel;
    uniqueChannels.forEach(c => {
      const index = state.deviceChannel.findIndex(channelDevice => channelDevice.channelId == c);
      commit(TactonMutations.UPDATE_INSERT_VALUES, true);

      channels.filter(i => { return i.channelIds.includes(c) == true }).forEach(ch => {
        //TODO Only add the last of the array?
        commit(TactonMutations.UPDATE_SPECIFIC_CHANNEL, { index: index, channel: { intensity: ch.intensity, channelId: c, author: ch.author } });
      })

    })
  },
  [TactonSettingsActionTypes.addInstructionsToDebounceBuffer]({ commit }, instructions: Instruction[]) {
    commit(TactonMutations.APPEND_DEBOUNCE_BUFFER, instructions)

  },
  [TactonSettingsActionTypes.clearDebounceBuffer]({ commit }) {
    commit(TactonMutations.SET_DEBOUNCE_BUFFER, [])
  }
};

/**
 * Getters
 */
export type Getters = {
  getIntensityOfChannel(state: State): (id: number) => number,
}

export const getters: GetterTree<State, RootState> & Getters = {
  getIntensityOfChannel: (state) => (id) => {
    const index = state.deviceChannel.findIndex(
      (channel) => channel.channelId === id
    );
    if (index == -1)
      return 0;

    return state.deviceChannel[index].intensity;
  },
};
