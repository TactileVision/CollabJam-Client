<template>
  <h1>Connect to device</h1>
  <DeviceConnectionTable></DeviceConnectionTable>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DeviceConnectionTable from "../components/DeviceConnectionTable.vue";

export default defineComponent({
  name: "DeviceConnectionView",
  components: { DeviceConnectionTable },
});
</script>
