<template>
  <v-toolbar style="margin-top: 0px">
    <!--MARK: Recording-->
    <!-- <v-sheet class="pa-1"> -->
    <!-- <div class="text-overline">Create Tacton</div> -->
    <v-btn
      width="40px"
      height="40px"
      style="border-radius: 4px"
      @click="toggleRecording"
      :disabled="store.state.roomSettings.mode == 3"
      color="error"
      :icon="store.state.roomSettings.mode == 2 ? 'mdi-stop' : 'mdi-record'"
    >
    </v-btn>
    <v-btn
      width="40px"
      height="40px"
      style="border-radius: 4px"
      @click="togglePlayback"
      :disabled="
        store.state.roomSettings.mode == 2 ||
        store.state.tactonPlayback.currentTacton == null
      "
      color="primary"
      :icon="store.state.roomSettings.mode == 3 ? 'mdi-stop' : 'mdi-play'"
    >
    </v-btn>
    <CollaborationInteractionModeIndicator
      class="v-col"
      cols="1>"
      :mode="store.state.roomSettings.mode"
    ></CollaborationInteractionModeIndicator>
    <DeviceConnectionModal :num-connected-devices="0"> </DeviceConnectionModal>
  </v-toolbar>
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
</style>
<script lang="ts">
import { IPC_CHANNELS } from "@/preload/IpcChannels";
// import { router } from "@/renderer/router";
import {
  DeviceStatus,
  GeneralSettingsActionTypes,
} from "@/renderer/store/modules/generalSettings/generalSettings";
import {
  RoomMutations,
  RoomState,
} from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import { useStore } from "@/renderer/store/store";
import { defineComponent } from "vue";
import { WebSocketAPI } from "@/main/WebSocketManager";
// import UserMenuTooltip from "@/renderer/components/UserMenuTooltip.vue";
// import DeviceConnectionModal from "@/renderer/components/DeviceConnectionModal.vue";
import CollaborationInteractionModeIndicator from "@/renderer/components/CollaborationInteractionModeIndicator.vue";
import { changeRecordMode } from "@/renderer/helpers/recordMode";
import { InteractionModeChange } from "@sharedTypes/roomTypes";
import DeviceConnectionModal from "@/renderer/components/DeviceConnectionModal.vue";

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
  }),
  computed: {
    numConnectedDevices(): number {
      return this.store.state.generalSettings.deviceList.filter((d) => {
        return d.state == DeviceStatus.connected;
      }).length;
    },
  },
  methods: {
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
    togglePlayback() {
      changeRecordMode(this.store, InteractionModeChange.togglePlayback);
    },
  },
});
</script>
