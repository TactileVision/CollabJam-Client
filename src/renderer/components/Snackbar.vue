<template>
  <div class="text-center">
    <v-snackbar v-model="snackbar" timeout="2000" class="d-flex">
      {{ text }}
      <template #actions>
        <v-btn
          color="primary"
          variant="text"
          @click="snackbar = false"
          icon="mdi-close"
        >
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss"></style>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "SnackBar",
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      snackbar: false,
    };
  },
  watch: {
    text(newValue) {
      if (newValue) {
        this.snackbar = true;
      }
    },
  },
});
</script>
