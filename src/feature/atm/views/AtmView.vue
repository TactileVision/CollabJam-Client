<template>
	<h2>1D Apparent Tactile Motion</h2>
	<div id="atm">
		<v-alert v-if="!hardwareIsReady" type="warning" variant="tonal">
			Please connect tactile displays with at least two actuators connected!
		</v-alert>
		<v-row>

			<!-- MARK: Illusion Settings -->
			<v-col cols="8">
				<v-row>
					<v-col>

						<!-- MARK: Playback -->
						<v-card>
							<v-card-title>
								Playback
							</v-card-title>
							<v-container>
								<v-row>
									<v-col cols="10">
										<v-radio-group v-model="modeSelection" :disabled="isRunning" inline hide-details>
											<v-radio label="Forward" value="Forward"></v-radio>
											<v-radio label="Backwards" value="Backwards"></v-radio>
											<!-- <v-radio label="Back and Forth" value="Back and Forth"></v-radio> -->
										</v-radio-group>
										<input v-model="repeat" type="checkbox" name="repeating-checkbox"
											id="repeating-checkbox">
										Repeat


									</v-col>
									<v-col>
										<v-btn :disabled="!hardwareIsReady" @click="toggleVibration" :icon="isRunning ? 'mdi-stop'
											: 'mdi-play'" size="x-large">
											Trigger vibration
										</v-btn>
									</v-col>
								</v-row>
							</v-container>
						</v-card>

						<!-- MARK: Illusion Parameter -->
						<v-card>
							<v-card-title>
								Illusion Parameter
							</v-card-title>
							<v-slider hide-details max="1" min="0.05" step="0.05" show-ticks thumb-label v-model="maxAmp">
								<template v-slot:prepend>
									Maximal Amplitude: {{ maxAmp.toFixed(2) }}
								</template>
							</v-slider>

							<v-slider hide-details max="500" min="70" step="10" show-ticks thumb-label v-model="sliderBD">
								<template v-slot:prepend>
									Burst Duration: {{ sliderBD }} ms
								</template>
							</v-slider>

							<v-slider hide-details :disabled="!repeat" max="1000" min="50" step="50" show-ticks thumb-label
								v-model="interAtmMs">
								<template v-slot:prepend>
									Inter ATM Interval:
									{{ interAtmMs }}ms
								</template>
							</v-slider>

						</v-card>

						<!-- MARK: Repeat Parameter -->
						<!-- <v-card>
								<v-card-title>
									Pulsing Parameter
								</v-card-title>
								<v-slider hide-details :disabled="modeSelection == 'Forward'" max="1000" min="50" step="50"
									show-ticks thumb-label v-model="BackwardsMs">
									<template v-slot:prepend>
										Backwards duration
									</template>
									<template v-slot:append>
										{{ BackwardsMs }}ms
									</template>
								</v-slider>
								<v-slider hide-details :disabled="modeSelection != 'Back and Forth'" max="1000" min="50"
									step="50" show-ticks thumb-label v-model="interBackwardsMs">
									<template v-slot:prepend>
										Inter Backwards Interval
									</template>
									<template v-slot:append>
										{{ interBackwardsMs }}ms
									</template>
								</v-slider>
							</v-card> -->

					</v-col>
					<v-col>
						<actuator-selection-menu :disabled="isRunning" v-model="actuators"></actuator-selection-menu>
						<actuator-arrangement v-model="actuators"></actuator-arrangement>
					</v-col>
				</v-row>
				<!-- MARK: Mode selection and playback -->


				<!-- <img :src="require('../assets/handshake_openmoji.png')" /> -->
				<!-- <v-dialog v-model="showActuatorSelection" persistent width="1500">
			<v-btn color="error" @click="showActuatorSelection = !showActuatorSelection">
				Exit
			</v-btn> -->
			</v-col>
			<!-- MARK: Infos -->
			<v-col>
			</v-col>

		</v-row>
	</div>
	<!-- {{ actuators }} -->
	<!-- </v-dialog> -->

	<!-- 
- Check if one device with at least two displays is connected or two devices with at least one device

- Select Left Actuator
- Select Right Actuator

- Add a slider for where the virtual actuator is placed
  -->
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/app/store/store";
import { IPC_CHANNELS } from "@/core/IPC/IpcChannels";
import ActuatorSelectionMenu from "@/core/TactileDisplays/views/ActuatorSelectionMenu.vue"
import { ActuatorSelection } from "@/core/TactileDisplays/TactileDisplayValidation"
import ActuatorArrangement from "@/core/TactileDisplays/views/ActuatorArrangement.vue"
import { TactileTask } from "@sharedTypes/tactonTypes";
import { writeAmplitudeOnDisplay } from "@/core/TactileDisplays/TactileDisplayActions";
import { atm, stopAtm } from "../atm";

export default defineComponent({
	name: "ATM",
	components: { ActuatorSelectionMenu, ActuatorArrangement },
	data() {
		return {
			store: useStore(),
			sliderBD: 70,
			isRunning: false,
			leftIntensity: 0,
			rightIntensity: 0,
			showActuatorSelection: false,
			actuators: new Array<ActuatorSelection>(),
			maxAmp: 1,
			BackwardsMs: 100,
			interBackwardsMs: 100,
			interAtmMs: 50,
			modeSelection: "Forward",
			repeat: false,
			timeoutHandler: 0
		}
	},
	computed: {
		hardwareIsReady(): boolean {
			const d = this.store.getters.getNumberOfConnectedDisplays > 0
			if (!d) return false

			const a = this.store.state.deviceManager.connectedTactileDisplays[0].numOfOutputs >= 2
			if (!a) return false

			const s = this.actuators.length >= 2
			return s
		}
	},
	methods: {
		writeValues(leftIntensity: number, rightIntensity: number) {
			window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, {
				deviceId: this.actuators[0].deviceUuid,
				taskList: [
					{
						channelIds: [this.actuators[0].actuator],
						intensity: leftIntensity,
					},
				]
			});

			window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, {
				deviceId: this.actuators[1].deviceUuid,
				taskList: [
					{
						channelIds: [this.actuators[1].actuator],
						intensity: rightIntensity,
					},
				]
			});
		},
		async ping() {
			this.isRunning = true
			this.writeValues(this.leftIntensity, this.rightIntensity)
			await new Promise((r) => setTimeout(r, this.BackwardsMs));
			this.writeValues(0, 0)
			this.isRunning = false
		},
		updateVibration() {

			this.writeValues(this.leftIntensity, this.rightIntensity)
		},
		stopVibration() {
			this.writeValues(0, 0)
		},
		toggleVibration() {
			this.isRunning = !this.isRunning
			if (this.isRunning) {
				// this.atm_o()
				const fn = () => {
					if (this.repeat) {
						this.timeoutHandler = window.setTimeout(() => {
							atm(this.actuators, this.sliderBD, this.maxAmp, fn)
						}, this.interAtmMs)
					} else {
						this.isRunning = false
					}
				}
				atm(this.actuators, this.sliderBD, this.maxAmp, fn)
			} else {
				stopAtm(this.actuators)
				window.clearTimeout(this.timeoutHandler)
				// this.stopVibration()
			}
			return false;
		},
		atm_o() {
			interface AtmStep {
				deviceId: string,
				task: TactileTask,
				when: number
			}
			//tactile task, when
			let instructions = new Array<AtmStep>()
			if (this.sliderBD < 70) return
			const soa = 0.32 * this.sliderBD + 47.3


			let actuators = this.actuators
			if (this.modeSelection == "Backwards") {
				actuators = this.actuators.reverse()
			} /* else if(this.modeSelection == "Back and Forth"){
				let r = this.actuators.reverse()
				actuators = actuators.concat(r)
			} */


			for (let i = 0; i < actuators.length; i++) {
				const on: AtmStep = {
					deviceId: actuators[i].deviceUuid,
					task: {
						channelIds: [actuators[i].actuator],
						intensity: this.maxAmp
					},
					when: i * soa
				}
				const off: AtmStep = {
					deviceId: actuators[i].deviceUuid,
					task: {
						channelIds: [actuators[i].actuator],
						intensity: 0
					},
					when: i * soa + this.sliderBD
				}
				instructions[i * 2] = on
				instructions[i * 2 + 1] = off
			}

			instructions.sort(function (a: AtmStep, b: AtmStep) {
				// a kleiner dann -1 ,a größer dann 1,a gleich b dann 0
				return (a.when < b.when) ? -1 : (a.when > b.when) ? 1 : 0;
			});

			const fn = () => {
				instructions.forEach((inst, i) => {
					setTimeout(() => {
						writeAmplitudeOnDisplay(inst.deviceId, inst.task.channelIds, inst.task.intensity)


						//store all timeout handerls and set them free if vibrations stps
						//restart if repeating is set
						if (i == instructions.length - 1 && this.isRunning) {
							if (this.repeat) {
								this.timeoutHandler = window.setTimeout(() => {
									fn()
								}, this.interAtmMs)
							}
							else {
								this.toggleVibration()
							}
						}

					}, inst.when)
				})

			}

			fn()
		}
	},
})
</script>