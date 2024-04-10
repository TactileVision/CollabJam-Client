import { UserInput } from "./InputDetection";

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TactileAction {
  type: string;
}

export interface IntensityAction extends TactileAction {
  intensity: number;
}

export interface ActuatorAction extends TactileAction {
  channel: number;
}

export const isActuatorAction = (
  action: TactileAction,
): action is ActuatorAction => {
  return (action as ActuatorAction).channel !== undefined;
};

export const isIntensityAction = (
  action: TactileAction,
): action is IntensityAction => {
  return (action as IntensityAction).intensity !== undefined;
};

export interface InputDevice {
  type: DeviceType;
}

export interface GamepadDevice extends InputDevice {
  type: DeviceType.StandardGamepad;
  name: string;
  index: number;
}

export interface KeyboardDevice extends InputDevice {
  type: DeviceType.Keyboard;
}

export const isKeyboardDevice = (
  device: InputDevice,
): device is KeyboardDevice => {
  return device.type === DeviceType.Keyboard;
};

export const isGamepadDevice = (
  device: InputDevice,
): device is GamepadDevice => {
  return device.type === DeviceType.StandardGamepad;
};

export const compareDevices = (a: InputDevice, b: InputDevice) => {
  if (isGamepadDevice(a) && isGamepadDevice(b)) return a.name === b.name;
  return a.type === b.type;
};

export enum DeviceType {
  Keyboard = "keyboard",
  StandardGamepad = "standard_gamepad",
}

export interface InputProfile {
  uid: string;
  name: string;
  imagePath: string;
  deviceType: DeviceType;
  bindings: InputBinding[];
}

export interface InputBinding {
  uid: string;
  name?: string;
  color: string;
  position: GridPosition;
  inputs: UserInput[];
  actions: TactileAction[];
}
