<template>
	<h1>Select Tacton</h1>
	<!-- TODO Disable when recording -->
	
	<v-btn :disabled="store.state.tactonPlayback.currentTacton == null" @click="playRecordedTacton" color="primary"> Play </v-btn>
	<ul>
		<li v-for="(tacton, index) of store.state.tactonPlayback.tactons" @click="selectTacton(tacton)" :key=tacton.uuid
			:class="{ 'selected': tacton.uuid == store.state.tactonPlayback.currentTacton?.uuid }">
			{{ tacton.uuid }}
			<!-- <span>{{ tacton.recordDate }}</span> -->
			<span>({{ tacton.instructions.length }} Instructions)</span>
		</li>
	</ul>
</template>

<style>
.selected {
	font-weight: bold;
}
</style>

<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
import { useStore } from "@/renderer/store/store";
import { Tacton, TactonPlaybackActionTypes } from "@/renderer/store/modules/tactonPlayback/tactonPlayback";
import { playbackRecordedTacton } from "@/electron/DeviceManager/TactonPlayer";

export default defineComponent({
	name: "TactonSelectionList",
	props: {},
	data() {
		return {
			store: useStore(),
		};
	},
	computed: {},
	methods: {
		selectTacton(tacton: Tacton) {
			console.log(tacton)
			this.store.dispatch(TactonPlaybackActionTypes.selectTacton, tacton.uuid)
		},
		playRecordedTacton() {
			if (this.store.state.tactonPlayback.currentTacton != null) {
				playbackRecordedTacton(this.store.state.tactonPlayback.currentTacton.instructions);
			}
		}
	}

}
);
</script>