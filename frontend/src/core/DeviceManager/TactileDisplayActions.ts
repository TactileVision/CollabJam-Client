import { IPC_CHANNELS } from "../IPCMainManager/IPCChannels";
import { ActuatorSelection } from "@/core/DeviceManager/TactileDisplayValidation"

export function writeAmplitude(deviceUuid: string, actuators: ActuatorSelection[], amplitude: number) {
	const channels = new Set<number>()
	actuators.forEach((actor) => {
		channels.add(actor.actuator)
	})

	window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, {
		deviceId: deviceUuid,
		taskList: [
			{
				channelIds: [...channels],
				intensity: amplitude,
			}
		]
	});
}