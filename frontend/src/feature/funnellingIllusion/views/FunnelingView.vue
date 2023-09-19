<template>
	<h2> Funelling Illusion </h2>
	<v-card>
		<div v-if="!hardwareIsReady">
			Please connect a tactile display with at least two actuators connected!
		</div>
		<v-btn :disabled="!hardwareIsReady" @click="toggleVibration"> {{ isRunning ? "Stop" : "Start" }}</v-btn>
		<v-slider max="1" min="0" step="0.1" show-ticks thumb-label @change="onSlider" v-model="slider">
			<template v-slot:prepend>
				Left: {{ leftIntensity.toFixed(2) }}
			</template>

			<template v-slot:append>
				Right: {{ rightIntensity.toFixed(2) }}
			</template>

		</v-slider>
		<img :src="require('../assets/handshake_openmoji.png')" />

	</v-card>


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

export default defineComponent({
	name: "Funneling",
	data() {
		return {
			store: useStore(),
			slider: 0,
			isRunning: false,
			leftIntensity: 0,
			rightIntensity: 0,
		}
	},
	computed: {
		hardwareIsReady(): boolean {
			const d = this.store.getters.getNumberOfConnectedDisplays > 0
			if (!d) return false
			const a = this.store.state.deviceManager.connectedTactileDisplays[0].numOfOutputs >= 2
			return a
		}
	}, watch: {
		slider: function () {
			console.log("SSS")
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
			const diff = 0.5
			this.leftIntensity = 1 - (diff * this.slider)
			this.rightIntensity = (1 - diff) + diff * this.slider
		},
		updateVibration() {
			const d = this.store.state.deviceManager.connectedTactileDisplays[0];
			if (d == null) return
			window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, {
				deviceId: d.info.id,
				taskList: [
					{
						channelIds: [0],
						intensity: this.leftIntensity,
					},
				]
			});

			window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, {
				deviceId: d.info.id,
				taskList: [
					{
						channelIds: [1],
						intensity: this.rightIntensity,
					},
				]
			});
		},
		stopVibration() {
			const d = this.store.state.deviceManager.connectedTactileDisplays[0];
			if (d == null) return
			//SET Vibration value to zero
			window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, {
				deviceId: d.info.id,
				taskList: [
					{
						channelIds: [0],
						intensity: 0,
					},
				]
			});

			window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, {
				deviceId: d.info.id,
				taskList: [
					{
						channelIds: [1],
						intensity: 0,
					},
				]
			});
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