import {
  createStore,
} from 'vuex'

import {
  store as generalSettings,
  GeneralSettingsStore,
} from './modules/generalSettings'

import {
  State as GeneralSettingsState,
} from './modules/generalSettings/generalSettings'

export type RootState = {
  generalSettings: GeneralSettingsState
}

/**
 * interface State extends StateDirectInput,StateBreakPoint {}
interface Mutations extends MutationsDirectInput,MutationsBreakPoint {}
interface Actions extends ActionsDirectInput,ActionsBreakPoint {}
interface Getters extends GettersDirectInput,GettersBreakPoint {}
*/
export type Store = GeneralSettingsStore<Pick<RootState, 'generalSettings'>>

export const store = createStore({
  modules: {
    generalSettings
  },
})

declare global {
  interface Window {
    api: any;
  }
}



/**
 * use following to get the store in every file of the renderer 
 * useStore function of this file
 * const store = useStore()
 */
export function useStore(): Store {
  return store as Store;
}