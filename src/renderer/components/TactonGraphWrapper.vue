<template>
  <TactonGraph :is-mounted="isMounted" />
</template>

<style scoped="scss"></style>

<script lang="ts">
import { defineComponent } from "vue";
import TactonGraph from "./TactonGraph.vue";

export default defineComponent({
  name: "TactonGraphWrapper",
  components: { TactonGraph /* PixiTest */ /*TactonSelectionList */ },
  props: {
    isMounted: {
      type: Boolean,
    },
  },
});
</script>
