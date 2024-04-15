<template>
  <!--MARK: Recording-->
  <!-- <v-sheet class="pa-1"> -->
  <!-- <div class="text-overline">Create Tacton</div> -->
  <v-btn
    block
    @click="toggleRecording"
    :disabled="store.state.roomSettings.mode == 3"
    color="error"
    :prepend-icon="
      store.state.roomSettings.mode == 2 ? 'mdi-stop' : 'mdi-record'
    "
  >
    {{ store.state.roomSettings.mode == 2 ? "Stop" : "Record Tacton" }}
  </v-btn>
  <div>
    <span class="overline">Save as: </span>
    <span>
      <strong>
        {{ store.state.roomSettings.recordingNamePrefix }}-<em>n</em></strong
      >
    </span>
    <v-btn
      variant="text"
      @click="showEditPrefix = !showEditPrefix"
      color="primary"
    >
      {{ showEditPrefix ? "Close" : "Edit" }}
    </v-btn>
  </div>
  <div v-if="showEditPrefix" class="editPrefix">
    <v-text-field
      v-model="editPrefixText"
      id="edit-prefix-input"
      type="text"
      label="Enter prefix"
      hide-details
      variant="outlined"
      class="mb-2"
    ></v-text-field>
    <v-btn
      block
      :disabled="
        editPrefixText == '' ||
        editPrefixText == store.state.roomSettings.recordingNamePrefix
      "
      @click="updatePrefix"
      color="primary"
    >
      Save
    </v-btn>
  </div>
  <!-- </v-sheet> -->

  <!-- MARK: Tacton List -->

  <!-- <v-sheet class="pa-1"> -->
  <v-btn
    block
    @click="togglePlayback"
    :disabled="
      store.state.roomSettings.mode == 2 ||
      store.state.tactonPlayback.currentTacton == null
    "
    color="primary"
    :prepend-icon="store.state.roomSettings.mode == 3 ? 'mdi-stop' : 'mdi-play'"
    x
  >
    {{
      store.state.roomSettings.mode == 3
        ? "Stop"
        : `Play
			${store.state.tactonPlayback.currentTacton?.metadata.name}`
    }}
  </v-btn>
  <v-switch
    v-model="filteredView"
    :disabled="store.state.tactonPlayback.tactons.length == 0"
    hide-details
    label="Show Favorites only"
    color="primary"
  ></v-switch>

  <v-list
    lines="one"
    class="selection-list"
    :selected="selectedItems"
    color="primary"
    density="compact"
  >
    <v-list-item
      v-for="(tacton, index) of getTactons()"
      :disabled="store.state.roomSettings.mode != 1"
      :key="tacton.uuid"
      class="non-selectable"
      :title="tacton.metadata.name"
      :subtitle="`${(calculateDuration(tacton) / 1000).toFixed(2)} s    ${tacton.metadata.recordDate}`"
      :active="tacton.uuid == selection"
      @click="selectTacton(tacton)"
    >
      <template v-slot:prepend>
        <v-list-item-action>
          <v-btn
            :icon="tacton.metadata.favorite ? 'mdi-star' : 'mdi-star-outline'"
            variant="plain"
            @click="toggleFavorite(tacton)"
          >
          </v-btn>
        </v-list-item-action>
      </template>
    </v-list-item>
  </v-list>
  <!-- </v-sheet> -->
</template>

<style lang="scss" scoped>
.non-selectable {
  user-select: none;
}

.selection-list {
  height: 70vh;
  overflow-y: scroll !important;
}

#prefix-input {
  border-style: solid;
}
</style>

<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
import { useStore } from "@/renderer/store/store";
import { TactonPlaybackActionTypes } from "@/renderer/store/modules/collaboration/tactonPlayback/tactonPlayback";
import { sendSocketMessage } from "@/main/WebSocketManager";
import { InteractionMode, InteractionModeChange } from "@sharedTypes/roomTypes";
import { Tacton, TactonMetadata } from "@sharedTypes/tactonTypes";
import { ChangeTactonMetadata, WS_MSG_TYPE } from "@sharedTypes/websocketTypes";
import { changeRecordMode } from "@/renderer/helpers/recordMode";

export default defineComponent({
  name: "TactonSelectionList",
  // props: {},
  data() {
    return {
      store: useStore(),
      showEditPrefix: false,
      editPrefixText: "",
      filteredView: false,
      selection: null as null | string,
      selectedItems: [], // don't know why this has to exist
    };
  },
  computed: {
    currentTacton(): Tacton | null {
      return this.store.state.tactonPlayback.currentTacton;
    },
  },
  watch: {
    currentTacton(tacton) {
      if (tacton == null) {
        this.selection = null;
      } else {
        this.selection = tacton.uuid;
      }
    },
  },
  methods: {
    toggleRecording() {
      changeRecordMode(this.store, InteractionModeChange.toggleRecording);
      // if (this.store.state.roomSettings.mode == InteractionMode.Recording) {
      // 	sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
      // 		roomId: this.store.state.roomSettings.id,
      // 		newMode: InteractionMode.Jamming
      // 	});

      // }
      // else {
      // 	sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
      // 		roomId: this.store.state.roomSettings.id,
      // 		newMode: InteractionMode.Recording
      // 	});
      // }
    },
    selectTacton(tacton: Tacton) {
      this.selection = tacton.uuid;
      this.store.dispatch(TactonPlaybackActionTypes.selectTacton, tacton.uuid);
    },
    togglePlayback() {
      changeRecordMode(this.store, InteractionModeChange.togglePlayback);
    },
    calculateDuration(tacton: Tacton): number {
      let d = 0;
      tacton.instructions.forEach((t) => {
        if ("wait" in t) {
          const w = t;
          d += w.wait.miliseconds;
        }
      });
      return d;
    },
    updatePrefix() {
      console.log(this.editPrefixText);
      sendSocketMessage(WS_MSG_TYPE.CHANGE_ROOMINFO_TACTON_PREFIX_SERV, {
        roomId: this.store.state.roomSettings.id,
        prefix: this.editPrefixText,
      });
      return;
    },
    toggleFavorite(tacton: Tacton) {
      const m: TactonMetadata = {
        name: tacton.metadata.name,
        favorite: !tacton.metadata.favorite,
        recordDate: tacton.metadata.recordDate,
      };
      if (this.store.state.roomSettings.id != undefined) {
        const payload: ChangeTactonMetadata = {
          roomId: this.store.state.roomSettings.id,
          tactonId: tacton.uuid,
          metadata: m,
        };
        sendSocketMessage(WS_MSG_TYPE.CHANGE_TACTON_METADATA_SERV, payload);
      }
    },
    shouldDisplay(tacton: Tacton) {
      if (!this.filteredView) return true;
      return tacton.metadata.favorite;
    },
    getTactons() {
      if (this.filteredView) {
        return this.store.state.tactonPlayback.tactons.filter((t) => {
          return this.shouldDisplay(t);
        });
      }
      return this.store.state.tactonPlayback.tactons;
    },
    getModeString(mode: InteractionMode) {
      switch (mode) {
        case InteractionMode.Jamming:
          return "Jamming";
        case InteractionMode.Recording:
          return "Recording";
        case InteractionMode.Playback:
          return "Playback";
        default:
          return "Unkwown";
      }
    },
  },
});
</script>
