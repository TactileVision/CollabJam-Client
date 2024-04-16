<template>
  <div class="indicator px-16 py-4 ma-2 text-uppercase">
    <v-icon :color="getColor()" :icon="getIcon()"></v-icon>
    {{ getModeString() }}
  </div>
  <!-- <v-chip :prepend-icon="getIcon()" :color="getColor()" class="px-16 py-4 ma-2 text-uppercase"> -->
  <!-- </v-chip> -->
</template>

<style lang="scss" scoped>
.indicator {
  border-radius: 999px;
}
</style>

<script lang="ts">
import { InteractionMode } from "@sharedTypes/roomTypes";
import { defineComponent } from "vue";
import { PropType } from "vue";

export default defineComponent({
  name: "CollaborationInteractionModeIndicator",
  props: {
    mode: {
      type: Number as PropType<InteractionMode>,
      required: true,
    },
  },
  data() {
    return {};
  },
  computed: {
    setColor(): { backgroundColor: string } {
      return { backgroundColor: this.getColor() };
    },
  },
  methods: {
    getIcon() {
      switch (this.mode) {
        case InteractionMode.Jamming:
          return "mdi-piano";
        case InteractionMode.Recording:
          return "mdi-record";
        case InteractionMode.Playback:
          return "mdi-play";
        default:
          return "Unkwown";
      }
    },
    getColor() {
      switch (this.mode) {
        case InteractionMode.Jamming:
          return "";
        case InteractionMode.Recording:
          return "red";
        case InteractionMode.Playback:
          return "secondary";
        default:
          return "Unkwown";
      }
    },

    getModeString() {
      switch (this.mode) {
        case InteractionMode.Jamming:
          return "Jamming";
        case InteractionMode.Recording:
          return "Recording";
        case InteractionMode.Playback:
          return "Playback";
        default:
          return "Unkwown";
      }
    },
  },
});
</script>
