<template>
  <v-navigation-drawer
    :width="drawerWidth"
    v-model="internalDrawer"
    location="right"
    temporary
    scrim
    disable-resize-watcher
    class="smooth-drawer"
  >
    <ViewControls
      v-model:animate-scene="animateScene"
      v-model:orbit-enabled="orbitEnabled"
      v-model:wireframe-enabled="wireframeEnabled"
      @reset-viewport="resetViewport"
    />
    <AvatarControls
      v-model:selectedModel="selectedModel"
      v-model:selectedPose="selectedPose"
      :model-options="modelOptions"
      :pose-options="poseOptions"
      @load-avatar="loadAvatar"
    />
    <MarkerControls
      v-model:marker-add-mode="markerAddMode"
      v-model:marker-move-mode="markerMoveMode"
      :markers="markers"
      @clear-markers="clearMarkers"
    />
    <!--:marker-mode-enabled="store.state.displayConfig.markerModeEnabled"-->
    <ThreeScene
      :width="drawerWidth"
      :animate="animateScene"
      :orbit-controls-enabled="orbitEnabled"
      :wireframe-enabled="wireframeEnabled"
      ref="threeSceneRef"
    />
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import {useStore} from "@/renderer/store/store";
import ThreeScene from './three/ThreeScene.vue'
import ViewControls from './ViewControls.vue'
import AvatarControls from './AvatarControls.vue'
import MarkerControls from './MarkerControls.vue'
import {DisplayConfigMutations} from "@/renderer/store/modules/displayConfigurator/mutations";
import {displayConfiguratorConfig} from "@/displayConfigurator/config";

const store = useStore()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const internalDrawer = ref(props.modelValue)
const drawerWidth = ref(Math.floor(window.innerWidth * 0.5))
const animateScene = ref(false)
const orbitEnabled = ref(false)
const wireframeEnabled = ref(false)
const threeSceneRef = ref<InstanceType<typeof ThreeScene> | null>(null)

const modelOptions = [
  { label: 'gender neutral', value: 'neutral' },
  { label: 'female', value: 'female' },
  { label: 'male', value: 'male' },
  { label: 'old male', value: 'male_old' },
]

const poseOptions = [
  { label: 'A-Pose', value: 'a_pose' },
  { label: 'T-Pose', value: 't_pose' },
]

const selectedModel = computed({
  get: () => store.state.displayConfig.selectedModel,
  set: (val: string | null) => {
    if (val == null) {
      return;
    }
    store.commit(DisplayConfigMutations.SET_SELECTED_MODEL, val)
  },
})

const selectedPose = computed({
  get: () => store.state.displayConfig.selectedPose,
  set: (val: string | null) => {
    if (val == null) {
      return;
    }
    store.commit(DisplayConfigMutations.SET_SELECTED_POSE, val)
  },
})

const modelPath = computed(() => {
  if (!selectedModel.value || !selectedPose.value) return null
  return `${displayConfiguratorConfig.modelpath}mh-${selectedModel.value}-${selectedPose.value}.obj`
})

const markerAddMode = computed({
  get: () => store.state.displayConfig.markerAddModeEnabled,
  set: (val: boolean) => {
    store.commit(DisplayConfigMutations.SET_MARKER_ADD_MODE, val)
    if (val) {
      store.commit(DisplayConfigMutations.SET_MARKER_MOVE_MODE, false)
    }
  },
})

const markerMoveMode = computed({
  get: () => store.state.displayConfig.markerMoveModeEnabled,
  set: (val: boolean) => {
    store.commit(DisplayConfigMutations.SET_MARKER_MOVE_MODE, val)
    if (val) {
      store.commit(DisplayConfigMutations.SET_MARKER_ADD_MODE, false)
    }
  },
})

const markers = computed(() => store.state.displayConfig.markers)

function clearMarkers() {
  store.commit(DisplayConfigMutations.CLEAR_MARKERS, undefined)
}

watch(
  () => props.modelValue,
  (val) => {
    internalDrawer.value = val;
  },
)

watch(internalDrawer, (val) => {
  emit('update:modelValue', val)
})

function updateDrawerWidth() {
  drawerWidth.value = Math.floor(window.innerWidth * 0.5)
}

function resetViewport() {
  if (threeSceneRef.value && typeof threeSceneRef.value.resetViewport === 'function') {
    threeSceneRef.value.resetViewport()
  }
}

function loadAvatar() {
  if (!modelPath.value) return
  store.commit(DisplayConfigMutations.SET_MODEL_PATH, modelPath.value)
  if (threeSceneRef.value && typeof threeSceneRef.value.loadAvatarModel === 'function') {
    threeSceneRef.value.loadAvatarModel(modelPath.value)
  }
}

onMounted(() => {
  window.addEventListener('resize', updateDrawerWidth)
  updateDrawerWidth()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDrawerWidth)
})
</script>

<style scoped>
.smooth-drawer {
  transition:
    transform 0.3s ease,
    width 0.3s ease;
}
</style>
