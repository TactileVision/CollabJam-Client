//file to initiate the vuex store, with all modules
import { createStore } from "vuex";

import {
  store as generalSettings,
  GeneralSettingsStore,
} from "./modules/generalSettings";

import { State as GeneralSettingsState } from "./modules/generalSettings/generalSettings";

import {
  store as roomSettings,
  RoomSettingsStore,
} from "../../feature/collabJamming/store/roomSettings";

import { State as RoomSettingsState } from "../../feature/collabJamming/store/roomSettings/roomSettings";

import {
  store as playGround,
  PlayGroundStore,
} from "../../feature/collabJamming/store/playGround";

import { State as PlayGroundState } from "../../feature/collabJamming/store/playGround/playGround";

import {
  store as tactonSettings,
  TactonSettingsStore,
} from "../../feature/collabJamming/store/tactonSettings";

import { State as TactonSettingsState } from "../../feature/collabJamming/store/tactonSettings/tactonSettings";

import {
  store as tactonPlayback,
  TactonPlaybackStore,
} from "../../feature/collabJamming/store/tactonPlayback";

import { State as TactonPlaybackState } from "../../feature/collabJamming/store/tactonPlayback/tactonPlayback";

import {
  store as deviceManager,
  DeviceManagerStore,
} from "../../core/Ble/renderer/store";

import { State as DeviceManagerState } from "../../core/Ble/renderer/store/DeviceManagerStore";

export type RootState = {
  deviceManager: DeviceManagerState;
  generalSettings: GeneralSettingsState;
  roomSettings: RoomSettingsState;
  playGround: PlayGroundState;
  tactonSettings: TactonSettingsState;
  tactonPlayback: TactonPlaybackState;
};

/**
 * interface State extends StateDirectInput,StateBreakPoint {}
interface Mutations extends MutationsDirectInput,MutationsBreakPoint {}
interface Actions extends ActionsDirectInput,ActionsBreakPoint {}
interface Getters extends GettersDirectInput,GettersBreakPoint {}
*/
export type Store = DeviceManagerStore<Pick<RootState, "deviceManager">> &
  GeneralSettingsStore<Pick<RootState, "generalSettings">> &
  RoomSettingsStore<Pick<RootState, "roomSettings">> &
  PlayGroundStore<Pick<RootState, "playGround">> &
  TactonSettingsStore<Pick<RootState, "tactonSettings">> &
  TactonPlaybackStore<Pick<RootState, "tactonPlayback">>;

export const store = createStore({
  modules: {
    deviceManager,
    generalSettings,
    roomSettings,
    playGround,
    tactonSettings,
    tactonPlayback,
  },
});

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
