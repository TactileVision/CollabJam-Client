<template>
  <v-alert v-if="deviceList.length == 0" type="warning" variant="tonal">
    Please connect a tactile display to use this feature.
  </v-alert>
  <div>
    <div v-for="item in deviceList" :key="item.info.id" style="padding: 0">
      <h3>{{ item.info.name }}</h3>
      <edit-parameter :display="item"></edit-parameter>
    </div>
  </div>
</template>

<style scoped lang="scss">
// .overflow-wrapper {
// 	overflow: scroll;
// 	height: 100vh;
// }
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/renderer/store/store";
import { TactileDisplay } from "@/renderer/store/modules/DeviceManager/DeviceManagerStore";

export default defineComponent({
  name: "ChannelParameter",
  components: {},
  data() {
    return {
      store: useStore(),
    };
  },
  computed: {
    deviceList(): TactileDisplay[] {
      return this.store.state.deviceManager.connectedTactileDisplays;
    },
  },
});
</script>
