<!-- Component for the setup -->
<!-- display metadata of the room, connecting with vibrotactile device -->

<template>
  <v-container class="SetupRoomView">
    <v-row class="subRow title">
      {{ `${store.state.roomSettings.roomState} Room` }}
    </v-row>
    <v-row class="subRow">
      <v-col cols="2" style="paddingtop: 25px; paddingleft: 60px">Name</v-col>
      <v-col cols="5">
        <v-text-field
          disabled
          variant="underlined"
          hide-details="auto"
          no-resize
          v-model="roomName"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row class="subRow">
      <v-col cols="2" style="paddingtop: 25px; paddingleft: 60px"
        >Description</v-col
      >
      <v-col cols="5">
        <v-textarea
          disabled
          variant="underlined"
          hide-details="auto"
          no-resize
          rows="3"
          v-model="description"
        ></v-textarea>
      </v-col>
    </v-row>
    <v-row class="subRow">
      <v-col cols="2" style="paddingtop: 25px; paddingleft: 60px"
        >Username</v-col
      >
      <v-col cols="5">
        <v-text-field
          variant="underlined"
          hide-details="auto"
          v-model="userName"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row class="subRow">
      <v-col cols="2" style="paddingtop: 25px; paddingleft: 60px"
        >Connected Device</v-col
      >
      <v-col cols="5">
        {{ store.getters.getConnectedDevice?.name }}
      </v-col>
    </v-row>
    <v-divider />
    <v-row class="expandRow">
      <v-col cols="4" style="border-right: 1px solid rgba(0, 0, 0, 0.2)">
        <v-row no-gutters class="subheader"> Participants section </v-row>
        <RoomParticipantList />
      </v-col>
      <v-col cols="8">
        <v-row>
          <v-row no-gutters class="subheader"> Device section </v-row>
          <DeviceConnectionModal />
        </v-row>
      </v-col>
    </v-row>
    <v-divider />
    <v-row class="subRow" style="margin: 20px">
      <v-col cols="6">
        <v-row>
          <v-btn elevation="2" color="primary" @click="cancelRoomEnter">
            {{
              store.state.roomSettings.roomState == configureState
                ? "Log Out"
                : "Cancel"
            }}
          </v-btn>
          <v-spacer />
          <v-btn elevation="2" color="primary" @click="enterRoom">
            {{
              store.state.roomSettings.roomState == configureState
                ? "Finish Configuration"
                : "Enter Room"
            }}
          </v-btn>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.SetupRoomView {
  display: flex;
  flex-direction: column;
  min-width: 100%;
  height: 100%;
  justify-content: center;
  font-size: 1.3em;
  flex-shrink: 0;
}

.title {
  justify-content: center;
  font-size: 1.5em;
  font-weight: bold;
  text-decoration: underline;
  padding-bottom: 20px;
}

.subheader {
  text-decoration: underline;
  justify-content: center;
  font-weight: bold;
  padding-bottom: 10px;
}

.subRow {
  flex: 0;
  margin: 0;
  justify-content: center;
}

.expandRow {
  margin: 0;
  flex-grow: 1;
  max-height: 50%;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/renderer/store/store";
import {
  RoomMutations,
  RoomState,
} from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import DeviceConnectionModal from "@/renderer/components/DeviceConnectionModal.vue";
import RoomParticipantList from "@/renderer/components/RoomParticipantList.vue";
import { WebSocketAPI } from "@/main/WebSocketManager";
import { RequestUpdateUser } from "@sharedTypes/websocketTypes";
import { IPC_CHANNELS } from "@/preload/IpcChannels";

export default defineComponent({
  name: "SetupRoomView",
  components: {
    DeviceConnectionModal,
    RoomParticipantList,
  },
  data() {
    return {
      store: useStore(),
      configureState: RoomState.Configure,
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
    description: {
      get(): string {
        return this.store.state.roomSettings.description;
      },
      set(value: string) {
        this.store.commit(RoomMutations.UPDATE_ROOM_DESCRIPTION, value);
      },
    },
    userName: {
      get(): string {
        return this.store.state.roomSettings.user.name;
      },
      set(value: string) {
        this.store.commit(RoomMutations.UPDATE_USER_NAME, value);
      },
    },
  },
  methods: {
    cancelRoomEnter() {
      window.api.send(IPC_CHANNELS.main.changeScan, { scanStatus: false });
      WebSocketAPI.logOut({
        roomId: this.store.state.roomSettings.id,
        user: this.store.state.roomSettings.user,
      } as RequestUpdateUser);

      this.$router.push("/rooms");
    },
    enterRoom() {
      window.api.send(IPC_CHANNELS.main.changeScan, { scanStatus: false });
      window.api.send(IPC_CHANNELS.main.saveUserName, {
        userName: this.userName,
      });
      console.log(this.store.state.roomSettings.roomState);
      if (this.store.state.roomSettings.roomState == RoomState.Configure) {
        WebSocketAPI.updateRoom({
          room: {
            id: this.store.state.roomSettings.id || "",
            name: this.store.state.roomSettings.roomName,
            description: this.description,
          },
          user: this.store.state.roomSettings.user,
        });
      } else {
        console.log("Entering room");

        WebSocketAPI.enterRoom({
          id: this.store.state.roomSettings.id || "",
          userName: this.userName,
        });
        this.$router.push("/playGround");
      }
    },
  },
});
</script>
