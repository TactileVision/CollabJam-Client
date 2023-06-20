<template>
  <v-app-bar id="headerPlayGround" :elevation="2">
    <!-- <template v-slot:prepend>
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
    </template> -->

    <v-app-bar-title>
      {{ store.state.roomSettings.roomName }}
    </v-app-bar-title>
    <v-spacer></v-spacer>
    <InteractionModeIndicator :mode="store.state.roomSettings.mode"></InteractionModeIndicator>
    <v-spacer></v-spacer>
    <template v-slot:append>
      <UserTooltip :users="store.state.roomSettings.participants"></UserTooltip>
      <!-- <UserMenu /> -->
      <DeviceDialog :num-connected-devices="numConnectedDevices">
      </DeviceDialog>
      <v-btn color="primary" prepend-icon="mdi-logout" @click="logOut">Log out</v-btn>
    </template>
  </v-app-bar>
</template>

<style lang="scss" scoped>
.headerPlayGround {
  min-width: 100% !important;
  max-width: 100% !important;
  border-bottom: 1px solid rgb(48, 41, 41);
  min-height: 50px;
  padding: 2px 10px;
  display: flex;
}
</style>
<script lang="ts">
import { IPC_CHANNELS } from "@/electron/IPCMainManager/IPCChannels";
import router from "@/renderer/router";
import { DeviceStatus, GeneralSettingsActionTypes } from "@/renderer/store/modules/generalSettings/generalSettings";
import {
  RoomMutations,
  RoomState,
} from "@/renderer/store/modules/roomSettings/roomSettings";
import { useStore } from "@/renderer/store/store";
import { defineComponent } from "@vue/runtime-core";
import { sendSocketMessage } from "../../CommunicationManager/WebSocketManager";
import UserTooltip from "./UserMenu/UserTooltip.vue";
import DeviceDialog from "@/renderer/views/DeviceDialog.vue";
import { WS_MSG_TYPE } from "@sharedTypes/websocketTypes";
import InteractionModeIndicator from "@/renderer/components/playGroundComponents/InteractionModeIndicator.vue"
export default defineComponent({
  name: "PlayGroundHeader",
  components: {
    UserTooltip,
    DeviceDialog,
    InteractionModeIndicator
  },
  data: () => ({
    store: useStore(),
  }),
  computed: {
    numConnectedDevices(): number {
      return this.store.state.generalSettings.deviceList.filter(d => { return d.state == DeviceStatus.connected }).length
    }
  },
  methods: {
    logOut() {
      sendSocketMessage(WS_MSG_TYPE.LOG_OUT, {
        roomId: this.store.state.roomSettings.id,
        user: this.store.state.roomSettings.user,
      });
      router.push("/");
    },
    copyAdress() {
      console.log(this.store.getters);
      this.store.dispatch(GeneralSettingsActionTypes.copyAdressToClipboard);
      window.api.send(
        IPC_CHANNELS.main.copyToClipBoard,
        `${this.store.state.roomSettings.roomName}#${this.store.state.roomSettings.id}`
      );
    },
    settings() {
      this.store.commit(RoomMutations.UPDATE_ROOM_STATE, RoomState.Configure);
      router.push("/setup");
    },
    devices() {
      router.push("/devices");
    },

  }

});
</script>
