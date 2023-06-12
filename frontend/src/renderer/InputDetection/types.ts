import { UserInput } from "@/types/InputDetection";
import { InputAdapter, InputAdapterConfig } from "./InputAdapter";
import { DeviceType, InputDevice } from "@/types/InputBindings";

export interface GamepadDevice extends InputDevice {
  type: DeviceType.StandardGamepad;
  name: string;
  index: number;
}

export interface InputEvent {
  device: InputDevice;
  input: UserInput;
  value: number;
  wasActive: boolean;
}

export interface InputDetectionConfig {
  adapters: ((config: InputAdapterConfig) => InputAdapter)[];
  axesThreshold: number;
  buttonThreshold: number;
  throttleTimeout: number;
  onInput: (event: InputEvent) => void
}

export interface InputDetection {
  config: InputDetectionConfig;
  start: () => void;
  stop: () => void;
}