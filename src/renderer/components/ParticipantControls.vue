<template>
  <v-checkbox
    :true-icon="'mdi-access-point-off'"
    :false-icon="'mdi-access-point'"
    :hide-details="true"
    :model-value="participant.muted"
    @change="updateMuteStatus"
    :color="participant.color"
    :base-color="participant.color"
  >
    <template #label>
      <div :style="`color:${participant.color}`" style="margin-left: 8px">
        {{ name }}
      </div>
    </template>
  </v-checkbox>
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
  emits: ["muted", "unmuted"],
  computed: {
    name() {
      return this.participant.name || "Unnamed user";
    },
  },
  methods: {
    updateMuteStatus() {
      const event = this.participant.muted ? "unmuted" : "muted";
      this.$emit(event, this.participant);
    },
  },
});
</script>
