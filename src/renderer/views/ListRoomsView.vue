<!-- Component for the room -->
<!-- input field to enter a name or adress of the room -->

<template>
  <div class="roomView">
    <v-row align="center" justify="center" style="margin-top: 40px">
      <v-btn elevation="2" color="primary" @click="getRooms"
        >Update Room List</v-btn
      >
      <v-list lines="one">
        <v-list-item
          v-for="room of store.state.roomSettings.availableRooms"
          :key="room.id"
          @click="enterRoom(room.id)"
          :title="room.name"
        >
        </v-list-item>
      </v-list>
    </v-row>
  </div>
</template>

<style lang="scss" scoped>
.roomView {
  align-items: center;
  display: flex;
  height: 100%;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/renderer/store/store";
import { RoomMutations } from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import { WebSocketAPI } from "@/main/WebSocketManager";
export default defineComponent({
  name: "RoomView",
  data() {
    return {
      userName: "",
      store: useStore(),
    };
  },
  computed: {
    roomName: {
      get(): string {
        return this.store.state.roomSettings.roomName;
      },
      set(value: string) {
        this.store.commit(RoomMutations.UPDATE_ROOM_NAME, value);
      },
    },
  },
  methods: {
    getRooms() {
      WebSocketAPI.requestAvailableRooms();
    },
    enterRoom(roomId: string) {
      WebSocketAPI.getRoomInfos(roomId);
      this.$router.push("/setup");
    },
  },
});
</script>
