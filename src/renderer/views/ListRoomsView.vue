<!-- Component for the room -->
<!-- input field to enter a name or adress of the room -->

<template>
  <!--iconBar-->
  <v-navigation-drawer width="50">
    <div class="d-flex flex-column ga-2">
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
      <v-tooltip text="show roomlist" open-delay="500">
        <template #activator="{ props }">
          <v-btn
              v-bind="props"
              :color="tactonDrawer ? 'primary' : 'secondary'"
              variant="plain"
              :icon="tactonDrawer ? 'mdi-playlist-check' : 'mdi-playlist-remove'"
              @click="tactonDrawer = !tactonDrawer"
          >
          </v-btn>
        </template>
      </v-tooltip>
    </div>
  </v-navigation-drawer>
  <!--roomList-->
  <v-navigation-drawer width="150" v-model="roomDrawer">
    <v-container>
      <h6 class="text-h6">Rooms</h6>
    </v-container>
    <RoomSelectionList v-model="room"></RoomSelectionList>
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
  <!--tactonList-->
  <v-navigation-drawer width="350" v-model="tactonDrawer">
    <TactonSelectionList></TactonSelectionList>
  </v-navigation-drawer>
  <div class="roomView">
    <v-row align="center" justify="center">
      <!-- <v-container> -->
      <v-col style="padding: 0">
        <CollaborationView></CollaborationView>
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
import RoomSelectionList from "@/renderer/components/RoomSelectionList.vue";
import { Room } from "@/shared/types/roomTypes";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import CollaborationView from "./CollaborationView.vue";
import { TactonPlaybackActionTypes } from "../store/modules/collaboration/tactonPlayback/tactonPlayback";
import SnackBar from "@/renderer/components/Snackbar.vue";
import { writeAmplitudeOnDisplay } from "../helpers/TactileDisplayActions";
import ParticipantSettings from "@/renderer/components/ParticipantSettings.vue";
import TactonSelectionList from "@/renderer/components/TactonSelectionList.vue";
// import SetupRoomView from "./SetupRoomView.vue";
export default defineComponent({
  name: "RoomView",
  components: {
    TactonSelectionList,
    SnackBar,
    // DeviceConnectionModal,
    RoomSelectionList,
    CollaborationView,
    ParticipantSettings,
  },
  data() {
    return {
      room: null as null | Room,
      store: useStore(),
      servers: JSON.parse(import.meta.env.VITE_COLLABJAM_SERVERS || "[]"),
      roomDrawer: true,
      tactonDrawer: true,
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
    userName(): string {
      return this.store.state.roomSettings.user.name;
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

      if (hideGraph) {
        // logOut
        this.$router.push("/");
      } else {
        // switch room
        this.$router.push("/roomView");
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
