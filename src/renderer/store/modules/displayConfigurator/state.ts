import * as THREE from "three";
import type { Marker } from "@/displayConfigurator/types/marker";
import { displayConfiguratorConfig } from "@/displayConfigurator/config";

export type State = {
  selectedModel: string;
  selectedPose: string;
  modelPath: string;
  initialCameraPosition: THREE.Vector3 | null;
  initialCameraQuaternion: THREE.Quaternion | null;
  markers: Marker[];
  markerAddModeEnabled: boolean;
  markerMoveModeEnabled: boolean;
};
export const state: State = {
  selectedModel: "neutral",
  selectedPose: "a_pose",
  modelPath: `${displayConfiguratorConfig.modelpath}${displayConfiguratorConfig.initModel}`,
  initialCameraPosition: null,
  initialCameraQuaternion: null,
  markers: [],
  markerAddModeEnabled: false,
  markerMoveModeEnabled: false,
};
