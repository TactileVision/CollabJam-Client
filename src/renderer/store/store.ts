//file to initiate the vuex store, with all modules
import { createStore } from "vuex";
import type { ContextBridgeApi } from "@/preload/preload";

import {
  store as generalSettings,
  GeneralSettingsStore,
} from "./modules/generalSettings";

import { State as GeneralSettingsState } from "./modules/generalSettings/generalSettings";

import {
  store as roomSettings,
  RoomSettingsStore,
} from "./modules/collaboration/roomSettings";

import { State as RoomSettingsState } from "./modules/collaboration/roomSettings/roomSettings";

import {
  store as playGround,
  PlayGroundStore,
} from "./modules/collaboration/playGround";

import { State as PlayGroundState } from "./modules/collaboration/playGround/playGround";

import {
  store as tactonSettings,
  TactonSettingsStore,
} from "./modules/collaboration/tactonSettings";

import { State as TactonSettingsState } from "./modules/collaboration/tactonSettings/tactonSettings";

import {
  store as tactonPlayback,
  TactonPlaybackStore,
} from "./modules/collaboration/tactonPlayback";

import { State as TactonPlaybackState } from "./modules/collaboration/tactonPlayback/tactonPlayback";

import {
  store as deviceManager,
  DeviceManagerStore,
} from "./modules/DeviceManager";

import { State as DeviceManagerState } from "./modules/DeviceManager/DeviceManagerStore";

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
    api: ContextBridgeApi;
    // api: {
    //   send: (channel: string, payload: object) => void;
    //   receive: (channel: string, payload: object) => void;
    // };
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
