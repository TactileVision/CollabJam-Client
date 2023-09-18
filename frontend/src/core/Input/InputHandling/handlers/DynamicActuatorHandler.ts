import { TactileAction } from "@/core/Input/InputDetection/types/InputBindings";
import { InputHandler, Instruction } from "../InputHandlerManager";
import { resolveIntensity } from "../IntensityStore";

interface ActuatorConfig {
  channels: number[];
  intensity: number | string;
  minValue: number;
  maxValue: number;
}

interface DynamicActuatorAction extends TactileAction {
  type: "dynamic_actuator_action",
  actuators: ActuatorConfig[]
}

const isDynamicActuatorAction = (action: TactileAction): action is DynamicActuatorAction => {
  return action.type == "dynamic_actuator_action";
}

const DynamicActuatorHandler = (): InputHandler => {
  const lastIntensities = new Map<number, number>();
  const activeChannels = new Set<number>();
  const sendThreshold = 1.0 / 32;

  return {
    onInput: ({ binding, value, globalIntensity }) => {
      const instructions: Instruction[] = [];

      binding.actions.filter(isDynamicActuatorAction).forEach(action => {
        const configsWithIndex = action.actuators.map((config, index) => ({ config, index }));
        const active = configsWithIndex.filter(({ config }) => config.minValue < value && config.maxValue >= value).map(({ index }) => index);
        const inactive = configsWithIndex.filter(({ index }) => !active.includes(index)).map(({ index }) => index);

        const stillActiveChannels = new Set(active.flatMap(configIndex => action.actuators[configIndex].channels));
        if(active.length > 0) {
          active.forEach(configIndex => {
            const config = action.actuators[configIndex];
            const intensity = resolveIntensity(config.intensity) * globalIntensity;
            const lastIntensity = lastIntensities.get(configIndex) || 0

            if(intensity > lastIntensity + sendThreshold || intensity < lastIntensity - sendThreshold) {
              lastIntensities.set(configIndex, intensity);
              config.channels.forEach(channel => activeChannels.add(channel));
              instructions.push({
                channels: [...config.channels],
                intensity
              });
            }
          });
        }

        if(inactive.length > 0) {
          inactive.forEach(configIndex => {
            lastIntensities.set(configIndex, 0);
          });

          const maybeInactiveChannels = inactive.flatMap(configIndex => action.actuators[configIndex].channels);
          const inactiveChannels = new Set(maybeInactiveChannels.filter(channel => activeChannels.has(channel) && !stillActiveChannels.has(channel)));

          if(inactiveChannels.size > 0) {
            inactiveChannels.forEach(channel => activeChannels.delete(channel));
            instructions.push({ channels: [...inactiveChannels], intensity: 0 })
          }
        }
      });

      return instructions;
    }
  }
}

export default DynamicActuatorHandler;