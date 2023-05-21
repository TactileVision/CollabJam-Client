import { UserInput } from "@/types/InputDetection";
import { InputAdapter, InputAdapterConfig } from "./InputAdapter";

export enum InputDeviceType {
  Keyboard = "keyboard",
  Gamepad = "gamepad",
}

export interface InputDevice {
  type: InputDeviceType;
}

export interface GamepadDevice extends InputDevice {
  type: InputDeviceType.Gamepad;
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