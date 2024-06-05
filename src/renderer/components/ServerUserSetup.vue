<template>
  <h3>Server Setup</h3>
  <v-text-field
    label="Username"
    hide-details="auto"
    v-model="username"
    :rules="[rules.required]"
    :disabled="inputsDisabled"
  ></v-text-field>
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
    return {
      rules: {
        required: (value) => !!value || "Required.",
      },
    };
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
