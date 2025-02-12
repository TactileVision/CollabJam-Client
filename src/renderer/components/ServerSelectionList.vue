<template>
  <!--MARK: Recording-->
  <!-- <v-sheet class="pa-1"> -->
  <!-- <div class="text-overline">Create Tacton</div> -->
  <v-list
    lines="one"
    color="primary"
    density="compact"
    :disabled="!enabled"
  >
    <v-tooltip 
        v-for="server in servers" 
        :text="server.url"
        location="top"
    >
      <template v-slot:activator="{ props }">
        <v-list-item
            v-bind="props"
            :key="server.name"
            :title="server.name"
            :active="server.url == selection"
            @click="selectServer(server.url)"
        >
        </v-list-item>
      </template>
    </v-tooltip>    
  </v-list>
</template>

<style lang="scss" scoped>

</style>

<script lang="ts">
import { PropType, defineComponent } from "vue";
import { useStore } from "@/renderer/store/store";
import { RoomMutations, RoomSettingsActionTypes } from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
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
    username: {
      type: String,
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
      if (this.selection == url) return;
      this.selection = url;
      this.store.dispatch(RoomSettingsActionTypes.setAvailableRoomList, {
        rooms: [],
      });
      initWebsocket(this.store, url);
      console.log(url);
      this.store.commit(RoomMutations.UPDATE_USER_NAME, this.username);
      this.$router.push("/roomView");
    },
  },
});
</script>
