<!-- Component for the playGround -->
<!-- display the time profiles and the buttons to control the vibrotactile device -->
<template>
    <CollaborationHeader 
      :show-display-configurator="showDisplayConfigurator"
      @update:showDisplayConfigurator="showDisplayConfigurator = $event;"
    />
    <TheTimeline></TheTimeline>
    <v-navigation-drawer
      v-model="showDisplayConfigurator"
      location="right"
      width="300"
      permanent
    >
      Drawer-Inhalt
    </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CollaborationBody from "@/renderer/components/CollaborationBody.vue";
import CollaborationHeader from "@/renderer/components/CollaborationHeader.vue";
import { ref } from 'vue'
import TheTimeline from "@/renderer/components/TheTimeline.vue";
export default defineComponent({
  name: "CollaborationView",
  components: {
    TheTimeline,
    CollaborationBody,
    CollaborationHeader,
  },
  data() {
    return {
      showDisplayConfigurator: ref(false)
    }
  }
});
</script>
