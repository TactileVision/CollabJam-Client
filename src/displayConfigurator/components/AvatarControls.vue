<template>
  <v-list>
    <v-list-group value="true" prepend-icon="mdi-account" title="Avatar">
      <template #activator="{ props }">
        <v-list-item v-bind="props" title="Avatar"></v-list-item>
      </template>

      <v-list-item>
        <div class="d-flex flex-row align-center" style="width: 100%; gap: 12px">
          <v-select
            :model-value="selectedModel"
            @update:model-value="$emit('update:selectedModel', $event)"
            :items="modelOptions"
            item-title="label"
            item-value="value"
            label="Model"
            density="comfortable"
            style="flex: 1 1 45%"
          />
          <v-select
            :model-value="selectedPose"
            @update:model-value="$emit('update:selectedPose', $event)"
            :items="poseOptions"
            item-title="label"
            item-value="value"
            label="Pose"
            density="comfortable"
            style="flex: 1 1 45%"
          />
          <v-btn
            @click="$emit('loadAvatar')"
            color="deep-orange-darken-1"
            :disabled="!selectedModel || !selectedPose"
            style="flex: 0 0 auto"
          >
            Load Avatar
          </v-btn>
        </div>
      </v-list-item>
    </v-list-group>
  </v-list>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  selectedModel: string
  selectedPose: string
  modelOptions: Array<{ label: string; value: string }>
  poseOptions: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  (e: 'loadAvatar'): void
  (e: 'update:selectedModel', val: string): void
  (e: 'update:selectedPose', val: string): void
}>()
</script>
