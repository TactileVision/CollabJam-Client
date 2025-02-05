<template>
  <!--<h3>Server Setup</h3>-->
  <v-text-field
    label="Username"
    hide-details="auto"
    v-model="username"
    :disabled="inputsDisabled"
  ></v-text-field>
  <v-alert v-if="username.length == 0" type="warning" variant="tonal">
    Please enter a name
  </v-alert>
</template>

<style scoped lang="scss"></style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ServerUserSetup",
  props: {
    modelValue: { type: String, required: true },
    inputsDisabled: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {};
  },
  computed: {
    username: {
      get: function () {
        return this.modelValue;
      },
      set: function (value: string) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  watch: {},
  methods: {},
});
</script>
