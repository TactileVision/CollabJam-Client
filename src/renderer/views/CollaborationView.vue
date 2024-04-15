<!-- Component for the playGround -->
<!-- display the time profiles and the buttons to control the vibrotactile device -->
<template>
  <CollaborationHeader />
  <CollaborationBody />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CollaborationBody from "@/renderer/components/CollaborationBody.vue";
import CollaborationHeader from "@/renderer/components/CollaborationHeader.vue";

export default defineComponent({
  name: "CollaborationView",
  components: {
    CollaborationBody,
    CollaborationHeader,
  },
});
</script>
