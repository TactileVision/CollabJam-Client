<template>
	<div>
		<div v-for="item in midiOutputs" :key="item.id" style="padding:0">
			<h3> {{ item.name }}</h3>
			<edit-parameter-midi :display="item"></edit-parameter-midi>
			<!-- <edit-parameter :display="item"></edit-parameter> -->
		</div>
		<div v-for="item in deviceList" :key="item.id" style="padding:0">
			<h3> {{ item.info.name }}</h3>
			<edit-parameter :display="item"></edit-parameter>
		</div>
	</div>
</template>

<style lang="scss">
// .overflow-wrapper {
// 	overflow: scroll;
// 	height: 100vh;
// }
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/app/store/store";
import { mapGetters } from 'vuex'
import EditParameter from "@/feature/channelParameter/views/EditParameter.vue"
import EditParameterMidi from "./EditParameterMidi.vue";
import { TactileDisplay } from '@/core/DeviceManager/store/DeviceManagerStore';
import { MidiOutputInfo } from "@sharedTypes/midiTypes";

export default defineComponent({
	name: "ChannelParameter",
	components: { EditParameter, EditParameterMidi },
	data() {
		return {
			store: useStore()
		}
	}, computed: {
		deviceList(): TactileDisplay[] {
			return this.store.state.deviceManager.connectedTactileDisplays;
		},
		midiOutputs(): MidiOutputInfo[] {
			return this.store.state.deviceManager.midiOutputs
		}
	}
})

</script>