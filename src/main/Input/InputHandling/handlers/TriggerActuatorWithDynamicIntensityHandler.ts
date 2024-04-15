import { TactileAction } from "@sharedTypes/InputDetection/InputBindings";
import { InputHandler } from "../InputHandlerManager";

interface TriggerActuatorWithDynamicIntensityAction extends TactileAction {
  type: "trigger_actuator_with_dynamic_intensity";
  channel: number;
}

const isDynamicTriggerAction = (
  action: TactileAction,
): action is TriggerActuatorWithDynamicIntensityAction => {
  return action.type === "trigger_actuator_with_dynamic_intensity";
};

const TriggerActuatorWithDynamicIntensityHandler = (): InputHandler => {
  let lastIntensity = 0;
  const sendThreshold = 1.0 / 255;

  const handler: InputHandler = {
    onInput({ binding, value, globalIntensity }) {
      const actions = binding.actions.filter(isDynamicTriggerAction);
      const intensity =
        binding.activeTriggers > 0 ? Math.abs(value) * globalIntensity : 0;
      const channels = actions.map((action) => action.channel);
      if (
        channels.length > 0 &&
        (intensity > lastIntensity + sendThreshold ||
          intensity < lastIntensity - sendThreshold)
      ) {
        lastIntensity = intensity;
        return [{ channels, intensity }];
      } else {
        return [];
      }
    },
  };
  return Object.freeze(handler);
};

export default TriggerActuatorWithDynamicIntensityHandler;
