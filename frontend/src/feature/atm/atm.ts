//TODO: Write a function that stops outputs for all passed actuators
//TODO: Pass parameters 
//TODO: Make repeated atm a seperate function
//TODO: Make reversing of actuators a responsibility of function caller 
//TODO: Introduce state to make all calls working with timeouts stoppable!
import { writeAmplitude } from "@/core/DeviceManager/TactileDisplayActions"
import { ActuatorSelection } from "@/core/DeviceManager/TactileDisplayValidation"
import { IPC_CHANNELS } from "@/core/IPCMainManager/IPCChannels"
import { TactileTask } from "@sharedTypes/tactonTypes"

// interface ATMPlaybackSettings{
// 	direction : ""
// }
let timeoutHandlers = new Array<NodeJS.Timeout>()

export function atm(actuators: ActuatorSelection[], burstDuration: number, amplitude: number, onFinished: () => void) {
	interface AtmStep {
		deviceId: string,
		task: TactileTask,
		when: number
	}

	const prepareInstructions = (): AtmStep[] => {
		const instructions = new Array<AtmStep>()
		const soa = 0.32 * burstDuration + 47.3
		for (let i = 0; i < actuators.length; i++) {
			const on: AtmStep = {
				deviceId: actuators[i].deviceUuid,
				task: {
					channelIds: [actuators[i].actuator],
					intensity: amplitude
				},
				when: i * soa
			}
			const off: AtmStep = {
				deviceId: actuators[i].deviceUuid,
				task: {
					channelIds: [actuators[i].actuator],
					intensity: 0
				},
				when: i * soa + burstDuration
			}
			instructions[i * 2] = on
			instructions[i * 2 + 1] = off
		}

		instructions.sort(function (a: AtmStep, b: AtmStep) {
			// a kleiner dann -1 ,a größer dann 1,a gleich b dann 0
			return (a.when < b.when) ? -1 : (a.when > b.when) ? 1 : 0;
		});
		return instructions;
	}

	const run = () => {
		instructions.forEach((inst, i) => {
			const t = setTimeout(() => {
				window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, {
					deviceId: inst.deviceId,
					taskList: [
						inst.task
					]
				});
				if (i == instructions.length - 1) {
					//TODO Make all actors stop
					writeAmplitude(inst.deviceId, actuators, 0)
					onFinished()
				}

			}, inst.when)
			timeoutHandlers.push(t)
		})
	}

	if (burstDuration < 70) return
	const instructions = prepareInstructions()
	run()
}

export function stopAtm(deviceId: string, actuators: ActuatorSelection[]) {
	writeAmplitude(deviceId, actuators, 0)
	timeoutHandlers.forEach((handler) => {
		clearTimeout(handler)
	})
	timeoutHandlers = []
}