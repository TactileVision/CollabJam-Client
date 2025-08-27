<!-- Component for the playGround -->
<!-- display the time profiles and the buttons to control the vibrotactile device -->
<template>
    <CollaborationHeader 
      :show-display-configurator="showDisplayConfigurator"
      @update:show-display-configurator="showDisplayConfigurator = $event;"
    />
    <TheTimeline></TheTimeline>
    <ConfigurationDrawer
      v-model="showDisplayConfigurator"
    />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CollaborationHeader from "@/renderer/components/CollaborationHeader.vue";
import { ref } from 'vue'
import TheTimeline from "@/renderer/components/TheTimeline.vue";
import ConfigurationDrawer from "@/displayConfigurator/components/ConfigurationDrawer.vue";
export default defineComponent({
  name: "CollaborationView",
  components: {
    ConfigurationDrawer,
    TheTimeline,
    CollaborationHeader,
  },
  data() {
    return {
      showDisplayConfigurator: ref(false)
    }
  }
});
</script>
