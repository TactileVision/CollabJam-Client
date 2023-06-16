import { InputDetection, InputDetectionConfig } from "./types";
import {
  InputAdapter,
  getInputAdapters,
} from "./InputAdapter/InputAdapterRegistry";
import { DeviceType, InputDevice } from "@/types/InputBindings";

const defaultConfig = (): Omit<InputDetectionConfig, "onInput"> =>
  Object.freeze({
    adapters: getInputAdapters(),
    axesThreshold: 0.2,
    buttonThreshold: 0.2,
    throttleTimeout: 100,
  });

export const createInputDetection = (
  config: Partial<InputDetectionConfig> & Pick<InputDetectionConfig, "onInput">
): InputDetection => {
  const configWithDefaults: InputDetectionConfig = {
    ...defaultConfig(),
    ...config,
  };

  const { buttonThreshold, axesThreshold, throttleTimeout, onInput } =
    configWithDefaults;
  const adapters = configWithDefaults.adapters.map((adapter) =>
    adapter.createDetection({
      buttonThreshold,
      axesThreshold,
      throttleTimeout,
      onInput,
    })
  );

  return Object.freeze({
    config: configWithDefaults,
    start: () => {
      adapters.forEach((adapter) => adapter.startDetection());
    },
    stop: () => {
      adapters.forEach((adapter) => adapter.stopDetection());
    },
  });
};

export const getAllDevices = (
  adapters: InputAdapter[] | undefined = undefined
): InputDevice[] => {
  const adaptersWithDefaults = adapters || defaultConfig().adapters;
  return adaptersWithDefaults
    .flatMap((adapter) => adapter.getDevices())
    .concat({ type: DeviceType.Keyboard });
};
