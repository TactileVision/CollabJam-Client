import { StateInputBinding } from "../store/modules/playGround/playGround";

interface Instruction {
  channels: number[];
  intensity: number;
}

interface HandlerEvent {
  binding: StateInputBinding;
  value: number;
  wasActive: boolean;
  globalIntensity: number;
}

interface InputHandler {
  onInput: (e: HandlerEvent) => Instruction[]
}

const handlers: InputHandler[] = [];

const registerInputHandler = (handler: InputHandler) => {
  handlers.push(handler);
}

const executeAllInputHandlers = (e: HandlerEvent): Instruction[] => {
  return handlers.flatMap(handler => handler.onInput(e))
}

export { InputHandler, Instruction, registerInputHandler, executeAllInputHandlers };