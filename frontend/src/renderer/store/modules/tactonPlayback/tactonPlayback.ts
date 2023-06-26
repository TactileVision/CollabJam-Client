
import { MutationTree, GetterTree, ActionTree, ActionContext } from 'vuex'
import { RootState } from '../../store';
import { InstructionServerPayload, TactonInstruction, Tacton, isInstructionSetParameter, isInstructionWait, TactonMetadata } from '@sharedTypes/tactonTypes';
import { TactonMutations } from '../tactonSettings/tactonSettings';

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



export const createTacton = () => {
  const t: Tacton = {
    uuid: Date.now().toString(36) + Math.random().toString(36).substring(2),
    metadata: {
      recordDate: new Date(),
      name: 'unnamed_tacton',
      favorite: false
    },
    instructions: [] as TactonInstruction[],
  }
  return t
}

/**state**/
export type State = {
  tactons: Tacton[]
  currentTacton: Tacton | null
  playbackTime: number
};

export const state: State = {
  tactons: [],
  currentTacton: null,
  playbackTime: 0
};

/**
 * mutations
 * 
 */
export enum TactonPlaybackMutations {
  ADD_TACTON = "ADD_TACTON",
  DESELECT_TACTON = "DESELECT_TACTON",
  SELECT_TACTON = "SELECT_TACTON",
  UPDATE_TACTON_METADATA = "UPDATE_TACTON_METADATA",
  DELETE_TACTON = "DELETE_TACTON",
  UPDATE_TIME = "UPDATE_TIME",
  SET_TACTON_LIST = "SET_TACTON_LIST",

}

export type Mutations<S = State> = {

  [TactonPlaybackMutations.ADD_TACTON](state: S, tacton: Tacton): void
  [TactonPlaybackMutations.DESELECT_TACTON](state: S): void
  [TactonPlaybackMutations.SELECT_TACTON](state: S, uuid: string): void
  [TactonPlaybackMutations.UPDATE_TIME](state: S, newTime: number): void
  [TactonPlaybackMutations.SET_TACTON_LIST](state: S, tactons: Tacton[]): void
  [TactonPlaybackMutations.DELETE_TACTON](state: S, uuid: string): void
  [TactonPlaybackMutations.UPDATE_TACTON_METADATA](state: S, props: { uuid: string, metadata: TactonMetadata }): void
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
  },
  [TactonPlaybackMutations.UPDATE_TIME](state, newTime) {
    state.playbackTime = newTime
  },
  [TactonPlaybackMutations.SET_TACTON_LIST](state, tactons) {
    state.tactons = tactons
  },
  [TactonPlaybackMutations.UPDATE_TACTON_METADATA](state, props) {
    const i = state.tactons.findIndex(e => e.uuid == props.uuid)
    if (i == undefined) return
    state.tactons[i].metadata = { ...props.metadata }
  },
  [TactonPlaybackMutations.DELETE_TACTON](state, uuid) {
    const i = state.tactons.findIndex(e => e.uuid == uuid)
    if (i == undefined) return
    state.tactons.splice(i, 1)
  }
};

/**
 * actions
 * 
 */
export enum TactonPlaybackActionTypes {

  selectTacton = 'selectTacton',
  deselectTacton = 'deselectTacton',
  addTacton = 'addTacton',
  updateTime = 'updateTime',
  setTactonList = 'setTactonList',
  updateMetadata = 'updateMetadata',
  deleteTacton = 'deleteTacton'

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
  [TactonPlaybackActionTypes.deselectTacton](
    { commit }: AugmentedActionContext,
  ): void;
  [TactonPlaybackActionTypes.addTacton](
    { commit }: AugmentedActionContext,
    payload: Tacton
  ): void;
  [TactonPlaybackActionTypes.updateTime](
    { commit }: AugmentedActionContext,
    payload: number
  ): void;
  [TactonPlaybackActionTypes.setTactonList](
    { commit }: AugmentedActionContext,
    payload: Tacton[]
  ): void;
  [TactonPlaybackActionTypes.updateMetadata](
    { commit }: AugmentedActionContext,
    payload: { tactonUuid: string, metadata: TactonMetadata }
  ): void;
  [TactonPlaybackActionTypes.deleteTacton](
    { commit }: AugmentedActionContext,
    payload: string
  ): void;

}

export const actions: ActionTree<State, RootState> & Actions = {
  [TactonPlaybackActionTypes.selectTacton]({ commit }, uuid: string) {
    const x = state.tactons.findIndex(t => t.uuid === uuid)
    console.log(x)
    if (state.tactons.findIndex(t => t.uuid === uuid) != -1) {
      commit(TactonPlaybackMutations.SELECT_TACTON, uuid);
    } else {
      console.log("[TactonPlayback] Can't select tacton, unknown uuid")
    }
  },
  [TactonPlaybackActionTypes.deselectTacton]({ commit }) {
    if (state.currentTacton != null) {
      commit(TactonPlaybackMutations.DESELECT_TACTON, undefined)
    }
  },

  [TactonPlaybackActionTypes.addTacton]({ commit }, tacton: Tacton) {
    if (state.tactons.findIndex(t => t.uuid === tacton.uuid) == -1) {
      commit(TactonPlaybackMutations.ADD_TACTON, tacton);
      console.log("[TactonPlayback] Added Tacton")
    } else {
      console.log("[TactonPlayback] Can't add tacton, uuid already stored")
    }
  },

  [TactonPlaybackActionTypes.updateTime]({ commit }, newTime: number) {
    commit(TactonPlaybackMutations.UPDATE_TIME, newTime)
  },
  [TactonPlaybackActionTypes.setTactonList]({ commit }, tactons: Tacton[]) {
    commit(TactonPlaybackMutations.SET_TACTON_LIST, tactons)
  },
  [TactonPlaybackActionTypes.updateMetadata]({ commit }, props: { tactonUuid: string, metadata: TactonMetadata }) {
    commit(TactonPlaybackMutations.UPDATE_TACTON_METADATA, { uuid: props.tactonUuid, metadata: props.metadata })

  },
  [TactonPlaybackActionTypes.deleteTacton]({ commit }, tactonUuid: string) {
    commit(TactonPlaybackMutations.DELETE_TACTON, tactonUuid)
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
