
import { MutationTree, GetterTree, ActionTree, ActionContext } from 'vuex'
import { RootState, useStore } from '../../store';
import { User } from '../roomSettings/roomSettings';
import { stat } from 'original-fs';
/**
 * Types
 * 
 */
export interface InstructionWait {
  wait: {
    miliseconds: number
  }
}

export interface InstructionSetParameter {
  setParameter: {
    channelId: number;
    intensity: number;
  }
}

export type TactonInstruction = InstructionSetParameter | InstructionWait;

export interface InstructionServerPayload {
  Instruction: TactonInstruction
}



export const isInstructionWait = (instruction: TactonInstruction) => {
  return 'wait' in instruction
}

export const isInstructionSetParameter = (instruction: TactonInstruction) => {
  return 'setParameter' in instruction
}


export const createTactonInstructionsFromPayload = (payload: InstructionServerPayload[]): TactonInstruction[] => {
  const t: TactonInstruction[] = []
  payload.forEach(inst => {
    if (isInstructionWait(inst.Instruction) || isInstructionSetParameter(inst.Instruction)) {
      t.push(inst.Instruction)
    } else {
      console.log("Unknown payload")
    }
  })

  return t
}


export type Tacton = {
  uuid: string
  recordDate: Date
  instructions: TactonInstruction[]
}

export const createTacton = () => {
  const t: Tacton = {
    uuid: Date.now().toString(36) + Math.random().toString(36).substring(2),
    recordDate: new Date(),
    instructions: [] as TactonInstruction[]
  }
  return t
}
/**
 * state
 * 
 */

export type State = {
  tactons: Tacton[]
  currentTacton: Tacton | null
};

export const state: State = {
  tactons: [],
  currentTacton: null
};

/**
 * mutations
 * 
 */
export enum TactonPlaybackMutations {
  ADD_TACTON = "ADD_TACTON",
  DESELECT_TACTON = "DELETE_TACTON",
  SELECT_TACTON = "SELECT_TACTON"
}

export type Mutations<S = State> = {
  [TactonPlaybackMutations.ADD_TACTON](state: S, tacton: Tacton): void
  [TactonPlaybackMutations.DESELECT_TACTON](state: S): void
  [TactonPlaybackMutations.SELECT_TACTON](state: S, uuid: string): void
}

export const mutations: MutationTree<State> & Mutations = {
  [TactonPlaybackMutations.ADD_TACTON](state, tacton) {
    state.tactons.push(tacton)
  },

  [TactonPlaybackMutations.DESELECT_TACTON](state) {
    state.currentTacton = null
  },

  [TactonPlaybackMutations.SELECT_TACTON](state, uuid) {
    const t = state.tactons.find(t => t.uuid === uuid)
    t == undefined ? state.currentTacton = null : state.currentTacton = t
  }
};

/**
 * actions
 * 
 */
export enum TactonPlaybackActionTypes {

  selectTacton = 'selectTacton',
  addTacton = 'addTacton'

}

type AugmentedActionContext = {
  commit<K extends keyof Mutations>(
    key: K,
    payload: Parameters<Mutations[K]>[1],
  ): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, RootState>, 'commit'>

export interface Actions {
  [TactonPlaybackActionTypes.selectTacton](
    { commit }: AugmentedActionContext,
    payload: string
  ): void;
  [TactonPlaybackActionTypes.addTacton](
    { commit }: AugmentedActionContext,
    payload: Tacton
  ): void;
}

export const actions: ActionTree<State, RootState> & Actions = {
  [TactonPlaybackActionTypes.selectTacton]({ commit }, uuid: string) {
    const x = state.tactons.findIndex(t => t.uuid === uuid)
    console.log(x)
    if (state.tactons.findIndex(t => t.uuid === uuid) != -1) {
      commit(TactonPlaybackMutations.SELECT_TACTON, uuid);
      console.log("[TactonPlayback] Selected tacton")
    } else {
      console.log("[TactonPlayback] Can't select tacton, unknown uuid")
    }
  },

  [TactonPlaybackActionTypes.addTacton]({ commit }, tacton: Tacton) {
    if (state.tactons.findIndex(t => t.uuid === tacton.uuid) == -1) {
      commit(TactonPlaybackMutations.ADD_TACTON, tacton);
      console.log("[TactonPlayback] Added Tacton")
    } else {
      console.log("[TactonPlayback] Can't add tacton, uuid already stored")
    }
  }
};

/**
 * Getters
 */
export type Getters = {
  getSelectedTacton(state: State): Tacton | null
}

export const getters: GetterTree<State, RootState> & Getters = {
  getSelectedTacton(state) {
    return state.currentTacton
  },
};
