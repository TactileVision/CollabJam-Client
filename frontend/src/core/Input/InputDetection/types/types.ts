import { UserInput } from "@/core/Input/InputDetection/types/InputDetection";
import { InputDevice } from "@/core/Input/InputDetection/types/InputBindings";
import { InputAdapter } from "../InputAdapter/InputAdapterRegistry";

export interface InputEvent {
  device: InputDevice;
  input: UserInput;
  value: number;
  wasActive: boolean;
}

export interface InputDetectionConfig {
  adapters: readonly InputAdapter[];
  axesThreshold: number;
  buttonThreshold: number;
  throttleTimeout: number;
  onInput: (event: InputEvent) => void;
}

export interface InputDetection {
  config: InputDetectionConfig;
  start: () => void;
  stop: () => void;
}
