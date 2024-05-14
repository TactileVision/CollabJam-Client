<template>
  <h3>Mute Other Participants</h3>
  <ParticipantControls
    v-for="participant in participants"
    :key="participant.id"
    :participant="participant"
    @muted="muteParticipant"
    @unmuted="unmuteParticipant"
  />
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
      this.store.dispatch(RoomSettingsActionTypes.muteParticipant, {
        participant,
      });
      this.store.state.deviceManager.connectedTactileDisplays.forEach((d) => {
        writeAmplitudeToAllChannels(d, 0);
      });
    },
    unmuteParticipant(participant: User) {
      this.store.dispatch(RoomSettingsActionTypes.unmuteParticipant, {
        participant,
      });
    },
  },
});
</script>
