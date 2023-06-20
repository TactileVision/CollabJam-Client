<template>
	<!-- <h1>Tactons</h1> -->
	<!-- <v-card :title="'Filename:' + store.state.roomSettings.recordingNamePrefix"> -->

	<v-row>
		<v-col>

			Filename: {{ store.state.roomSettings.recordingNamePrefix }}
			<v-btn variant="text" @click="showEditPrefix = !showEditPrefix" color="primary"> {{ showEditPrefix ? "Close" :
				"Edit" }}
			</v-btn>
			<div v-if="showEditPrefix" class="editPrefix">
				<v-text-field v-model="editPrefixText" id="edit-prefix-input" type="text" label="Enter prefix"
					variant="outlined"></v-text-field>
				<v-btn :disabled="editPrefixText == '' || editPrefixText == store.state.roomSettings.recordingNamePrefix"
					@click="updatePrefix" color="primary"> Save </v-btn>
			</div>
		</v-col>
	</v-row>
	<v-row>
		<v-spacer></v-spacer>
		<v-btn :disabled="store.state.roomSettings.mode != 1 || store.state.tactonPlayback.currentTacton == null"
			@click="playRecordedTacton" color="primary" prepend-icon="mdi-play"> Play </v-btn>

		<v-btn @click="changeRecordMode" color="error"
			:prepend-icon="store.state.roomSettings.mode == 2 ? 'mdi-stop' : 'mdi-record'" x>
			{{ store.state.roomSettings.mode == 2 ? "Stop" : "Record" }}
		</v-btn>
	</v-row>
	<v-row>
		<v-col>
			<h2>Recorded tactons</h2>
			<v-switch v-model="filteredView" :disabled="store.state.tactonPlayback.tactons.length == 0" hide-details
				label="Favorites only" color="primary"></v-switch>
			<v-list lines="one" class="tacton-list">
				<v-list-item v-for="(tacton, index) of getTactons()" :disabled="store.state.roomSettings.mode != 1"
					:key=tacton.uuid
					:class="[{ 'selected': tacton.uuid == store.state.tactonPlayback.currentTacton?.uuid }, { 'disabled': store.state.roomSettings.mode != 1 }]">
					<v-row align-content="left" align="center" v-if="shouldDisplay(tacton)">
						<v-col cols="2">
							<v-btn :icon="tacton.metadata.favorite ? 'mdi-star' : 'mdi-star-outline'" variant="plain"
								@click="toggleFavorite(tacton)"> Button </v-btn>

						</v-col>
						<v-col cols="10" @click="selectTacton(tacton)">
							{{ tacton.metadata.name }}
							{{ calculateDuration(tacton) / 1000 }} s
						</v-col>

					</v-row>
				</v-list-item>
			</v-list>
			<!-- <ul class="selection-list tacton-list">
			<li v-for="(tacton, index) of store.state.tactonPlayback.tactons" @click="selectTacton(tacton)" :key=tacton.uuid
				:class="[{ 'selected': tacton.uuid == store.state.tactonPlayback.currentTacton?.uuid }, { 'disabled': store.state.roomSettings.mode != 1 }]">
				{{ tacton.name }}
				<span>({{ calculateDuration(tacton) / 1000 }} s)</span>
			</li>
		</ul> -->
			<!-- </div> -->
		</v-col>

	</v-row>
</template>

<style lang="scss">
.tacton-ui-element {
	margin: 1em;
}

.tacton-list {
	height: 80%;
	overflow: scroll;
}

.selected {
	font-weight: bold;
	background-color: gainsboro
}

.controls {
	margin: 1em auto;
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
		}
	},
}
);
</script>