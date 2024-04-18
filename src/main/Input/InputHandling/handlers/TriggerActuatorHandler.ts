import { TactileAction } from "@/main/Input/InputDetection/InputBindings";
import { InputHandler, Instruction } from "../InputHandlerManager";

interface TriggerActuatorAction extends TactileAction {
  type: "trigger_actuator";
  channel: number;
  intensity: number;
}

const isTriggerActuatorAction = (
  action: TactileAction,
): action is TriggerActuatorAction => {
  return action.type === "trigger_actuator";
};

const TriggerActuatorHandler = (): InputHandler => {
  return {
    onInput({ binding, wasActive, globalIntensity }) {
      const instructions: Instruction[] = [];

      const actions = binding.actions.filter(isTriggerActuatorAction);
      if (binding.activeTriggers > 0) {
        if (!wasActive) {
          actions.forEach((action) => {
            const intensity = action.intensity * globalIntensity;
            instructions.push({
              intensity,
              channels: [action.channel],
            });
          });
        }
      } else {
        if (actions.length > 0) {
          instructions.push({
            channels: actions.map((action) => action.channel),
            intensity: 0,
          });
        }
      }
      return instructions;
    },
  };
};

export default TriggerActuatorHandler;
