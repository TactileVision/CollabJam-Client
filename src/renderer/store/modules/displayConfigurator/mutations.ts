import * as THREE from "three";
import { MutationTree } from "vuex";
import { State } from "@/renderer/store/modules/displayConfigurator/state";
import type { Marker } from "@/displayConfigurator/types/marker";

export enum DisplayConfigMutations {
  SET_SELECTED_MODEL = "setSelectedModel",
  SET_SELECTED_POSE = "setSelectedPose",
  SET_MODEL_PATH = "setModelPath",
  SET_INITIAL_CAMERA = "setInitialCamera",
  SET_MARKER_ADD_MODE = "setMarkerAddMode",
  SET_MARKER_MOVE_MODE = "setMarkerMoveMode",
  ADD_MARKER = "addMarker",
  UPDATE_MARKER = "updateMarker",
  CLEAR_MARKERS = "clearMarkers",
}

export type Mutations<S = State> = {
  [DisplayConfigMutations.SET_SELECTED_MODEL](state: S, model: string): void;
  [DisplayConfigMutations.SET_SELECTED_POSE](state: S, pose: string): void;
  [DisplayConfigMutations.SET_MODEL_PATH](state: S, path: string): void;
  [DisplayConfigMutations.SET_INITIAL_CAMERA](
    state: S,
    payload: {
      position: THREE.Vector3 | null;
      quaternion: THREE.Quaternion | null;
    },
  ): void;
  [DisplayConfigMutations.SET_MARKER_ADD_MODE](
    state: S,
    enabled: boolean,
  ): void;
  [DisplayConfigMutations.SET_MARKER_MOVE_MODE](
    state: S,
    enabled: boolean,
  ): void;
  [DisplayConfigMutations.ADD_MARKER](state: S, marker: Marker): void;
  [DisplayConfigMutations.UPDATE_MARKER](
    state: S,
    payload: {
      channel: number;
      faceId: number;
      barycentricCoords: { u: number; v: number; w: number };
    },
  ): void;
  [DisplayConfigMutations.CLEAR_MARKERS](state: S): void;
};

export const mutations: MutationTree<State> & Mutations = {
  [DisplayConfigMutations.SET_SELECTED_MODEL](
    state: State,
    model: string,
  ): void {
    state.selectedModel = model;
  },
  [DisplayConfigMutations.SET_SELECTED_POSE](state: State, pose: string): void {
    state.selectedPose = pose;
  },
  [DisplayConfigMutations.SET_MODEL_PATH](state: State, path: string): void {
    state.modelPath = path;
  },
  [DisplayConfigMutations.SET_INITIAL_CAMERA](
    state: State,
    payload: {
      position: THREE.Vector3 | null;
      quaternion: THREE.Quaternion | null;
    },
  ): void {
    state.initialCameraPosition = payload.position;
    state.initialCameraQuaternion = payload.quaternion;
  },
  [DisplayConfigMutations.SET_MARKER_ADD_MODE](
    state: State,
    enabled: boolean,
  ): void {
    state.markerAddModeEnabled = enabled;
  },
  [DisplayConfigMutations.SET_MARKER_MOVE_MODE](
    state: State,
    enabled: boolean,
  ): void {
    state.markerMoveModeEnabled = enabled;
  },
  [DisplayConfigMutations.ADD_MARKER](state: State, marker: Marker): void {
    state.markers.push(marker);
  },
  [DisplayConfigMutations.UPDATE_MARKER](
    state: State,
    payload: {
      channel: number;
      faceId: number;
      barycentricCoords: { u: number; v: number; w: number };
    },
  ): void {
    const marker: Marker = state.markers[payload.channel];
    if (marker) {
      marker.faceId = payload.faceId;
      marker.barycentricCoords = payload.barycentricCoords;
    }
  },
  [DisplayConfigMutations.CLEAR_MARKERS](state: State): void {
    state.markers = [];
  },
};
