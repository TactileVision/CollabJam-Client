import { MutationTree, GetterTree, ActionTree, ActionContext } from "vuex";
import { RootState, useStore } from "@/renderer/store/store";
import { User } from "@sharedTypes/roomTypes";
import { Instruction } from "@/main/Input/InputHandling/InputHandlerManager";
import { InstructionToClient } from "@sharedTypes/tactonTypes";
/**
 * Types
 *
 */
export interface OutputChannelState {
  channelId: number;
  intensity: number;
  author?: User;
}
/**
 * state
 *
 */

export type State = {
  outputChannelState: OutputChannelState[];
  trackStateChanges: boolean;
  debounceInstructionsBuffer: Instruction[];
};

export const state: State = {
  outputChannelState: [],
  trackStateChanges: false,
  debounceInstructionsBuffer: [],
};
/**
 * mutations
 *
 */
export enum TactonMutations {
  UDPATE_CHANNELS = "UDPATE_CHANNELS",
  UPDATE_SPECIFIC_CHANNEL = "UPDATE_SPECIFIC_CHANNEL",
  TRACK_STATE_CHANGES = "TRACK_STATE_CHANGES",
  APPEND_DEBOUNCE_BUFFER = "APPEND_DEBOUNCE_BUFFER",
  SET_DEBOUNCE_BUFFER = "SET_DEBOUNCE_BUFFER",
}

export type Mutations<S = State> = {
  [TactonMutations.UDPATE_CHANNELS](
    state: S,
    channels: OutputChannelState[],
  ): void;
  [TactonMutations.UPDATE_SPECIFIC_CHANNEL](
    state: S,
    payload: { index: number; channel: OutputChannelState },
  ): void;
  [TactonMutations.TRACK_STATE_CHANGES](
    state: S,
    trackStateChanges: boolean,
  ): void;
  [TactonMutations.APPEND_DEBOUNCE_BUFFER](
    state: S,
    newInstructions: Instruction[],
  ): void;
  [TactonMutations.SET_DEBOUNCE_BUFFER](
    state: S,
    newDebounceBuffer: Instruction[],
  ): void;
};

export const mutations: MutationTree<State> & Mutations = {
  [TactonMutations.UDPATE_CHANNELS](state, channels) {
    state.outputChannelState = channels;
  },
  [TactonMutations.UPDATE_SPECIFIC_CHANNEL](state, payload) {
    state.outputChannelState[payload.index] = payload.channel;
  },
  [TactonMutations.TRACK_STATE_CHANGES](state, trackStateChanges) {
    state.trackStateChanges = trackStateChanges;
  },
  [TactonMutations.APPEND_DEBOUNCE_BUFFER](state, newInstructions) {
    newInstructions.forEach((n) => {
      state.debounceInstructionsBuffer.push(n);
    });
  },
  [TactonMutations.SET_DEBOUNCE_BUFFER](state, newDebounceBuffer) {
    state.debounceInstructionsBuffer = newDebounceBuffer;
  },
};

/**
 * actions
 *
 */
export enum TactonSettingsActionTypes {
  instantiateArray = "instantiateArray",
  modifySpecificChannel = "modifySpecificChannel",
  addInstructionsToDebounceBuffer = "addInstructionsToDebounceBuffer",
  clearDebounceBuffer = "clearDebounceBuffer",
}

type AugmentedActionContext = {
  commit<K extends keyof Mutations>(
    key: K,
    payload: Parameters<Mutations[K]>[1],
  ): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, RootState>, "commit">;

export interface Actions {
  [TactonSettingsActionTypes.instantiateArray]({
    commit,
  }: AugmentedActionContext): void;
  [TactonSettingsActionTypes.modifySpecificChannel](
    { commit }: AugmentedActionContext,
    payload: InstructionToClient[], // Obsolete in here but left as an example
  ): void;
  [TactonSettingsActionTypes.addInstructionsToDebounceBuffer](
    { commit }: AugmentedActionContext,
    payload: Instruction[],
  ): void;
  [TactonSettingsActionTypes.clearDebounceBuffer]({
    commit,
  }: AugmentedActionContext): void;
}

export const actions: ActionTree<State, RootState> & Actions = {
  [TactonSettingsActionTypes.instantiateArray]({ commit }) {
    const store = useStore();

    const numberOfOutputs = store.getters.getNumberOfOutputs;
    //console.log("instantiate channels: " + numberOfOutputs)
    const outputChannelStateArray: OutputChannelState[] = [];
    for (let i = 0; i < numberOfOutputs; i++) {
      outputChannelStateArray.push({ channelId: i, intensity: 0 });
    }
    commit(TactonMutations.UDPATE_CHANNELS, outputChannelStateArray);
  },
  [TactonSettingsActionTypes.modifySpecificChannel](
    { commit },
    channels: InstructionToClient[],
  ) {
    //console.log("action " + state.outputChannelState)
    // Iterate through all channels
    const uniqueChannels = [
      ...new Set(channels.map((item) => item.channelIds).flat()),
    ]; // [ 'A', 'B']
    //Get last item with containing channel;
    uniqueChannels.forEach((c) => {
      const index = state.outputChannelState.findIndex(
        (channelDevice) => channelDevice.channelId == c,
      );
      commit(TactonMutations.TRACK_STATE_CHANGES, true);

      channels
        .filter((i) => {
          return i.channelIds.includes(c) == true;
        })
        .forEach((ch) => {
          //TODO Only add the last of the array?
          commit(TactonMutations.UPDATE_SPECIFIC_CHANNEL, {
            index: index,
            channel: {
              intensity: ch.intensity,
              channelId: c,
              author: ch.author,
            },
          });
        });
    });
  },
  [TactonSettingsActionTypes.addInstructionsToDebounceBuffer](
    { commit },
    debounceInstructionsBuffer: Instruction[],
  ) {
    commit(TactonMutations.APPEND_DEBOUNCE_BUFFER, debounceInstructionsBuffer);
  },
  [TactonSettingsActionTypes.clearDebounceBuffer]({ commit }) {
    commit(TactonMutations.SET_DEBOUNCE_BUFFER, []);
  },
};

/**
 * Getters
 */
export type Getters = {
  getIntensityOfChannel(state: State): (id: number) => number;
};

export const getters: GetterTree<State, RootState> & Getters = {
  getIntensityOfChannel: (state) => (id) => {
    const index = state.outputChannelState.findIndex(
      (channel) => channel.channelId === id,
    );
    if (index == -1) return 0;

    return state.outputChannelState[index].intensity;
  },
};
