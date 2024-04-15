import { InputEvent } from "@sharedTypes/InputDetection/types";

export interface InputAdapterDetectionConfig {
  axesThreshold: number;
  buttonThreshold: number;
  throttleTimeout: number;
  onInput: (event: InputEvent) => void;
}

export interface InputAdapterDetection {
  startDetection: () => void;
  stopDetection: () => void;
}
