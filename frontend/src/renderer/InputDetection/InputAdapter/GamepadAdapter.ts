import { GamepadDevice, InputDeviceType } from "../types";
import { InputAdapter, InputAdapterConfig } from "../InputAdapter";
import { GamepadAxisInput, GamepadButtonInput, UserInputType } from "@/types/InputDetection";

export const createGamepadAdapter = (config: InputAdapterConfig): InputAdapter => {
  let isDetecting = false;

  const { axesThreshold, buttonThreshold, onInput } = config;
  const activeButtons: Set<number>[] = []
  const activeAxes: Set<number>[] = []

  const scanGamepads = () => {
    for(const [gamepadIndex, gamepad] of [...navigator.getGamepads()].entries()) {
      if(!gamepad) continue;

      const device: GamepadDevice = { type: InputDeviceType.Gamepad, index: gamepadIndex, name: gamepad.id  }

      activeButtons[gamepadIndex] ||= new Set
      activeAxes[gamepadIndex] ||= new Set

      gamepad.
        buttons.
        forEach((button, index) => {
          const input: GamepadButtonInput = {
            type: UserInputType.GamepadButton,
            index,
          }

          const wasActive = activeButtons[gamepadIndex].has(index);
          if(button.pressed && button.value > buttonThreshold) {
            activeButtons[gamepadIndex].add(index)
            onInput({ device, input, wasActive, value: button.value })
          } else if (wasActive) {
            activeButtons[gamepadIndex].delete(index)
            onInput({ device, input, wasActive, value: 0 })
          }
        })

      gamepad.
        axes.
        forEach((axis, index) => {
          const input: GamepadAxisInput = {
            type: UserInputType.GamepadAxis,
            index,
          }

          const wasActive = activeAxes[gamepadIndex].has(index);
          if(Math.abs(axis) > axesThreshold) {
            activeAxes[gamepadIndex].add(index)
            onInput({ device, input, wasActive, value: axis })
          } else if (wasActive) {
            activeAxes[gamepadIndex].delete(index)
            onInput({ device, input, wasActive, value: 0 })
          }
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

