<template>
  <v-list>
    <v-list-group value="true" prepend-icon="mdi-map-marker-multiple" title="Marker Controls">
      <template #activator="{ props }">
        <v-list-item v-bind="props" title="Marker Controls"></v-list-item>
      </template>

      <!-- Marker mode switches -->
      <v-list-item>
        <div class="d-flex flex-row align-center justify-space-around" style="width: 100%">
          <v-switch
            :model-value="markerAddMode"
            @update:model-value="(val) => $emit('update:markerAddMode', val)"
            color="deep-orange-darken-1"
            label="Add Markers"
          />
          <v-switch
            :model-value="markerMoveMode"
            @update:model-value="(val) => $emit('update:markerMoveMode', val)"
            color="deep-orange-darken-1"
            label="Move Markers"
          />
        </div>
      </v-list-item>

      <!-- Remove markers -->
      <v-list-item>
        <v-btn @click="$emit('clear-markers')" color="deep-orange-darken-1"> Remove Markers </v-btn>
      </v-list-item>
    </v-list-group>
  </v-list>
</template>

<script lang="ts" setup>
import type { Marker } from '@/displayConfigurator/types/marker'

defineProps<{
  markerAddMode: boolean
  markerMoveMode: boolean
  markers: Marker[]
}>()

defineEmits<{
  (e: 'update:markerAddMode', value: boolean): void
  (e: 'update:markerMoveMode', value: boolean): void
  (e: 'clear-markers'): void
}>()
</script>
