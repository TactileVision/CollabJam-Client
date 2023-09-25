<template>
	<div class="actuator-selection-menu">
		<h2>Select Actuators ({{ selectedActuators.length }}/{{ numActuators }})</h2>
		<div v-for="display in  tactileDisplayList " v-bind:key="display.info.id">
			<div>
				<div class="text-h5">
					{{ display.info.name }}
				</div>
				<div
					:hidden="display.freqInformation.fMax == 0 && display.freqInformation.fMin == 0 && display.freqInformation.fResonance == 0">
					<v-text-field v-model="freq" label="Frequency" type="number" :min="display.freqInformation.fMin"
						:max="display.freqInformation.fMax" prefix="Hz"></v-text-field>
					<!-- <v-slider v-model="freqs[]" label="Frequency" type="number" :min="display.freqInformation.fMin"
						:max="display.freqInformation.fMax" prefix="Hz"></v-slider> -->
					<v-btn @click="updateFreq(display)"> Set Frequency </v-btn>
				</div>
				<div class="actuator-selection-list">
					<div v-for="i in  display.numOfOutputs " v-bind:key="i">
						<!-- TODO: Change to a list of selected elements -->
						<input
							:disabled="(selectedActuators.length >= numActuators) && selectedActuators.includes(display.info.id + '-' + (i - 1)) == false"
							type="checkbox" :value="display.info.id + '-' + (i - 1)" :name="'select-actuator-' + (i - 1)"
							:id="'checkbox-select-actuator-' + (i - 1)" v-model="selectedActuators">
						Actuator {{ i }}
					</div>
				</div>
			</div>

		</div>
	</div>
</template>

<style lang="scss">
.actuator-selection-menu {
	>div {
		margin-right: 2em;
		display: inline-block;
	}
}

.actuator-selection-list {
	margin-bottom: 1em;
	padding: 1em;

	>div {
		margin: 1em;

	}
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from "@/app/store/store";
import { TactileDisplay } from '../store/DeviceManagerStore';
import { ActuatorSelection } from "@/core/DeviceManager/TactileDisplayValidation"
import { IPC_CHANNELS } from '@/core/IPCMainManager/IPCChannels';
export default defineComponent({
	name: "ActuatorSelectionMenu",
	emits: ['update:modelValue'],
	props: {
		modelValue: Object as () => ActuatorSelection,
		numActuators: {
			type: Number,
			required: true
		},
	},
	data() {
		return {
			numSelected: 0,
			store: useStore(),
			selectedActuators: [],
			freq: 0,
			// freqs: new Map<string,number>()
		};
	},
	watch: {
		selectedActuators() {
			const as: ActuatorSelection[] = []
			this.selectedActuators.forEach(sa => {
				const str = sa as string
				const arr = str.split("-")
				as.push({
					deviceUuid: arr[0],
					actuator: Number(arr[1])
				})
			})
			this.$emit('update:modelValue', as);
		}
	},
	computed: {
		tactileDisplayList(): TactileDisplay[] {
			return this.store.state.deviceManager.connectedTactileDisplays
		}
	}, methods: {
		updateSelection() {
			return false
		},
		updateFreq(display: TactileDisplay) {
			const b = new Array<number>(display.numOfOutputs).fill(this.freq)
			window.api.send(IPC_CHANNELS.bluetooth.main.writeFrequencyBuffer, { deviceId: display.info.id, freqBuffer: b })
		}
	}
})
</script>