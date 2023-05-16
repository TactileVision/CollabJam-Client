import { GamepadAxisInput, GamepadButtonInput, GamepadDevice, InputDeviceType, UserInputType } from "../types";
import { InputAdapter, InputAdapterConfig } from "../InputAdapter";

export const createGamepadAdapter = (config: InputAdapterConfig): InputAdapter => {
  let isDetecting = false;

  const { axesThreshold, buttonThreshold, onInput } = config;

  const scanGamepads = () => {
    for(const [index, gamepad] of [...navigator.getGamepads()].entries()) {
      if(!gamepad) continue;

      const device: GamepadDevice = { type: InputDeviceType.Gamepad, index, name: gamepad.id  }

      gamepad.
        buttons.
        map((button, index) => ({ button, index })).
        filter(({ button }) => button.pressed && button.value > buttonThreshold).
        forEach(({ button, index }) => {
          const input: GamepadButtonInput = {
            type: UserInputType.GamepadButton,
            index,
            getName: buttonNameResolverFor(device.name, index)
          }
          onInput({ device, input, value: button.value })
        })

      gamepad.
        axes.
        map((axis, index) => ({ axis, index })).
        filter(({ axis }) => Math.abs(axis) > axesThreshold).
        forEach(({ axis, index }) => {
          const input: GamepadAxisInput = {
            type: UserInputType.GamepadAxis,
            index,
            getName: axisNameResolverFor(device.name, index)
          }

          onInput({ device, input, value: axis })
        })
    }
  }

  return Object.freeze({
    startDetection: () => {
      if(isDetecting) return;

      isDetecting = true;

      const callback = () => {
        scanGamepads()
        if(isDetecting) requestAnimationFrame(callback)
      }

      requestAnimationFrame(callback)
    },
    stopDetection: () => {
      isDetecting = false;
    }
  })
}

interface InputMap {
  buttons: string[];
  axes: string[];
}

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

const buttonNameResolverFor = (gamepadName: string, buttonIndex: number): () => string => {
  let inputMap: InputMap | null = null
  return () => {
    if(!inputMap) {
      const deviceType = getDeviceType(gamepadName);
      if(!deviceType) return "unknown";
      inputMap = INPUT_NAME_MAP[deviceType];
    }
    return inputMap.buttons[buttonIndex] || "unknown";
  };
}
const axisNameResolverFor = (gamepadName: string, buttonIndex: number): () => string => {
  let inputMap: InputMap | null = null
  return () => {
    if(!inputMap) {
      const deviceType = getDeviceType(gamepadName);
      if(!deviceType) return "unknown";
      inputMap = INPUT_NAME_MAP[deviceType];
    }
    return inputMap.axes[buttonIndex] || "unknown";
  };
}

const getDeviceType = (gamepadName: string) => {
  if(gamepadName.match(/microsoft/i)) {
    return "xbox"
  }
  console.error(`unknown device type: ${gamepadName}`);
  return null;
}