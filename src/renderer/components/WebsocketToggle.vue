<template>
  <v-switch
    :disabled="isLocked"
    v-model="goOnline"
    color="primary"
    :label="goOnline ? 'Remote' : 'Local'"
    inset
  ></v-switch>
</template>
<script lang="ts">
import { initWebsocket } from "@/main/WebSocketManager";
import { defineComponent } from "vue";
import { useStore } from "vuex";
import { RouterNames } from "../router/Routernames";
import { RoomSettingsActionTypes } from "../store/modules/collaboration/roomSettings/roomSettings";
export default defineComponent({
  name: "WebsocketToggle",
  data: function () {
    return {
      goOnline: false,
      store: useStore(),
    };
  },
  computed: {
    currentRouteName() {
      return this.$route.name;
    },
    isLocked() {
      return (
        this.currentRouteName == RouterNames.SETUP ||
        this.currentRouteName == RouterNames.PLAY_GROUND
      );
    },
  },
  props: {
    localUrl: {
      type: String,
      required: true,
    },
    remoteUrl: {
      type: String,
      required: true,
    },
  },
  watch: {
    goOnline: function () {
      this.store.dispatch(RoomSettingsActionTypes.setAvailableRoomList, {
        rooms: [],
      });
      initWebsocket(this.goOnline ? this.remoteUrl : this.localUrl);
    },
  },
});
</script>
