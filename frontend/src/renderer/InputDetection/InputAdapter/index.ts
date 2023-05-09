import { InputEvent } from "../types";

export interface InputAdapterConfig {
  axesThreshold: number;
  buttonThreshold: number;
  onInput: (event: InputEvent) => void;
}

export interface InputAdapter {
  startDetection: () => void;
  stopDetection: () => void;
}
