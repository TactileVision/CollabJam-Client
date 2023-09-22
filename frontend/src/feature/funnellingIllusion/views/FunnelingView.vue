<template>
	<v-container>

		<h2>1D Funelling Illusion</h2>
		<div id="funneling-illusion">

			<div v-if="!hardwareIsReady">
				Please connect a tactile display with at least two actuators connected!
			</div>
			<v-row align="center" justify="left">
				<v-col cols="auto">
					<v-btn :disabled="!hardwareIsReady" @click="toggleVibration"> {{ isRunning ? "Stop" : "Start" }}</v-btn>
				</v-col>

				<v-col cols="auto">
					<v-btn :disabled="!hardwareIsReady" @click="ping"> {{ "Ping" }}</v-btn>
				</v-col>
			</v-row>

			<v-row align="center" justify="left">
				<v-slider max="1" min="0.05" step="0.05" show-ticks thumb-label v-model="maxAmp">
					<template v-slot:prepend>
						Maximal Amplitude
					</template>
					<template v-slot:append>
						{{ maxAmp.toFixed(2) }}
					</template>
				</v-slider>
			</v-row>
			<v-row align="center" justify="left">
				<v-slider max="1" min="0" step="0.05" show-ticks thumb-label v-model="slider">
					<template v-slot:prepend>
						Left: {{ slider.toFixed(2) }}
					</template>

					<template v-slot:append>
						Right: {{ (1 - slider).toFixed(2) }}
					</template>
				</v-slider>
			</v-row>
			<v-row align="center" justify="left">
				<v-slider max="1000" min="50" step="50" show-ticks thumb-label v-model="pingMs">
					<template v-slot:prepend>
						Ping duration
					</template>
					<template v-slot:append>
						{{ pingMs }}ms
					</template>
				</v-slider>
			</v-row>
			<!-- <img :src="require('../assets/handshake_openmoji.png')" /> -->
			<!-- <v-dialog v-model="showActuatorSelection" persistent width="1500">
			<v-btn color="error" @click="showActuatorSelection = !showActuatorSelection">
				Exit
			</v-btn> -->
		</div>
		<actuator-selection-menu v-show="!isRunning" :numActuators="2" v-model="actuators"></actuator-selection-menu>
		<!-- {{ actuators }} -->
		<!-- </v-dialog> -->

	</v-container>

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
import { IPC_CHANNELS } from "@/core/IPCMainManager/IPCChannels";
import ActuatorSelectionMenu from "@/core/DeviceManager/views/ActuatorSelectionMenu.vue"
import { ActuatorSelection } from "@/core/DeviceManager/TactileDisplayValidation"

export default defineComponent({
	name: "Funneling",
	components: { ActuatorSelectionMenu },
	data() {
		return {
			store: useStore(),
			slider: 0.5,
			isRunning: false,
			leftIntensity: 0,
			rightIntensity: 0,
			showActuatorSelection: false,
			actuators: new Array<ActuatorSelection>(),
			maxAmp: 1,
			pingMs: 100
		}
	},
	computed: {
		hardwareIsReady(): boolean {
			const d = this.store.getters.getNumberOfConnectedDisplays > 0
			if (!d) return false

			const a = this.store.state.deviceManager.connectedTactileDisplays[0].numOfOutputs >= 2
			if (!a) return false

			const s = this.actuators.length == 2
			return s
		}
	}, watch: {
		maxAmp: function () {
			this.updateFunneling()
			if (this.isRunning) {
				this.updateVibration()
			}
		},
		slider: function () {
			this.updateFunneling()
			if (this.isRunning) {
				this.updateVibration()
			}
		}
	},
	methods: {
		canWork() {
			// return DeviceManager.connectedDevices.size > 0
			// return canDoIllusion();
		},

		updateFunneling() {

			// const diff = 0.5
			// this.leftIntensity = 1 - (diff * this.slider)
			// this.rightIntensity = (1 - diff) + diff * this.slider
			//CHOI
			// this.leftIntensity = this.maxAmp * (1 - this.slider)
			// this.rightIntensity = this.maxAmp * (1 - (1 - this.slider))

			//Izrar
			//maxAmp = Av
			//b = this.slider, because normalized distance ratios
			this.leftIntensity = this.maxAmp * Math.sqrt(1 - this.slider)
			this.rightIntensity = this.maxAmp * Math.sqrt(this.slider)
		},

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
			await new Promise((r) => setTimeout(r, this.pingMs));
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
				this.updateFunneling()
				this.updateVibration()
			} else {
				this.stopVibration()
			}
			return false;
		}
	},
})
</script>