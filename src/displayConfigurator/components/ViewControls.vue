<template>
  <v-list>
    <v-list-group value="true" prepend-icon="mdi-cog" title="View Controls">
      <template #activator="{ props }">
        <v-list-item v-bind="props" title="View Controls"></v-list-item>
      </template>

      <v-list-item>
        <div class="d-flex flex-row align-center justify-space-around" style="width: 100%">
          <v-switch
            :model-value="animateScene"
            @update:model-value="(val) => emit('update:animateScene', val)"
            color="deep-orange-darken-1"
            label="Animation"
          />
          <v-switch
            :model-value="orbitEnabled"
            @update:model-value="(val) => emit('update:orbitEnabled', val)"
            color="deep-orange-darken-1"
            label="Orbit Controls"
          />
          <v-switch
            :model-value="wireframeEnabled"
            @update:model-value="(val) => emit('update:wireframeEnabled', val)"
            color="deep-orange-darken-1"
            label="Wireframe"
          />
        </div>
      </v-list-item>

      <v-list-item>
        <v-btn @click="$emit('resetViewport')" color="deep-orange-darken-1"> Reset View </v-btn>
      </v-list-item>
    </v-list-group>
  </v-list>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  animateScene: boolean
  orbitEnabled: boolean
  wireframeEnabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:animateScene', val: boolean): void
  (e: 'update:orbitEnabled', val: boolean): void
  (e: 'update:wireframeEnabled', val: boolean): void
  (e: 'resetViewport'): void
}>()
</script>
