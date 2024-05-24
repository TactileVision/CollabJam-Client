<template>
  <!--MARK: Recording-->
  <!-- <v-sheet class="pa-1"> -->
  <!-- <div class="text-overline">Create Tacton</div> -->
  <v-list
    lines="one"
    class="selection-list"
    color="primary"
    density="compact"
    :disabled="!enabled"
  >
    <v-list-item
      v-for="server in servers"
      :key="server.name"
      :title="server.name"
      :active="server.url == selection"
      @click="selectServer(server.url)"
    >
    </v-list-item>
  </v-list>
</template>

<style lang="scss" scoped>
.selection-list {
  height: 70vh;
}
</style>

<script lang="ts">
import { PropType, defineComponent } from "vue";
import { useStore } from "@/renderer/store/store";
import { RoomSettingsActionTypes } from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import { initWebsocket } from "@/main/WebSocketManager";

export default defineComponent({
  name: "ServerSelectionList",
  props: {
    servers: {
      type: Object as PropType<{ url: string; name: string }[]>,
      required: true,
    },
    enabled: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      store: useStore(),
      selection: null as null | string,
    };
  },
  computed: {},
  methods: {
    selectServer: function (url: string) {
      this.selection = url;
      this.store.dispatch(RoomSettingsActionTypes.setAvailableRoomList, {
        rooms: [],
      });
      initWebsocket(this.store, url);
      console.log(url);
    },
  },
});
</script>
