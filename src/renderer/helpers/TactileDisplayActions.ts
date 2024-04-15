import { IPC_CHANNELS } from "@/preload/IpcChannels";
import { ActuatorSelection } from "@/renderer/helpers/TactileDisplayValidation";

/**
 * Vibrate the first channel of the specified display (`deviceUuid`) for `durationMs` milliseconds
 */
export async function pingDisplayViaIPC(
  deviceUuid: string,
  durationMs: number,
) {
  writeAmplitudeOnDisplay(deviceUuid, [0], 1);
  await new Promise((resolve) => setTimeout(resolve, durationMs));
  writeAmplitudeOnDisplay(deviceUuid, [0], 0);
}

/***
 * Writes the `amplitude` value to all channel numbers specified in the `channels` array on the device with the `deviceUuid` uuid
 */
export function writeAmplitudeOnDisplay(
  deviceUuid: string,
  channels: number[],
  amplitude: number,
) {
  window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, {
    deviceId: deviceUuid,
    taskList: [
      {
        channelIds: channels,
        intensity: amplitude,
      },
    ],
  });
}

/***
 * Writes the `amplitude` value to all channels/displays specified in the `actuators` ActuatorSelection array. The ActuatorSelection array gets reduced to one instruction for each occuring peripheral uuid
 */
export function writeAmplitudeForSelection(
  actuators: ActuatorSelection[],
  amplitude: number,
) {
  // interface DisplayChannel {
  // 	[key: string]: Set<number>;
  // }
  //for each display in actuator selection write amplitude to channel with writeAmplitudeOnDisplay function
  const displays = new Set<string>();
  // const channels: DisplayChannel = {}
  const channels: { [key: string]: Set<number> } = {};
  //get all unique displays
  actuators.forEach((actor) => {
    displays.add(actor.deviceUuid);
  });

  //get all unique channels for each display
  displays.forEach((display) => {
    const a = actuators.filter((a) => a.deviceUuid === display);
    if (a.length > 0) {
      channels[display] = new Set<number>();
      a.forEach((actor) => {
        channels[display].add(actor.actuator);
      });
    }
  });

  displays.forEach((display) => {
    writeAmplitudeOnDisplay(
      display,
      Array.from(channels[display].values()),
      amplitude,
    );
  });
}

export function writeFrequencyOnDisplay(
  deviceUuid: string,
  channels: number[],
  frequency: number,
) {
  window.api.send(IPC_CHANNELS.bluetooth.main.writeFrequencyBuffer, {
    deviceId: deviceUuid,
    taskList: [
      {
        channelIds: channels,
        frequency: frequency,
      },
    ],
  });
}
//export function writeAmplitudeForSelection
//export function writeFrequencyForChannel

//export function setAllOutputsToZero
//export function setToResonanceFrequency
