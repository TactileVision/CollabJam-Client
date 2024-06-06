<!-- Component for the room -->
<!-- input field to enter a name or adress of the room -->

<template>
  <!--iconBar-->
  <v-navigation-drawer width="50">
    <div class="d-flex flex-column ga-2">
      <v-tooltip text="show serverlist" open-delay="500">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            :color="serverDrawer ? 'primary' : 'secondary'"
            variant="plain"
            icon="mdi-server-outline"
            @click="serverDrawer = !serverDrawer"
          >
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip text="show roomlist" open-delay="500">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            :color="roomDrawer ? 'primary' : 'secondary'"
            variant="plain"
            :icon="roomDrawer ? 'mdi-chevron-left' : 'mdi-chevron-right'"
            @click="roomDrawer = !roomDrawer"
          >
          </v-btn>
        </template>
      </v-tooltip>
    </div>
  </v-navigation-drawer>
  <!--serverList-->
  <v-navigation-drawer width="150" v-model="serverDrawer">
    <v-container>
      <h6 class="text-h6">Server</h6>
    </v-container>
    <ServerSelectionList
      :servers="servers"
      :enabled="!loggedIn"
    ></ServerSelectionList>
  </v-navigation-drawer>
  <!--roomList-->
  <v-navigation-drawer
    width="150"
    v-model="roomDrawer"
    :style="roomDrawer && serverDrawer ? 'left: 200px' : 'left: 50px'"
  >
    <v-container>
      <h6 class="text-h6">Rooms</h6>
    </v-container>
    <RoomSelectionList
      v-model="room"
      :enabled="userName != ''"
    ></RoomSelectionList>
    <ParticipantSettings></ParticipantSettings>

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
  <div class="roomView">
    <v-row align="center" justify="center">
      <!-- <v-container> -->
      <v-col style="padding: 0">
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
  <SnackBar :text="snackbarText"></SnackBar>
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
import ServerUserSetup from "@/renderer/components/ServerUserSetup.vue";
import { Room } from "@/shared/types/roomTypes";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import CollaborationView from "./CollaborationView.vue";
import { TactonPlaybackActionTypes } from "../store/modules/collaboration/tactonPlayback/tactonPlayback";
import SnackBar from "@/renderer/components/Snackbar.vue";
import { writeAmplitudeOnDisplay } from "../helpers/TactileDisplayActions";
import ParticipantSettings from "@/renderer/components/ParticipantSettings.vue";
// import SetupRoomView from "./SetupRoomView.vue";
export default defineComponent({
  name: "RoomView",
  components: {
    SnackBar,
    // DeviceConnectionModal,
    ServerSelectionList,
    RoomSelectionList,
    ServerUserSetup,
    CollaborationView,
    ParticipantSettings,
  },
  data() {
    return {
      room: null as null | Room,
      userName: "",
      store: useStore(),
      servers: [
        {
          url: "https://itactjam.informatik.htw-dresden.de/",
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
      serverDrawer: true,
      roomDrawer: true,
      snackbarText: "",
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
      console.log("Room updated");
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

      //TODO Turn off displays
      this.clearGraph();
      this.store.state.deviceManager.connectedTactileDisplays.forEach((td) => {
        console.log(td);
        writeAmplitudeOnDisplay(
          td.info.id,
          [...Array(td.numOfOutputs).keys()],
          0,
        );
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
      this.snackbarText = "Entered Room: " + this.room?.name;
    },
  },
});
</script>
