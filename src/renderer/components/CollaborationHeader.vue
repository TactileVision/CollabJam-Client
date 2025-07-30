<template>
  <v-container fluid class="mt-4 mb-4">
    <v-row class="align-center w-100 ga-8">
      <!--Interactions with tacton (e.g. recording)-->
      <v-col style="max-width: 144px">
        <v-row class="justify-space-between">
          <v-btn
            size="small"
            style="border-radius: 4px"
            color="error"
            @click="toggleRecording"
            @mouseenter="showToolTip(toolTipKeys.RECORD)"
            @mouseleave="clearToolTip"
            :disabled="store.state.roomSettings.mode == 3"
            :icon="
              store.state.roomSettings.mode == 2 ? 'mdi-stop' : 'mdi-record'
            "
          ></v-btn>
          <v-btn
            size="small"
            style="border-radius: 4px"
            color="primary"
            @click="togglePlayback"
            @mouseenter="showToolTip(toolTipKeys.PLAYBACK)"
            @mouseleave="clearToolTip"
            :disabled="
              store.state.roomSettings.mode == 2 ||
              store.state.tactonPlayback.currentTacton == null
            "
            :icon="
              store.state.roomSettings.mode == 3 ? 'mdi-stop' : 'mdi-play'
            "
          ></v-btn>
          <v-btn
            size="small"
            style="border-radius: 4px"
            color="secondary"
            @click="toggleOverdubbing"
            @mouseenter="showToolTip(toolTipKeys.OVERDUB)"
            @mouseleave="clearToolTip"
            :disabled="
              store.state.roomSettings.mode == 2 ||
              store.state.tactonPlayback.currentTacton == null
            "
            :icon="
              store.state.roomSettings.mode == 4 ? 'mdi-stop' : 'mdi-layers-edit'
            "
          ></v-btn>
        </v-row>
        <v-row>
          
        </v-row>
      </v-col>
      <!--Interactions with timeline (e.g. snapping)-->
      <v-col style="max-width: 144px">
        <v-row class="ga-2">
          <v-btn
            variant="tonal"
            size="small"
            style="border-radius: 4px"
            @click="toggleSnapping"
            @mouseenter="showToolTip(toolTipKeys.SNAPPING)"
            @mouseleave="clearToolTip"
            :color="
              store.state.timeline.isSnappingActive ? 'success' : ''
            "
            :icon="
              store.state.timeline.isSnappingActive ? 'mdi-grid' : 'mdi-grid-off'
            "
            :disabled="
              store.state.roomSettings.mode == 2 ||
              store.state.tactonPlayback.currentTacton == null
            "
          ></v-btn>
          <v-btn
            variant="tonal"
            size="small"
            style="border-radius: 4px"
            @click="toggleEdit"
            @mouseenter="showToolTip(toolTipKeys.EDIT)"
            @mouseleave="clearToolTip"
            :color="
              store.state.timeline.isEditable ? 'success' : 'error'
            "
            :icon="
              store.state.timeline.isEditable ? 'mdi-pencil' : 'mdi-pencil-off'
            "
            :disabled="
              store.state.roomSettings.mode == 2 ||
              store.state.tactonPlayback.currentTacton == null
            "
          ></v-btn>
          <v-btn
            variant="tonal"
            size="small"
            style="border-radius: 4px"
            icon=""
            :disabled="
              store.state.roomSettings.mode == 2 ||
              store.state.tactonPlayback.currentTacton == null
            "
          ></v-btn>
        </v-row>
      </v-col>
      
      <!--Display for current Interaction (e.g. recording)-->
      <v-col>
        <v-row class="align-center ga-8 justify-start">
          <v-card width="360" height="40" density="compact" variant="tonal">
            <v-fade-transition name="fade-fast">
              <v-row 
                v-if="currentToolTip != undefined"
                class="align-center h-100 ps-4 pe-4"
                no-gutters
              >
                <!--toolTip-->
                <v-col
                  class="v-col-10 toolTip"
                >
                  {{currentToolTip.toolTip}}
                </v-col>
                
                <!--ShortCut - if available-->
                <v-col 
                  v-if="currentToolTip.shortCut != undefined"
                  class="v-col-2 shortCut text-end"
                >
                  {{currentToolTip.shortCut}}
                </v-col>
              </v-row>
              <v-row
                v-if="currentToolTip == undefined"
                class="align-center h-100 ps-4 pe-4"
                no-gutters
              >
                <!--current tacton-->
                <v-col 
                  class="v-col-10 toolTip text-center text-h6"
                >
                  {{store.state.tactonPlayback.currentTacton?.metadata.name}}
                  {{store.state.tactonPlayback.currentTacton?.metadata.iteration}}
                </v-col>
              </v-row>
            </v-fade-transition>
          </v-card>
          <div class="d-none d-xl-block">
            <CollaborationInteractionModeIndicator
                :mode="store.state.roomSettings.mode"
            ></CollaborationInteractionModeIndicator>
          </div>
        </v-row>
      </v-col>      
      <DeviceConnectionModal :num-connected-devices="0"></DeviceConnectionModal>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
/* .headerPlayGround {
  min-width: 100% !important;
  max-width: 100% !important;
  border-bottom: 1px solid rgb(48, 41, 41);
  min-height: 50px;
  padding: 2px 10px;
  display: block;
} */

.toolTip {
  font-size: 14px;
}

.shortCut {
  font-size: 12px;
  font-weight: 700;
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 100ms ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

</style>
<script lang="ts">
import {IPC_CHANNELS} from "@/preload/IpcChannels";
// import { router } from "@/renderer/router";
import {DeviceStatus, GeneralSettingsActionTypes,} from "@/renderer/store/modules/generalSettings/generalSettings";
import {RoomMutations, RoomState,} from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import {useStore} from "@/renderer/store/store";
import {defineComponent} from "vue";
import {WebSocketAPI} from "@/main/WebSocketManager";
// import UserMenuTooltip from "@/renderer/components/UserMenuTooltip.vue";
// import DeviceConnectionModal from "@/renderer/components/DeviceConnectionModal.vue";
import CollaborationInteractionModeIndicator from "@/renderer/components/CollaborationInteractionModeIndicator.vue";
import {changeRecordMode} from "@/renderer/helpers/recordMode";
import {InteractionModeChange} from "@sharedTypes/roomTypes";
import DeviceConnectionModal from "@/renderer/components/DeviceConnectionModal.vue";
import {TimelineActionTypes} from "@/renderer/store/modules/timeline/actions";
enum ToolTipKeys {
  SNAPPING = "Snapping",
  EDIT = "Edit",
  RECORD = "Record",
  OVERDUB = "Overdub",
  PLAYBACK = "Playback"
}

type ToolTip = {
  toolTip: string;
  shortCut?: string;
}

const ToolTips: Record<ToolTipKeys, ToolTip> = {
  [ToolTipKeys.SNAPPING]: {
    toolTip: "Toggles snapping of blocks to the grid", 
    shortCut: "CTRL + S"
  },
  [ToolTipKeys.EDIT]: {
    toolTip: "Toggles document edit mode",
  },
  [ToolTipKeys.RECORD]: {
    toolTip: "Records a new tacton",
  },
  [ToolTipKeys.OVERDUB]: {
    toolTip: "Records new input and merges it",
  },
  [ToolTipKeys.PLAYBACK]: {
    toolTip: "Starts/stops timeline playback",
  }
}
export default defineComponent({
  name: "CollaborationHeader",
  components: {
    DeviceConnectionModal,
    // UserMenuTooltip,
    // DeviceConnectionModal,
    CollaborationInteractionModeIndicator,
  },
  data: () => ({
    store: useStore(),
    toolTipKeys: ToolTipKeys,
    hoveredToolTip: undefined as ToolTip | undefined,
    currentToolTip: undefined as ToolTip | undefined,
    debounceTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    debounceTimeMS: 200
  }),
  computed: {
    numConnectedDevices(): number {
      return this.store.state.generalSettings.deviceList.filter((d) => {
        return d.state == DeviceStatus.connected;
      }).length;
    },
  },
  methods: {
    showToolTip(toolTipKey: ToolTipKeys) {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      
      this.debounceTimer = setTimeout(() => {
        this.currentToolTip = ToolTips[toolTipKey];
      }, this.debounceTimeMS)      
    },
    clearToolTip() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);

      this.debounceTimer = setTimeout(() => {
        this.currentToolTip = undefined;
      }, this.debounceTimeMS)
    },
    logOut() {
      // console.log("LOG OUT REQUESTED");
      console.log(this.store.state.roomSettings);
      if (
        this.store.state.roomSettings.id == "" ||
        this.store.state.roomSettings.user.id == ""
      )
        return;

      WebSocketAPI.logOut({
        roomId: this.store.state.roomSettings.id || "",
        user: this.store.state.roomSettings.user,
      });
      // this.$router.push("/rooms");
    },
    copyAdress() {
      // console.log(this.store.getters);
      this.store.dispatch(GeneralSettingsActionTypes.copyAdressToClipboard);
      window.api.send(IPC_CHANNELS.main.copyToClipBoard, {
        adress: `${this.store.state.roomSettings.roomName}#${this.store.state.roomSettings.id}`,
      });
    },
    settings() {
      this.store.commit(RoomMutations.UPDATE_ROOM_STATE, RoomState.Configure);
      this.$router.push("/setup");
    },
    devices() {
      this.$router.push("/devices");
    },
    toggleRecording() {
      changeRecordMode(InteractionModeChange.toggleRecording);
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
    togglePlayback() {
      changeRecordMode(InteractionModeChange.togglePlayback);
    },
    toggleOverdubbing() {
      changeRecordMode(InteractionModeChange.toggleOverdubbing);
    },
    toggleSnapping() {
      this.store.dispatch(TimelineActionTypes.TOGGLE_SNAPPING_STATE);
    },
    toggleEdit() {
      this.store.dispatch(TimelineActionTypes.TOGGLE_EDIT_STATE);
    }
  },
});
</script>
