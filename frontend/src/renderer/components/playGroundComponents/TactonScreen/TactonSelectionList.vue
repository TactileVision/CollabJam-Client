<template>
	<!--MARK: Recording-->
	<v-sheet class="pa-1">
		<div class="text-overline">Create Tacton</div>
		<div class="ma-1">
			<v-btn block @click="changeRecordMode" :disabled="store.state.roomSettings.mode == 3" color="error"
				:prepend-icon="store.state.roomSettings.mode == 2 ? 'mdi-stop' : 'mdi-record'" x>
				{{ store.state.roomSettings.mode == 2 ? "Stop" : "Record" }}
			</v-btn>
			<div>

				<span class="overline">Save as: </span>
				<span> <strong> {{ store.state.roomSettings.recordingNamePrefix }}-<em>n</em></strong> </span>
				<v-btn variant="text" @click="showEditPrefix = !showEditPrefix" color="primary"> {{ showEditPrefix ?
					"Close" :
					"Edit" }}
				</v-btn>
			</div>
		</div>
		<div v-if="showEditPrefix" class="editPrefix">
			<v-text-field v-model="editPrefixText" id="edit-prefix-input" type="text" label="Enter prefix" hide-details
				variant="outlined" class="mb-2"></v-text-field>
			<v-btn block :disabled="editPrefixText == '' || editPrefixText == store.state.roomSettings.recordingNamePrefix"
				@click="updatePrefix" color="primary"> Save </v-btn>
		</div>
	</v-sheet>

	<!-- MARK: Tacton List -->

	<v-sheet class="pa-1">
		<div class="text-overline">History</div>
		<v-btn block :disabled="store.state.roomSettings.mode != 1 || store.state.tactonPlayback.currentTacton == null"
			@click="playRecordedTacton" color="primary" prepend-icon="mdi-play"> Play </v-btn>
		<v-switch v-model="filteredView" :disabled="store.state.tactonPlayback.tactons.length == 0" hide-details
			label="Show Favorites only" color="primary"></v-switch>
		<v-list lines="one" class="selection-list">
			<v-list-item v-for="(tacton, index) of getTactons()" :disabled="store.state.roomSettings.mode != 1"
				:key=tacton.uuid class="non-selectable"
				:class="[{ 'selected': tacton.uuid == store.state.tactonPlayback.currentTacton?.uuid }, { 'disabled': store.state.roomSettings.mode != 1 }]"
				:title="tacton.metadata.name" :subtitle="`${(calculateDuration(tacton) / 1000).toFixed(2)} s`"
				:value="tacton.uuid" @click="selectTacton(tacton)">

				<v-list-item-action start>
					<v-btn :icon="tacton.metadata.favorite ? 'mdi-star' : 'mdi-star-outline'" variant="plain"
						@click="toggleFavorite(tacton)"> Button </v-btn>
				</v-list-item-action>
			</v-list-item>
		</v-list>
	</v-sheet>
</template>

<style lang="scss" scoped>
.non-selectable {
	user-select: none;
}

.selection-list {
	height: 70vh;
	overflow-y: auto;
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
import { InteractionMode } from "@sharedTypes/roomTypes";
import { Tacton, TactonMetadata } from "@sharedTypes/tactonTypes";
import { ChangeTactonMetadata, WS_MSG_TYPE } from "@sharedTypes/websocketTypes";

export default defineComponent({
	name: "TactonSelectionList",
	props: {},
	data() {
		return {
			store: useStore(),
			showEditPrefix: false,
			editPrefixText: "",
			filteredView: false
		};
	},
	computed: {
	},
	methods: {
		changeRecordMode() {
			if (this.store.state.roomSettings.mode == InteractionMode.Recording) {
				sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
					roomId: this.store.state.roomSettings.id,
					newMode: InteractionMode.Jamming
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
		},
		toggleFavorite(tacton: Tacton) {
			const m: TactonMetadata = {
				name: tacton.metadata.name,
				favorite: !tacton.metadata.favorite,
				recordDate: tacton.metadata.recordDate
			}
			if (this.store.state.roomSettings.id != undefined) {
				const payload: ChangeTactonMetadata = {
					roomId: this.store.state.roomSettings.id,
					tactonId: tacton.uuid,
					metadata: m
				}
				sendSocketMessage(WS_MSG_TYPE.CHANGE_TACTON_METADATA_SERV, payload)
			}
		},
		shouldDisplay(tacton: Tacton) {
			if (!this.filteredView) return true
			return tacton.metadata.favorite
		},
		getTactons() {
			if (this.filteredView) {
				return this.store.state.tactonPlayback.tactons.filter(t => { return this.shouldDisplay(t) })
			}
			return this.store.state.tactonPlayback.tactons
		},
		getModeString(mode: InteractionMode) {

			switch (mode) {
				case InteractionMode.Jamming:
					return "Jamming"
				case InteractionMode.Recording:
					return "Recording"
				case InteractionMode.Playback:
					return "Playback"
				default:
					return "Unkwown"
			}
		},
	},
}
);
</script>