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

export enum UserInputType {
  Key = "key",
  GamepadButton = "gamepad_button",
  GamepadAxis = "gamepad_axis",
}

export interface UserInput {
  type: UserInputType;
}

export interface GamepadButtonInput extends UserInput {
  type: UserInputType.GamepadButton;
  index: number;
  getName: () => string;
}

export interface GamepadAxisInput extends UserInput {
  type: UserInputType.GamepadAxis;
  index: number;
  getName: () => string;
}

export const isGamepadButton = (input: UserInput): input is GamepadButtonInput => {
  return input.type === UserInputType.GamepadButton;
}

export const isGamepadAxis = (input: UserInput): input is GamepadAxisInput => {
  return input.type === UserInputType.GamepadAxis;
}

export interface InputEvent {
  device: InputDevice;
  input: UserInput;
  value: number;
}

export interface InputDetectionConfig {
  adapters: ((config: InputAdapterConfig) => InputAdapter)[];
  axesThreshold: number;
  buttonThreshold: number;
  onInput: (event: InputEvent) => void
}

export interface InputDetection {
  config: InputDetectionConfig;
  start: () => void;
  stop: () => void;
}