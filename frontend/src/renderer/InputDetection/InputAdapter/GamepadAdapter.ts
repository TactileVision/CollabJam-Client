import {
  GamepadAxisInput,
  GamepadButtonInput,
  UserInputType,
} from "@/types/InputDetection";
import { DeviceType, GamepadDevice, InputDevice } from "@/types/InputBindings";
import { InputAdapterDetection, InputAdapterDetectionConfig } from ".";

const createDetection = (
  config: InputAdapterDetectionConfig
): InputAdapterDetection => {
  let isDetecting = false;

  const { axesThreshold, buttonThreshold, throttleTimeout, onInput } = config;
  const activeButtons: Set<number>[] = [];
  const buttonTimeouts: Set<number>[] = [];
  const activeAxes: Set<number>[] = [];
  const axesTimeouts: Set<number>[] = [];

  const scanGamepads = () => {
    for (const [gamepadIndex, gamepad] of [
      ...navigator.getGamepads(),
    ].entries()) {
      if (!gamepad) continue;
      if (gamepad.mapping != "standard") continue;

      const device: GamepadDevice = gamepadToInputDevice(gamepad, gamepadIndex);

      activeButtons[gamepadIndex] ||= new Set();
      activeAxes[gamepadIndex] ||= new Set();
      buttonTimeouts[gamepadIndex] ||= new Set();
      axesTimeouts[gamepadIndex] ||= new Set();

      gamepad.buttons.forEach((button, index) => {
        const input: GamepadButtonInput = {
          type: UserInputType.GamepadButton,
          index,
        };

        const wasActive = activeButtons[gamepadIndex].has(index);
        if (button.pressed && button.value > buttonThreshold) {
          if (!buttonTimeouts[gamepadIndex].has(index)) {
            activeButtons[gamepadIndex].add(index);
            const transformedValue =
              (button.value - buttonThreshold) / (1 - buttonThreshold);
            onInput({ device, input, wasActive, value: transformedValue });
            buttonTimeouts[gamepadIndex].add(index);

            setTimeout(() => {
              buttonTimeouts[gamepadIndex].delete(index);
            }, throttleTimeout);
          }
        } else if (wasActive) {
          activeButtons[gamepadIndex].delete(index);
          onInput({ device, input, wasActive, value: 0 });
        }
      });

      gamepad.axes.forEach((axis, index) => {
        const input: GamepadAxisInput = {
          type: UserInputType.GamepadAxis,
          index,
        };

        const wasActive = activeAxes[gamepadIndex].has(index);
        if (Math.abs(axis) > axesThreshold) {
          if (!axesTimeouts[gamepadIndex].has(index)) {
            activeAxes[gamepadIndex].add(index);
            const transformedValue =
              ((Math.abs(axis) - axesThreshold) / (1 - axesThreshold)) *
              Math.sign(axis);
            onInput({ device, input, wasActive, value: transformedValue });
            axesTimeouts[gamepadIndex].add(index);

            setTimeout(() => {
              axesTimeouts[gamepadIndex].delete(index);
            }, throttleTimeout);
          }
        } else if (wasActive) {
          activeAxes[gamepadIndex].delete(index);
          onInput({ device, input, wasActive, value: 0 });
        }
      });
    }
  };

  return Object.freeze({
    startDetection: () => {
      if (isDetecting) return;

      isDetecting = true;

      const callback = () => {
        scanGamepads();
        if (isDetecting) requestAnimationFrame(callback);
      };

      requestAnimationFrame(callback);
    },
    stopDetection: () => {
      isDetecting = false;
    },
  });
};

const getDevices = (): InputDevice[] => {
  const devices: InputDevice[] = [];

  for (const [index, gamepad] of [...navigator.getGamepads()].entries()) {
    if (!gamepad) continue;
    if (gamepad.mapping != "standard") continue;

    devices.push(gamepadToInputDevice(gamepad, index));
  }

  return devices;
};

const gamepadToInputDevice = (
  gamepad: Gamepad,
  index: number
): GamepadDevice => {
  return Object.freeze({
    type: DeviceType.StandardGamepad,
    name: gamepad.id,
    index,
  });
};

export default Object.freeze({ createDetection, getDevices });
