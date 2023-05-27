import { TactileAction } from "@/types/InputBindings";
import { InputHandler } from "../InputHandlerManager";

interface TriggerActuatorWithDynamicIntensityAction extends TactileAction {
  type: "trigger_actuator_with_dynamic_intensity";
  channel: number;
}

const isDynamicTriggerAction = (action: TactileAction): action is TriggerActuatorWithDynamicIntensityAction => {
  return action.type === "trigger_actuator_with_dynamic_intensity";
}

const TriggerActuatorWithDynamicIntensityHandler = (): InputHandler => {
  return {
    onInput({ binding, value, globalIntensity }) {
      const actions = binding.actions.filter(isDynamicTriggerAction);
      const intensity = binding.activeTriggers > 0 ? Math.abs(value) * globalIntensity : 0;
      const channels = actions.map(action => action.channel);

      return [{ channels, intensity }];
    }
  }
}

export default TriggerActuatorWithDynamicIntensityHandler;