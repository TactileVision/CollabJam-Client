<template>
	<v-row class="channel mb-4" v-for="n in this.display.numOfOutputs" :key="n">
		<v-col align="right" cols="1">
			<div>Channel {{ n }} </div>
			<v-btn @click="this.toggleChannel(n - 1)" :icon="this.enabled[n - 1] ? 'mdi-stop' : 'mdi-play'"
				:color="this.enabled[n - 1] ? 'default' : 'success'">
			</v-btn>
		</v-col>
		<v-col>
			<!-- Set amp -->
			<v-slider :disabled="!this.enabled[n - 1]" @update:modelValue="bleWriteAmp($event, n - 1)"
				v-if="this.display.outputParameter[n - 1].amplitude" hide-details max="1" min="0.05" step="0.05" show-ticks
				thumb-label v-model="this.amp[n - 1]">
				<template v-slot:prepend>
					Amplitude: {{ this.amp[n - 1] }}
				</template>
			</v-slider>

			<!-- Set freq -->
			<v-slider :disabled="!this.enabled[n - 1]" @update:modelValue="bleWriteFreq($event, n - 1)"
				v-if="this.display.outputParameter[n - 1].frequency" hide-details :max="this.display.freqInformation.fMax"
				:min="this.display.freqInformation.fMin" step="5" show-ticks thumb-label v-model="this.freq[n - 1]">
				<template v-slot:prepend>
					Frequency: {{ this.freq[n - 1] }}Hz
				</template>
			</v-slider>
		</v-col>
	</v-row>
</template>
<style lang="scss">
.channel {
	margin-bottom: 1em;
}
</style>
<script lang="ts">
import { defineComponent } from "vue"
import { TactileDisplay } from '@/core/Ble/store/DeviceManagerStore';
import { writeAmplitudeOnDisplay, writeFrequencyOnDisplay } from "@/core/TactileDisplays/TactileDisplayActions"

export default defineComponent({
	//TODO Set all outputs to zero when entering view to mitigate risk of state offset
	name: "EditParameter",
	props: {
		display: {
			type: Object as () => TactileDisplay,
			required: true
		},
	},
	data() {
		return {
			amp: Array<number>(this.display.numOfOutputs).fill(1),
			freq: Array<number>(this.display.numOfOutputs).fill(this.display.freqInformation.fResonance),
			enabled: Array<boolean>(this.display.numOfOutputs).fill(false)
		}
	},
	methods: {
		toggleChannel(channel: number) {
			this.enabled[channel] = !this.enabled[channel]
			if (this.enabled[channel]) {
				this.bleWriteAmp(this.amp[channel], channel)
				this.bleWriteFreq(this.freq[channel], channel)
			} else {
				this.bleWriteAmp(0, channel)
			}
		},
		bleWriteAmp(value: number, channel: number) {
			writeAmplitudeOnDisplay(this.display.info.id, [channel], value)
		},
		bleWriteFreq(value: number, channel: number) {
			writeFrequencyOnDisplay(this.display.info.id, [channel], value)
		}
	}
})
</script>