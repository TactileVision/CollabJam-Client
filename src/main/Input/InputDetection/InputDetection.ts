export enum UserInputType {
  Key = "key",
  GamepadButton = "gamepad_button",
  GamepadAxis = "gamepad_axis",
}

export interface UserInput {
  type: UserInputType;
}

export interface KeyInput extends UserInput {
  type: UserInputType.Key;
  key: string;
}

export interface GamepadButtonInput extends UserInput {
  type: UserInputType.GamepadButton;
  index: number;
}

export interface GamepadAxisInput extends UserInput {
  type: UserInputType.GamepadAxis;
  index: number;
}

export const isKeyInput = (input: UserInput): input is KeyInput => {
  return input.type === UserInputType.Key;
};

export const isGamepadButton = (
  input: UserInput,
): input is GamepadButtonInput => {
  return input.type === UserInputType.GamepadButton;
};

export const isGamepadAxis = (input: UserInput): input is GamepadAxisInput => {
  return input.type === UserInputType.GamepadAxis;
};

export const compareInputs = (a: UserInput, b: UserInput) => {
  if (isKeyInput(a) && isKeyInput(b)) return a.key === b.key;
  if (isGamepadButton(a) && isGamepadButton(b)) return a.index === b.index;
  if (isGamepadAxis(a) && isGamepadAxis(b)) return a.index === b.index;
  return false;
};
