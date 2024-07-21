import { InputAdapterDetection, InputAdapterDetectionConfig } from ".";
import { DeviceType, InputDevice, KeyboardDevice } from "../InputBindings";
import { KeyInput, UserInputType } from "../InputDetection";

const createDetection = (
  config: InputAdapterDetectionConfig,
): InputAdapterDetection => {
  const { onInput } = config;
  const device: KeyboardDevice = {
    type: DeviceType.Keyboard,
  };

  const activeKeys = new Set<string>();

  const keyDownHandler = (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.getModifierState("Meta")) return;
    if (document.activeElement?.tagName === "INPUT") return;

    const input: KeyInput = {
      type: UserInputType.Key,
      key: e.key.toUpperCase(),
    };

    const wasActive = activeKeys.has(e.key);
    activeKeys.add(e.key);

    onInput({
      device,
      input,
      value: 1,
      wasActive,
    });
  };

  const keyUpHandler = (e: KeyboardEvent) => {
    if (activeKeys.has(e.key)) {
      const input: KeyInput = {
        type: UserInputType.Key,
        key: e.key.toUpperCase(),
      };

      activeKeys.delete(e.key);

      onInput({
        device,
        input,
        value: 0,
        wasActive: true,
      });
    }
  };

  return Object.freeze({
    startDetection: () => {
      document.addEventListener("keydown", keyDownHandler);
      document.addEventListener("keyup", keyUpHandler);
    },
    stopDetection: () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    },
  });
};

const getDevices = (): InputDevice[] => {
  return [{ type: DeviceType.Keyboard }];
};

export default Object.freeze({ createDetection, getDevices });
