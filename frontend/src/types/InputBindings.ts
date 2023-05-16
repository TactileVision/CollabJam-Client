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

export interface TriggerActuatorAction {
  type: "trigger_actuator";
  channel: number;
  intensity: number;
}

export const isTriggerActuatorAction = (action: TactileAction): action is TriggerActuatorAction => {
  return action.type === "trigger_actuator";
}

export interface InputDevice {
  type: string;
}

export interface GamepadDevice extends InputDevice {
  type: "gamepad";
  name: string;
  index: number;
}

export interface KeyboardDevice extends InputDevice {
  type: "keyboard";
}

export const isGamepadDevice = (device: InputDevice): device is GamepadDevice => {
  return device.type == "gamepad";
}

export const compareDevices = (a: InputDevice, b: InputDevice) => {
  if(isGamepadDevice(a) && isGamepadDevice(b)) return a.name === b.name;
  return a.type === b.type;
}

export interface InputDeviceBindings {
  device: InputDevice;
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