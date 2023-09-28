<template>
	<v-card class="actuator-selection-menu">
		<v-card-title v-if="numActuators != null">Select Actuators ({{ selectedActuators.length }}/ {{ numActuators
		}})</v-card-title>
		<v-card-title v-else>Select Actuators ({{ selectedActuators.length }})</v-card-title>
		<v-card v-for="display in  tactileDisplayList " v-bind:key="display.info.id">
			<v-card-title>
				{{ display.info.name }}
			</v-card-title>
			<v-container>
				<v-row>
					<div class="actuator-selection-list">
						<div v-for="i in  display.numOfOutputs " v-bind:key="i">
							<!-- TODO: Change to a list of selected elements -->
							<input :disabled="!isSelectable(display.info.id + '-' + (i - 1))" type="checkbox"
								:value="display.info.id + '-' + (i - 1)" :name="'select-actuator-' + (i - 1)"
								:id="'checkbox-select-actuator-' + (i - 1)" v-model="selectedActuators">
							{{ i }}
						</div>
					</div>
				</v-row>

				<v-row
					:hidden="display.freqInformation.fMax == 0 && display.freqInformation.fMin == 0 && display.freqInformation.fResonance == 0">
					<v-col cols="8">
						<v-text-field v-model="freq" label="Frequency" type="number" :min="display.freqInformation.fMin"
							:max="display.freqInformation.fMax" prefix="Hz"></v-text-field>
						<!-- <v-slider v-model="freqs[]" label="Frequency" type="number" :min="display.freqInformation.fMin"
						:max="display.freqInformation.fMax" prefix="Hz"></v-slider> -->
					</v-col>
					<v-col cols="4">
						<v-btn @click="updateFreq(display)"> Set Frequency </v-btn>
					</v-col>
				</v-row>

			</v-container>
		</v-card>
	</v-card>
</template>

<style lang="scss">
// .actuator-selection-menu {
// 	>div {
// 		margin-right: 2em;
// 		display: inline-block;
// 	}
// }

.actuator-selection-list {
	margin-bottom: 1em;
	padding: 1em;

	>div {
		display: inline-block;
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
import { toHandlers } from 'vue';
export default defineComponent({
	name: "ActuatorSelectionMenu",
	emits: ['update:modelValue'],
	props: {
		modelValue: Object as () => ActuatorSelection,
		numActuators: {
			type: Number,
			required: false
		},
	},
	data() {
		return {
			numSelected: 0,
			store: useStore(),
			selectedActuators: [] as Array<string>,
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
		},
		isSelectable(elementId: string) {
			if (this.numActuators == null) {
				return true
			}
			return this.selectedActuators.length < this.numActuators || (this.selectedActuators.includes(elementId))
		}
	}
})
</script>