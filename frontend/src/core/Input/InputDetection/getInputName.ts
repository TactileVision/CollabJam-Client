import { GamepadAxisInput, GamepadButtonInput, UserInput, isGamepadAxis, isGamepadButton, isKeyInput } from "@/core/Input/InputDetection/types/InputDetection";

const INPUT_NAME_MAP = {
  xbox: {
    buttons: [
      "A",
      "B",
      "X",
      "Y",
      "LB",
      "RB",
      "LT",
      "RT",
      "Select",
      "Start",
      "Left Stick",
      "Right Stick",
      "Up",
      "Down",
      "Left",
      "Right",
      "XBox"
    ],
    axes: [
      "Left Horizontally",
      "Left Vertically",
      "Right Horizontally",
      "Right Vertically"
    ]
  }
}

const getDeviceType = (gamepadName: string) => {
  if(gamepadName.match(/microsoft/i)) {
    return "xbox"
  }
  console.error(`unknown device type: ${gamepadName}`);
  return null;
}

const getButtonName = (input: GamepadButtonInput) => {
  const deviceType = getDeviceType("Microsoft");
  if(!deviceType) return "unknown";
  return INPUT_NAME_MAP[deviceType].buttons[input.index];
}

const getAxisName = (input: GamepadAxisInput) => {
  const deviceType = getDeviceType("Microsoft");
  if(!deviceType) return "unknown";
  return INPUT_NAME_MAP[deviceType].axes[input.index];
}

const getInputName = (input: UserInput): string => {
  if(isKeyInput(input))
    return input.key

  if(isGamepadButton(input))
    return getButtonName(input)

  if(isGamepadAxis(input))
    return getAxisName(input)

  return "unknown";
}

export default getInputName;