import { GamepadDevice, InputDeviceType } from "../types";
import { InputAdapter, InputAdapterConfig } from "../InputAdapter";
import { GamepadAxisInput, GamepadButtonInput, UserInputType } from "@/types/InputDetection";

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

