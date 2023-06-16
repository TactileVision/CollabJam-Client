import { v4 as uuidv4 } from "uuid";
import keyboardImage from "@/renderer/assets/keyboard.svg";
import mappingAImage from "@/renderer/assets/mappingA.svg";
import mappingBImage from "@/renderer/assets/mappingB.svg";
import mappingCImage from "@/renderer/assets/mappingC.svg";
import { DeviceType, InputProfile, TactileAction } from "@/types/InputBindings";
import {
  GamepadAxisInput,
  GamepadButtonInput,
  KeyInput,
  UserInputType,
} from "@/types/InputDetection";
import { StateProfile } from "./playGround";

const profiles: StateProfile[] = [
  {
    uid: uuidv4(),
    name: "Mapping A",
    imagePath: mappingAImage,
    deviceType: DeviceType.StandardGamepad,
    bindings: [
      {
        inputs: [
          { type: UserInputType.GamepadAxis, index: 0 } as GamepadAxisInput,
        ],
        activeTriggers: 0,
        uid: "UNIQUE",
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "dynamic",
        color: "#ff0000",
        actions: [
          {
            type: "trigger_actuator_with_dynamic_intensity",
            channel: 0,
          } as TactileAction,
        ],
      },
      {
        inputs: [
          {
            type: UserInputType.GamepadButton,
            index: 6,
          } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "SET_INTENSITY",
        position: { x: 4, y: 4, w: 1, h: 1 },
        name: "set",
        color: "#00ffff",
        actions: [
          {
            type: "set_intensity_action",
            name: "intensity_test",
          } as TactileAction,
        ],
      },
      {
        inputs: [
          {
            type: UserInputType.GamepadButton,
            index: 0,
          } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "USE_INTENSITY",
        position: { x: 3, y: 4, w: 1, h: 1 },
        name: "get",
        color: "#00ffff",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            name: "intensity_test",
            channel: 0,
          } as TactileAction,
        ],
      },
      {
        inputs: [
          {
            type: UserInputType.GamepadButton,
            index: 7,
          } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "LOCATION",
        position: { x: 7, y: 4, w: 1, h: 1 },
        name: "set",
        color: "#7CFC00",
        actions: [
          {
            type: "dynamic_actuator_action",
            name: "dynamic actuator",
            actuators: [
              {
                channels: [0, 4],
                minValue: 0,
                maxValue: 0.2,
              },
              {
                channels: [1, 3],
                minValue: 0.2,
                maxValue: 0.4,
              },
              {
                channels: [2],
                minValue: 0.4,
                maxValue: 0.6,
              },
              {
                channels: [3, 1],
                minValue: 0.6,
                maxValue: 0.8,
              },
              {
                channels: [4, 0],
                minValue: 0.8,
                maxValue: 1,
              },
            ],
          } as TactileAction,
        ],
      },
    ],
  },
  {
    uid: uuidv4(),
    name: "Mapping B",
    imagePath: mappingBImage,
    deviceType: DeviceType.StandardGamepad,
    bindings: [
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 0 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "UNIQUE_1",
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "dynamic",
        color: "#ff0000",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 1.0,
          } as TactileAction,
        ],
      },
    ],
  },
  {
    uid: uuidv4(),
    name: "Mapping C",
    imagePath: mappingCImage,
    deviceType: DeviceType.StandardGamepad,
    bindings: [
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 0 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "UNIQUE_2",
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "dynamic",
        color: "#ff0000",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 1.0,
          } as TactileAction,
        ],
      },
    ],
  },
  {
    uid: uuidv4(),
    name: "Keyboard",
    imagePath: keyboardImage,
    deviceType: DeviceType.Keyboard,
    bindings: [
      {
        inputs: [{ type: UserInputType.Key, key: "A" } as KeyInput],
        activeTriggers: 0,
        uid: "UNIQUE_3",
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "dynamic",
        color: "#ff0000",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 1.0,
          } as TactileAction,
        ],
      },
    ],
  },
];

export default profiles;
