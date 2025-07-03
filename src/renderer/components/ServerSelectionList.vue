<template>
  <!--MARK: Recording-->
  <!-- <v-sheet class="pa-1"> -->
  <!-- <div class="text-overline">Create Tacton</div> -->
  <v-list lines="one" color="primary" density="compact" :disabled="!enabled">
    <v-list-item
      v-for="server in servers"
      :key="server.name"
      :active="server.url == selection"
      @click="selectServer(server.url)"
      :disabled="!server.online"
    >
      <v-row>
        <v-col cols="1">
          <v-icon
            :class="getStatusClass(server.online)"
            icon="mdi-circle"
          ></v-icon>
        </v-col>
        <v-col cols="3  ">
          <p class="server-name">{{ server.name }}</p>
        </v-col>
        <v-col>
          <p>{{ server.url + (server.port ? `:${server.port}` : "") }}</p>
        </v-col>
      </v-row>
    </v-list-item>
  </v-list>
</template>

<style lang="scss" scoped>
.server-name {
  font-size: 16px;
  font-weight: 600;
}

.dot-green {
  color: green;
}
.dot-red {
  color: red;
}
.dot-grey {
  color: grey;
}
</style>

<script lang="ts">
import { PropType, defineComponent } from "vue";
import { useStore } from "@/renderer/store/store";
import {
  RoomMutations,
  RoomSettingsActionTypes,
} from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import { initWebsocket } from "@/main/WebSocketManager";

export default defineComponent({
  name: "ServerSelectionList",
  props: {
    servers: {
      type: Object as PropType<
        {
          url: string;
          port: number | null;
          name: string;
          online: boolean | null;
        }[]
      >,
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
      initWebsocket(url);
      this.store.commit(RoomMutations.UPDATE_USER_NAME, this.username);
      this.$router.push("/roomView");
    },
    getStatusClass(isOnline: boolean | null) {
      switch (isOnline) {
        case true:
          return "dot-green";
        case false:
          return "dot-red";
        case null:
          return "dot-grey";
      }
    },
  },
});
</script>
