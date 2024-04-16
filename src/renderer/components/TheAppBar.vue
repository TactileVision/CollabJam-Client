<template>
  <v-app-bar id="appBar" :elevation="1">
    <!-- <v-btn icon="mdi-home" @click="go('/')"> </v-btn> -->
    <v-app-bar-title> Collaborative Tacton Design </v-app-bar-title>
    <!-- <v-btn icon="mdi-devices" @click="go('/devices')"> </v-btn> -->
  </v-app-bar>
</template>
<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "AppBar",
  // components: { DeviceDialog },
  data: () => ({}),
  methods: {
    go(path: string) {
      this.$router.push(path);
    },
  },
});
</script>
