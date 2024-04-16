<template>
  <v-toolbar :title="store.state.roomSettings.roomName">
    <CollaborationInteractionModeIndicator
      class="v-col"
      cols="1"
      :mode="store.state.roomSettings.mode"
    ></CollaborationInteractionModeIndicator>
    <UserMenuTooltip
      :users="store.state.roomSettings.participants"
    ></UserMenuTooltip>
    <!-- <UserMenu /> -->
    <DeviceConnectionModal :num-connected-devices="numConnectedDevices">
    </DeviceConnectionModal>
    <v-btn
      color="primary"
      :disabled="store.state.roomSettings.mode != 1"
      prepend-icon="mdi-logout"
      @click="logOut"
      >Log out</v-btn
    >
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
import { sendSocketMessage } from "@/main/WebSocketManager";
import UserMenuTooltip from "@/renderer/components/UserMenuTooltip.vue";
import DeviceConnectionModal from "@/renderer/components/DeviceConnectionModal.vue";
import { WS_MSG_TYPE } from "@sharedTypes/websocketTypes";
import CollaborationInteractionModeIndicator from "@/renderer/components/CollaborationInteractionModeIndicator.vue";

export default defineComponent({
  name: "CollaborationHeader",
  components: {
    UserMenuTooltip,
    DeviceConnectionModal,
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
      sendSocketMessage(WS_MSG_TYPE.LOG_OUT, {
        roomId: this.store.state.roomSettings.id,
        user: this.store.state.roomSettings.user,
      });
      this.$router.push("/");
    },
    copyAdress() {
      console.log(this.store.getters);
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
  },
});
</script>
