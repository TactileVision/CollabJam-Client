<template>
	<h1>Tactons</h1>
	<!-- TODO Disable when recording -->

	Filename: {{ store.state.roomSettings.recordingNamePrefix }}
	<v-btn @click="showEditPrefix = !showEditPrefix" color="primary"> {{ showEditPrefix ? "Close" : "Edit" }}
	</v-btn>
	<div v-if="showEditPrefix" class="editPrefix">
		<input v-model="editPrefixText" id="edit-prefix-input" type="text" />
		<v-btn :disabled="editPrefixText == '' || editPrefixText == store.state.roomSettings.recordingNamePrefix"
			@click="updatePrefix" color="primary"> Save </v-btn>
	</div>

	<div class="controls">
		<v-btn :disabled="store.state.roomSettings.mode == 2 || store.state.tactonPlayback.currentTacton == null"
			@click="playRecordedTacton" color="primary"> Play </v-btn>
		<v-btn :disabled="store.state.roomSettings.mode == 3" @click="changeRecordMode" color="primary">
			{{ store.state.roomSettings.mode == 2 ? "Stop" : "Record" }}
		</v-btn>
	</div>

	<ul class="tacton-list">
		<li v-for="(tacton, index) of store.state.tactonPlayback.tactons" @click="selectTacton(tacton)" :key=tacton.uuid
			:class="{ 'selected': tacton.uuid == store.state.tactonPlayback.currentTacton?.uuid }">
			{{ tacton.name }}
			<span>({{ calculateDuration(tacton) / 1000 }} s)</span>
		</li>
	</ul>
</template>

<style>
.selected {
	font-weight: bold;
	background-color: gainsboro
}

.controls {
	margin: 1em auto;
}

.tacton-list>li {
	/* margin: 1em 0; */
	padding: 1em;
	border-bottom: 1px solid grey
}

#prefix-input {
	border-style: solid;
}
</style>

<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
import { useStore } from "@/renderer/store/store";
import { TactonPlaybackActionTypes } from "@/renderer/store/modules/tactonPlayback/tactonPlayback";
import { playbackRecordedTacton } from "@/electron/DeviceManager/TactonPlayer";
import { sendSocketMessage } from "@/renderer/CommunicationManager/WebSocketManager";
import { WS_MSG_TYPE } from "@/renderer/CommunicationManager/WebSocketManager/ws_types";
import { InteractionMode } from "@/types/GeneralType";
import { InstructionWait, Tacton } from "@/types/TactonTypes";
import { Text } from "vue";

export default defineComponent({
	name: "TactonSelectionList",
	props: {},
	data() {
		return {
			store: useStore(),
			showEditPrefix: false,
			editPrefixText: ""
		};
	},
	computed: {},
	methods: {
		changeRecordMode() {
			if (this.store.state.roomSettings.mode == InteractionMode.Recording) {
				//TODO Send 0 to all available channels
				sendSocketMessage(WS_MSG_TYPE.SEND_INSTRUCTION_SERV, {
					roomId: this.store.state.roomSettings.id,
					instructions : [
						{
							keyId : "",
							channels: [0,1,2,3,4],
							intensity: 0
						}
					]
				})
				sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
					roomId: this.store.state.roomSettings.id,
					newMode: InteractionMode.Jamming
				});
				sendSocketMessage(WS_MSG_TYPE.GET_TACTON_SERV, {
					roomId: this.store.state.roomSettings.id,
				});
			}
			else {
				sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
					roomId: this.store.state.roomSettings.id,
					newMode: InteractionMode.Recording
				});
			}
		},
		selectTacton(tacton: Tacton) {
			console.log(tacton);
			this.store.dispatch(TactonPlaybackActionTypes.selectTacton, tacton.uuid);
		},
		playRecordedTacton() {
			if (this.store.state.tactonPlayback.currentTacton != null) {
				playbackRecordedTacton(this.store.state.tactonPlayback.currentTacton.instructions);
				sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
					roomId: this.store.state.roomSettings.id,
					newMode: InteractionMode.Playback
				})
			}
		},
		calculateDuration(tacton: Tacton): number {
			let d = 0;
			tacton.instructions.forEach(t => {
				if ("wait" in t) {
					const w = t;
					d += w.wait.miliseconds;
				}
			});
			return d;
		},
		updatePrefix() {
			console.log(this.editPrefixText)
			sendSocketMessage(WS_MSG_TYPE.CHANGE_ROOMINFO_TACTON_PREFIX_SERV, {
				roomId: this.store.state.roomSettings.id,
				prefix: this.editPrefixText
			});
			return
		}
	},
}
);
</script>