import {
  InputDevice,
  isGamepadDevice,
  isKeyboardDevice,
} from "@/main/Input/InputDetection/InputBindings";

const getDeviceName = (device: InputDevice): string => {
  if (isKeyboardDevice(device)) {
    return "Keyboard";
  } else if (isGamepadDevice(device)) {
    return device.name;
  }
  console.warn(`Unknown device type: ${device.type}`);
  return "";
};

export default getDeviceName;
