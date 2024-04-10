import { TactileAction } from "@/core/Input/InputDetection/types/InputBindings";
import { InputHandler } from "../InputHandlerManager";
import { lockIntensity, unlockIntensity } from "../IntensityStore";

interface LockIntensityAction extends TactileAction {
  type: "lock_intensity_action";
  name: string;
}

const isLockIntensityAction = (
  action: TactileAction,
): action is LockIntensityAction => {
  return action.type === "lock_intensity_action";
};

const LockIntensityHandler = (): InputHandler => {
  const handler: InputHandler = {
    onInput: ({ binding, wasActive }) => {
      const actions = binding.actions.filter(isLockIntensityAction);
      if (binding.activeTriggers > 0) {
        if (!wasActive) {
          actions.forEach((action) => lockIntensity(action.name));
        }
      } else {
        actions.forEach((action) => unlockIntensity(action.name));
      }

      return [];
    },
  };

  return Object.freeze(handler);
};

export default LockIntensityHandler;
