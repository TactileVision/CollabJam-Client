<template>
  <v-checkbox
    :label="name"
    v-model="muted"
    @change="updateMuteStatus"
  ></v-checkbox>
</template>

<style lang="scss" scoped></style>

<script lang="ts">
import { defineComponent } from "vue";
import { User } from "@sharedTypes/roomTypes";

export default defineComponent({
  name: "ParticipantControls",
  props: {
    participant: {
      type: Object as () => User,
      required: true,
    },
  },
  data() {
    return {
      muted: this.participant.muted,
    };
  },
  emits: ["muted", "unmuted"],
  computed: {
    name() {
      return this.participant.name || "Unnamed user";
    },
  },
  methods: {
    updateMuteStatus() {
      const event = this.muted ? "muted" : "unmuted";
      this.$emit(event, { ...this.participant, muted: this.muted });
    },
  },
});
</script>
