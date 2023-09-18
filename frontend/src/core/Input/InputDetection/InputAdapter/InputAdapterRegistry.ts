import { InputDevice } from "@/core/Input/InputDetection/types/InputBindings";
import { InputAdapterDetection, InputAdapterDetectionConfig } from ".";

export interface InputAdapter {
  createDetection: (
    config: InputAdapterDetectionConfig
  ) => InputAdapterDetection;
  getDevices: () => InputDevice[];
}

const adapters: InputAdapter[] = [];

export const getInputAdapters = () => {
  return Object.freeze([...adapters]);
};

export const registerInputAdapter = (adapter: InputAdapter) => {
  adapters.push(adapter);
};
