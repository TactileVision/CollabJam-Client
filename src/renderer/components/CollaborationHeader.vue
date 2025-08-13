<template>
  <v-container fluid class="ps-2 pe-2">
    <v-row class="align-center w-100 ga-6" no-gutters>
      <v-col cols="auto">
        <v-row class="ga-6" no-gutters>
          <!--Interactions with tacton (e.g. recording)-->
          <v-col cols="auto">
            <v-row class="ga-2 justify-start" no-gutters>
              <v-btn
                size="small"
                style="border-radius: 4px"
                color="error"
                @click="toggleRecording"
                @mouseenter="showToolTip(toolTipKeys.RECORD)"
                @mouseleave="clearToolTip"
                :disabled="
                  store.state.roomSettings.mode == 3 ||
                  store.state.tactonPlayback.currentTacton == null
                "
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
          </v-col>
          <!--Interactions with timeline (e.g. snapping)-->
          <v-col cols="auto">
            <v-row class="ga-2 justify-start" no-gutters>
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
        </v-row>
      </v-col>
      
      <!--Display for current Interaction (e.g. recording)-->
      <v-col>
        <v-card width="530" height="40" density="compact" variant="tonal">
          <v-row no-gutters class="align-center h-100 ps-2 pe-2 ga-12">
              <v-col
                v-if="currentTacton != null"
                cols="auto"
              >
                <div class="text-h6">
                  {{store.state.tactonPlayback.currentTacton?.metadata.name}}
                  {{store.state.tactonPlayback.currentTacton?.metadata.iteration}}
                </div>
              </v-col>
              <v-col
                cols="auto"
                v-if="currentToolTip != undefined"
              >
                <v-row no-gutters class="align-center ga-4">
                  <!--toolTip-->
                  <v-col
                    cols="auto"
                    class=" text-caption"
                  >
                    {{currentToolTip.toolTip}}
                  </v-col>

                  <!--ShortCut - if available-->
                  <v-col
                    cols="auto"
                    v-if="currentToolTip.shortCut != undefined"
                    class="shortCut text-end"
                  >
                    {{currentToolTip.shortCut}}
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
        </v-card>
      </v-col>
      
      <v-col>
        <v-row class="align-center ga-2 justify-end" no-gutters>
          <v-badge
            :content="participants.length"
            location="top right"
            color="secondary"
          >
            <v-btn
              variant="tonal"
              size="small"
              style="border-radius: 4px"
              :color="showParticipants ? 'primary' : 'secondary'"
              :icon="'mdi-account-group'"
              id="userListActivator"
              @click="showParticipants = !showParticipants"
              @mouseenter="showToolTip(toolTipKeys.PARTICIPANTS)"
              @mouseleave="clearToolTip"
            ></v-btn>
          </v-badge>
          <v-btn
            variant="tonal"
            size="small"
            style="border-radius: 4px"
            :color="showInputDevices ? 'primary' : 'secondary'"
            :icon="'mdi-controller-classic'"
            @click="showInputDevices = !showInputDevices"
            @mouseenter="showToolTip(toolTipKeys.INPUT_DEVICES)"
            @mouseleave="clearToolTip"
          ></v-btn>
          <DeviceConnectionModal :num-connected-devices="5"></DeviceConnectionModal>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
  <v-menu 
    activator="#userListActivator" 
    :close-on-content-click="false"
  >
    <ParticipantSettings></ParticipantSettings>
  </v-menu>
  <!--inputDevices-->
  <v-navigation-drawer
      floating
      location="bottom"
      v-model="showInputDevices"
  >
    <v-slide-group
      show-arrows
      class="h-100 ps-4 pe-4"
    >
      <template
        #default
      >
        <div class="d-flex flex-row ga-4">
          <v-slide-group-item
              v-for="device in inputDevices"
              :key="getDeviceKey(device)"
          >
            <CollaborationInputDeviceProfile :device="device"/>
          </v-slide-group-item>
        </div>
      </template>
    </v-slide-group>
  </v-navigation-drawer>
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

.shortCut {
  font-size: 12px;
  font-weight: 700;
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
import {changeRecordMode} from "@/renderer/helpers/recordMode";
import {InteractionModeChange, User} from "@sharedTypes/roomTypes";
import DeviceConnectionModal from "@/renderer/components/DeviceConnectionModal.vue";
import {TimelineActionTypes} from "@/renderer/store/modules/timeline/actions";
import CollaborationInputDeviceProfile from "@/renderer/components/CollaborationInputDeviceProfile.vue";
import {InputDevice, isGamepadDevice, isKeyboardDevice} from "@/main/Input/InputDetection/InputBindings";
import {getAllDevices} from "@/main/Input/InputDetection";
import {Tacton} from "@sharedTypes/tactonTypes";
import ParticipantSettings from "@/renderer/components/ParticipantSettings.vue";

enum ToolTipKeys {
  SNAPPING = "Snapping",
  EDIT = "Edit",
  RECORD = "Record",
  OVERDUB = "Overdub",
  PLAYBACK = "Playback",
  TACTILE_DISPLAY = "TactileDisplay",
  INPUT_DEVICES = "InputDevices",
  PARTICIPANTS = "Participants"
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
  },
  [ToolTipKeys.TACTILE_DISPLAY]: {
    toolTip: "Connect and manage your tactile displays"
  },
  [ToolTipKeys.INPUT_DEVICES]: {
    toolTip: "Show your current controls"
  },
  [ToolTipKeys.PARTICIPANTS]: {
    toolTip: "Show list of participants"
  }
}
export default defineComponent({
  name: "CollaborationHeader",
  components: {
    ParticipantSettings,
    CollaborationInputDeviceProfile,
    DeviceConnectionModal
  },
  data() {
    return {
      store: useStore(),
      toolTipKeys: ToolTipKeys,
      hoveredToolTip: undefined as ToolTip | undefined,
      currentToolTip: undefined as ToolTip | undefined,
      debounceTimer: undefined as ReturnType<typeof setTimeout> | undefined,
      debounceTimeMS: 200,
      inputDevices: [] as InputDevice[],
      pollDevices: -1,
      showInputDevices: false,
      showParticipants: false
    };
  },
  computed: {
    numConnectedDevices(): number {
      return this.store.state.generalSettings.deviceList.filter((d) => {
        return d.state == DeviceStatus.connected;
      }).length;
    },
    currentTacton(): Tacton | null {
      return this.store.state.tactonPlayback.currentTacton;
    },
    participants(): User[] {
      return this.store.state.roomSettings.participants.filter(
          (p) => p.id != this.store.state.roomSettings.user.id,
      );
    }
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
    },
    getDeviceKey(device: InputDevice) {
      if (isKeyboardDevice(device)) return "keyboard";
      else if (isGamepadDevice(device)) return `gamepad-${device.name}`;
    },
  },
  mounted() {
    this.inputDevices = getAllDevices();
    const pollFunction = () => {
      this.inputDevices = getAllDevices();
      this.pollDevices = requestAnimationFrame(pollFunction);
    };

    this.pollDevices = requestAnimationFrame(pollFunction);
  },
  beforeUnmount() {
    if (this.pollDevices !== -1) {
      cancelAnimationFrame(this.pollDevices);
    }
  }
});
</script>
