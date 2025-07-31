<template>
  <v-card>
    <v-card-title>Participants</v-card-title>
    <v-card-item>
      <ParticipantControls
        v-for="participant in participants"
        :key="participant.id"
        :participant="participant"
        @muted="muteParticipant"
        @unmuted="unmuteParticipant"
      />
    </v-card-item>
    <v-card-actions>
      <v-btn
        v-if="!isAllMuted"
        color="primary"
        variant="tonal"
        @click="muteAllParticipants"
        text="Mute All"
        width="100%"
      />
      <v-btn
        v-if="isAllMuted"
        color="primary"
        variant="tonal"
        @click="unmuteAllParticipants"
        text="Unmute All"
        width="100%"
      />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { useStore } from "@/renderer/store/store";
import { defineComponent } from "vue";
import ParticipantControls from "./ParticipantControls.vue";
import { User } from "@sharedTypes/roomTypes";
import { RoomSettingsActionTypes } from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import { writeAmplitudeToAllChannels } from "../helpers/TactileDisplayActions";

export default defineComponent({
  name: "ParticipantSettings",
  components: { ParticipantControls },
  data() {
    return {
      store: useStore(),
      isAllMuted: false,
    };
  },
  computed: {
    participants(): User[] {
      return this.store.state.roomSettings.participants.filter(
        (p) => p.id != this.store.state.roomSettings.user.id,
      );
    },
  },
  methods: {
    muteParticipant(participant: User) {
      if(participant.muted) return;

      this.store.dispatch(RoomSettingsActionTypes.muteParticipant, {
        participant,
      });
      this.store.state.deviceManager.connectedTactileDisplays.forEach((d) => {
        writeAmplitudeToAllChannels(d, 0);
      });
    },
    unmuteParticipant(participant: User) {
      if(!participant.muted) return;

      this.store.dispatch(RoomSettingsActionTypes.unmuteParticipant, {
        participant,
      });
    },
    muteAllParticipants() {
      this.participants.forEach(this.muteParticipant);
      this.isAllMuted = true;
    },
    unmuteAllParticipants() {
      this.participants.forEach(this.unmuteParticipant);
      this.isAllMuted = false;
    }
  },
});
</script>
