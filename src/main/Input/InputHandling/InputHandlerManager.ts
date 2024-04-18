import { StateInputBinding } from "@/renderer/store/modules/collaboration/playGround/playGround";

interface Instruction {
  // keyId: string;
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
  onInput: (e: HandlerEvent) => Instruction[];
}

const handlers: InputHandler[] = [];

const registerInputHandler = (handler: InputHandler) => {
  handlers.push(handler);
};

const executeAllInputHandlers = (e: HandlerEvent): Instruction[] => {
  return handlers.flatMap((handler) => handler.onInput(e));
};

export {
  InputHandler,
  Instruction,
  registerInputHandler,
  executeAllInputHandlers,
};
