import { createGamepadAdapter } from "./InputAdapter/GamepadAdapter";
import { InputDetection, InputDetectionConfig } from "./types";

export const createInputDetection = (config: Partial<InputDetectionConfig> & Pick<InputDetectionConfig, 'onInput'>): InputDetection => {
  const configWithDefaults: InputDetectionConfig = { ...defaultConfig(), ...config };

  const { buttonThreshold, axesThreshold, throttleTimeout, onInput } = configWithDefaults
  const adapters = configWithDefaults.adapters.map(adapterFn => adapterFn({ buttonThreshold, axesThreshold, throttleTimeout, onInput }));

  return Object.freeze({
    config: configWithDefaults,
    start: () => {
      adapters.forEach(adapter => adapter.startDetection());
    },
    stop: () => {
      adapters.forEach(adapter => adapter.stopDetection());
    }
  })
}

const defaultConfig = (): Omit<InputDetectionConfig, "onInput"> =>  Object.freeze({
  adapters: [createGamepadAdapter],
  axesThreshold: 0.2,
  buttonThreshold: 0.2,
  throttleTimeout: 50 
})
