<template>
  <!-- <v-row justify="center"> -->
  <v-dialog v-model="dialog" persistent width="auto">
    <template #activator="{ props }">
      <v-btn
        prepend-icon="mdi-vibrate"
        :color="numConnectedDevices == 0 ? 'error' : 'primary'"
        v-bind="props"
      >
        <template v-if="numConnectedDevices">
          Tactile Displays ({{ numConnectedDevices }})
        </template>
        <template v-else> Tactile Displays </template>
      </v-btn>
    </template>
    <v-card min-width="1000px">
      <v-card-title class="text-h5"> Manage Tactile Displays </v-card-title>
      <DeviceConnectionTable></DeviceConnectionTable>
      <!-- <v-card-text>Let Google help apps determine location. This means sending anonymous location data to Google,
					even when no apps are running.</v-card-text> -->
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="dialog = false">
          Go Back
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- </v-row> -->
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DeviceConnectionTable from "./DeviceConnectionTable.vue";

export default defineComponent({
  name: "DeviceConnectionModal",
  props: {
    numConnectedDevices: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  data() {
    return {
      dialog: false,
    };
  },
  components: { DeviceConnectionTable },
});
</script>
