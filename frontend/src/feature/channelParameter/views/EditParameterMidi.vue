<template>
	{{ display }}
	<v-row class="channel mb-4" v-for="n in this.display.channels" :key="n">
		<v-col align="right" cols="1">
			<div>Channel {{ n }} </div>
			<v-btn @click="this.toggleChannel(n - 1)" :icon="this.enabled[n - 1] ? 'mdi-stop' : 'mdi-play'"
				:color="this.enabled[n - 1] ? 'default' : 'success'">
			</v-btn>
		</v-col>
		<v-col>
			<!-- Set amp -->
			<v-slider :disabled="!this.enabled[n - 1]" @update:modelValue="midiWrite(n - 1, $event, this.freq[n - 1])"
				hide-details max="1" min="0.05" step="0.05" show-ticks thumb-label v-model="this.amp[n - 1]">
				<template v-slot:prepend>
					Amplitude: {{ this.amp[n - 1] }}
				</template>
			</v-slider>
			<!-- Set freq -->
			<v-slider :disabled="!this.enabled[n - 1]" @update:modelValue="midiWrite(n - 1, this.amp[n - 1], $event)"
				hide-details :max="493" :min="8" step="1" show-ticks thumb-label v-model="this.freq[n - 1]">
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
import { TactileDisplay } from '@/core/DeviceManager/store/DeviceManagerStore';
import { writeToMidiOutput } from "@/core/DeviceManager/TactileDisplayActions"
import { MidiOutputInfo } from "@sharedTypes/midiTypes";

export default defineComponent({
	//TODO Set all outputs to zero when entering view to mitigate risk of state offset
	name: "EditParameterMidi",
	props: {
		display: {
			type: Object as () => MidiOutputInfo,
			required: true
		},
	},
	data() {
		return {
			amp: Array<number>(this.display.channels).fill(1),
			freq: Array<number>(this.display.channels).fill(440),
			enabled: Array<boolean>(this.display.channels).fill(false)
		}
	},
	methods: {
		toggleChannel(channel: number) {
			this.enabled[channel] = !this.enabled[channel]
			if (this.enabled[channel]) {
				this.midiWrite(channel, this.amp[channel], this.freq[channel])
			} else {
				this.midiWrite(channel, 0, this.freq[channel])
			}
		},
		midiWrite(channel: number, amp: number, freq: number) {
			console.log("writing midi output")
			writeToMidiOutput({ deviceId: this.display.id, amplitude: amp, channels: channel + 1, frequency: freq })
		}
	}
})
</script>