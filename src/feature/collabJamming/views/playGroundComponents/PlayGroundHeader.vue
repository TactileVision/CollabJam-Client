<template>
  <div
    class="v-row"
    id="headerPlayGround"
    :elevation="2"
    align="center"
    justify="start"
  >
    <span class="v-col text-h4"> {{ store.state.roomSettings.roomName }} </span>
    <!-- <v-spacer></v-spacer> -->
    <InteractionModeIndicator
      class="v-col"
      cols="1"
      :mode="store.state.roomSettings.mode"
    ></InteractionModeIndicator>
    <!-- <v-spacer></v-spacer> -->
    <div class="v-col">
      <UserTooltip :users="store.state.roomSettings.participants"></UserTooltip>
      <!-- <UserMenu /> -->
      <DeviceDialog :num-connected-devices="numConnectedDevices">
      </DeviceDialog>
      <v-btn
        color="primary"
        :disabled="store.state.roomSettings.mode != 1"
        prepend-icon="mdi-logout"
        @click="logOut"
        >Log out</v-btn
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.headerPlayGround {
  min-width: 100% !important;
  max-width: 100% !important;
  border-bottom: 1px solid rgb(48, 41, 41);
  min-height: 50px;
  padding: 2px 10px;
  display: block;
}
</style>
<script lang="ts">
import { IPC_CHANNELS } from "@/core/IPC/IpcChannels";
// import { router } from "@/app/router";
import {
  DeviceStatus,
  GeneralSettingsActionTypes,
} from "@/app/store/modules/generalSettings/generalSettings";
import {
  RoomMutations,
  RoomState,
} from "@/feature/collabJamming/store/roomSettings/roomSettings";
import { useStore } from "@/app/store/store";
import { defineComponent } from "@vue/runtime-core";
import { sendSocketMessage } from "@/core/WebSocketManager";
import UserTooltip from "./UserMenu/UserTooltip.vue";
import DeviceDialog from "@/core/Ble/renderer/views/DeviceDialog.vue";
import { WS_MSG_TYPE } from "@sharedTypes/websocketTypes";
import InteractionModeIndicator from "@/feature/collabJamming/views/playGroundComponents/InteractionModeIndicator.vue";

export default defineComponent({
  name: "PlayGroundHeader",
  components: {
    UserTooltip,
    DeviceDialog,
    InteractionModeIndicator,
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
      const s = useStore();
      // s.dispatch(TactonPlaybackActionTypes.deselectTacton)
      sendSocketMessage(WS_MSG_TYPE.LOG_OUT, {
        roomId: this.store.state.roomSettings.id,
        user: this.store.state.roomSettings.user,
      });
      this.$router.push("/");
    },
    copyAdress() {
      console.log(this.store.getters);
      this.store.dispatch(GeneralSettingsActionTypes.copyAdressToClipboard);
      window.api.send(
        IPC_CHANNELS.main.copyToClipBoard,
        `${this.store.state.roomSettings.roomName}#${this.store.state.roomSettings.id}`,
      );
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
