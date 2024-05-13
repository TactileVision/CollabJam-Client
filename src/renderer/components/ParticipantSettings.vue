<template>
  <h3>Participants</h3>
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
      return this.store.state.roomSettings.participants;
    },
  },
  methods: {
    muteParticipant(participant: User) {
      this.store.dispatch(RoomSettingsActionTypes.muteParticipant, {
        participant,
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
