<template>
		<h2>1D Saltation Illusion</h2>
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
											<v-radio-group v-model="modeSelection" :disabled="isRunning" inline
												hide-details>
												<v-radio label="Forward" value="Forward"></v-radio>
												<v-radio label="Backwards" value="Backwards"></v-radio>
												<!-- <v-radio label="Back and Forth" value="Back and Forth"></v-radio> -->
											</v-radio-group>

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
								<v-slider hide-details max="1" min="0.05" step="0.05" show-ticks thumb-label
									v-model="maxAmp">
									<template v-slot:prepend>
										Maximal Amplitude: {{ maxAmp.toFixed(2) }}
									</template>
								</v-slider>

								<v-slider hide-details max="100" min="10" step="10" show-ticks thumb-label
									v-model="sliderBD">
									<template v-slot:prepend>
										Burst Duration: {{ sliderBD }} ms
									</template>
								</v-slider>

								<v-slider hide-details max="10" min="2" step="1" show-ticks thumb-label
									v-model="sliderNumImpulses">
									<template v-slot:prepend>
										Number of impulses: {{ sliderNumImpulses }}
									</template>
								</v-slider>

								<v-slider hide-details max="300" min="20" step="10" show-ticks thumb-label
									v-model="sliderIBI">
									<template v-slot:prepend>
										Inter burst interval: {{ sliderIBI }}ms
									</template>
								</v-slider>

							</v-card>

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
import ActuatorSelectionMenu from "@/core/TactileDisplays/views/ActuatorSelectionMenu.vue"
import { ActuatorSelection } from "@/core/TactileDisplays/TactileDisplayValidation"
import ActuatorArrangement from "@/core/TactileDisplays/views/ActuatorArrangement.vue"
import { TactileTask } from "@sharedTypes/tactonTypes";
import { writeAmplitudeOnDisplay } from "@/core/TactileDisplays/TactileDisplayActions";

export default defineComponent({
	name: "Saltation",
	components: { ActuatorSelectionMenu, ActuatorArrangement },
	data() {
		return {
			store: useStore(),
			sliderBD: 20,
			sliderNumImpulses: 3,
			sliderIBI: 50,
			isRunning: false,
			showActuatorSelection: false,
			actuators: new Array<ActuatorSelection>(),
			maxAmp: 1,
			BackwardsMs: 100,
			interBackwardsMs: 100,
			interAtmMs: 50,
			modeSelection: "Forward",
			fOnHandler: 0,
			fOffHandler: 0,
			repeat: false
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
	}, watch: {
		maxAmp: function () {
			/* 			if (this.modeSelection != "Back and Forth") {
							this.updateFunneling()
							if (this.isRunning) {
								this.updateVibration()
							}
						} */
		},
		slider: function () {
			/* 			if (this.modeSelection != "Back and Forth") {
							this.updateFunneling()
							if (this.isRunning) {
								this.updateVibration()
							}
						} */
		}
	},
	methods: {
		vibrate() {
			return false;
			// this.saltation()
		},
		updateVibration() {

			// this.writeValues(this.leftIntensity, this.rightIntensity)
		},
		stopVibration() {
			return false;
		},
		toggleVibration() {
			this.isRunning = !this.isRunning
			if (this.isRunning) {
				this.saltation()
			} else {
				this.stopVibration()
			}
			return false;
		},
		saltation() {

			interface AtmStep {
				deviceId: string,
				task: TactileTask,
				when: number
			}
			//tactile task, when
			let instructions = new Array<AtmStep>()


			let actuators = this.actuators
			if (this.modeSelection == "Backwards") {
				actuators = this.actuators.reverse()
			} /* else if(this.modeSelection == "Back and Forth"){
				let r = this.actuators.reverse()
				actuators = actuators.concat(r)
			} */

			//steps = 2 * actuators.length * number_of_bursts 
			let c = 0;
			for (let a = 0; a < actuators.length; a++) {
				for (let i = 0; i < this.sliderNumImpulses; i++) {
					const on: AtmStep = {
						deviceId: this.actuators[a].deviceUuid,
						task: {
							channelIds: [actuators[a].actuator],
							intensity: this.maxAmp
						},
						when: c * this.sliderBD + c * this.sliderIBI
					}

					const off: AtmStep = {
						deviceId: this.actuators[a].deviceUuid,
						task: {
							channelIds: [actuators[a].actuator],
							intensity: 0
						},
						when: (c + 1) * this.sliderBD + c * this.sliderIBI
					}
					instructions.push(on)
					instructions.push(off)
					++c
				}
			}

			console.log()
			const fn = () => {
				instructions.forEach((inst, i) => {
					setTimeout(() => {
						writeAmplitudeOnDisplay(inst.deviceId, inst.task.channelIds, inst.task.intensity)

						//store all timeout handerls and set them free if vibrations stps
						//restart if repeating is set
						if (i == instructions.length - 1 && this.isRunning) {
							if (this.repeat) {
								setTimeout(() => {
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