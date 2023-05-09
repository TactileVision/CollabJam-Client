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
        filter(button => button.pressed && button.value > buttonThreshold).
        forEach((button, index) => {
          const input: GamepadButtonInput = {
            type: UserInputType.GamepadButton,
            index,
            getName: buttonNameResolverFor(device.name, index)
          }
          onInput({ device, input, value: button.value })
        })

      gamepad.
        axes.
        filter(axis => Math.abs(axis) > axesThreshold).
        forEach((axis, index) => {
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

const buttonNameResolverFor = (gamepadName: string, buttonIndex: number): () => string => {
  return () => buttonIndex.toString();
}
const axisNameResolverFor = (gamepadName: string, buttonIndex: number): () => string => {
  return () => buttonIndex.toString();
}