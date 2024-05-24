<!-- Component for the room -->
<!-- input field to enter a name or adress of the room -->

<template>
  <div class="roomView">
    <v-row align="center" justify="center">
      <!-- <v-container> -->     
      <v-navigation-drawer width="150">
        <v-container>
          <h6 class="text-h6">Server</h6>
        </v-container>
        <ServerSelectionList
          :servers="servers"
          :enabled="!loggedIn"
        ></ServerSelectionList>
      </v-navigation-drawer>
      <v-navigation-drawer width="150">
        <v-container>
          <h6 class="text-h6">Rooms</h6>
        </v-container>
        <RoomSelectionList v-model="room"></RoomSelectionList>
        <!-- MARK: Setup -->

        <!-- <UserMenuTooltip
          :users="store.state.roomSettings.participants"
        ></UserMenuTooltip> -->
        <!-- <UserMenu /> -->
        <v-container style="display: flex; justify-content: center">
          <v-btn
              color="primary"
              variant="tonal"
              :disabled="store.state.roomSettings.mode != 1"
              prepend-icon="mdi-logout"
              @click="logOut(true)"
              text="Log out"
          >
          </v-btn>
        </v-container>       
        <!-- <v-btn v-if="room != null" @click="enterRoom">ENTER</v-btn> -->
      </v-navigation-drawer>
      <v-col>
        <CollaborationView
          v-if="store.state.roomSettings.roomState == 'Enter'"
        ></CollaborationView>
        <div v-else>
          <v-alert type="warning" variant="tonal">
            Select a server and a room to start Jamming
          </v-alert>
          <ServerUserSetup
            v-model="userName"
            :inputs-disabled="false"
          ></ServerUserSetup>
        </div>
      </v-col>
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
import {
  RoomMutations,
  RoomState,
} from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import { WebSocketAPI } from "@/main/WebSocketManager";
import ServerSelectionList from "@/renderer/components/ServerSelectionList.vue";
import RoomSelectionList from "@/renderer/components/RoomSelectionList.vue";
import RoomInformation from "@/renderer/components/RoomInformation.vue";
import ServerUserSetup from "@/renderer/components/ServerUserSetup.vue";
import { Room } from "@/shared/types/roomTypes";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import CollaborationView from "./CollaborationView.vue";
import DeviceConnectionModal from "../components/DeviceConnectionModal.vue";
import { TactonPlaybackActionTypes } from "../store/modules/collaboration/tactonPlayback/tactonPlayback";
// import SetupRoomView from "./SetupRoomView.vue";
export default defineComponent({
  name: "RoomView",
  components: {
    DeviceConnectionModal,
    ServerSelectionList,
    RoomSelectionList,
    RoomInformation,
    ServerUserSetup,
    CollaborationView,
  },
  data() {
    return {
      room: null as null | Room,
      userName: "",
      store: useStore(),
      servers: [
        {
          url: "wss://itactjam.informatik.htw-dresden.de/whws",
          name: "HTW",
        },
        {
          url: "ws://141.56.185.46:3333/",
          name: "Alex MBP",
        },
        {
          url: "ws://localhost:3333/",
          name: "Local",
        },
      ],
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
    loggedIn(): boolean {
      return this.room != null;
    },
  },
  watch: {
    room() {
      console.log(this.room);

      if (this.room == null) return;
      this.enterRoom(this.room.id);
    },
  },
  methods: {
    // setRoomSelection(room: Room) {
    //   this.room = room;
    // },
    getRooms() {
      WebSocketAPI.requestAvailableRooms();
    },
    logOut(hideGraph: boolean) {
      WebSocketAPI.logOut({
        roomId: this.store.state.roomSettings.id as string,
        user: this.store.state.roomSettings.user,
      });
      this.store.commit(RoomMutations.UPDATE_PARTICIPANTS, []);
      if (hideGraph) {
        this.store.commit(RoomMutations.UPDATE_ROOM_STATE, RoomState.Create);
        this.room = null;
      }
    },
    clearGraph() {
      this.store.dispatch(TactonPlaybackActionTypes.deselectTacton);
    },
    enterRoom(roomId: string) {
      this.clearGraph();
      window.api.send(IPC_CHANNELS.main.changeScan, { scanStatus: false });
      this.logOut(false);
      // window.api.send(IPC_CHANNELS.main.saveUserName, {
      //   userName: this.userName,
      // });
      WebSocketAPI.enterRoom({
        id: roomId,
        userName: this.userName,
      });
    },
  },
});
</script>
