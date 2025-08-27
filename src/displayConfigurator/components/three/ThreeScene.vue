<template>
  <div ref="container" class="three-container"></div>
</template>

<script lang="ts" setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
  defineProps,
  defineExpose,
  computed,
} from 'vue'
import {useStore} from "@/renderer/store/store";
import colors from 'vuetify/lib/util/colors'
import * as THREE from 'three'
import { Raycaster, Vector2, SphereGeometry, MeshBasicMaterial, Mesh } from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import * as ThreeSetup from '@/displayConfigurator/composables/three/useThreeSetup'
import * as AvatarHelpers from '@/displayConfigurator/composables/three/useAvatarHelpers'
import {DisplayConfigMutations} from "@/renderer/store/modules/displayConfigurator/mutations";
import {Marker} from "@/displayConfigurator/types/marker";

const markerDefaultColor = new THREE.Color(colors.deepOrange.darken1)
const markerDragColor = new THREE.Color(colors.green.base)

const props = defineProps<{
  width?: number
  height?: number
  animate?: boolean
  orbitControlsEnabled?: boolean
  wireframeEnabled?: boolean
}>()

const store = useStore()
const container = ref<HTMLDivElement | null>(null)
const raycaster = new Raycaster()
const mouse = new Vector2()

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let labelRenderer: CSS2DRenderer
let controls: OrbitControls
let loadedModel: THREE.Object3D | null = null
let avatarGroup: THREE.Group | null = null
let resizeObserver: ResizeObserver | null = null
let animationId: number | null = null
let draggingMarker: { mesh: THREE.Mesh; index: number } | null = null

const markerAddMode = computed(() => store.state.displayConfig.markerAddModeEnabled)
const markerMoveMode = computed(() => store.state.displayConfig.markerMoveModeEnabled)

const setRendererSize = (width: number, height: number) => {
  renderer.setSize(width, height)
  if (labelRenderer) labelRenderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

const resizeRenderer = () => {
  if (!container.value || !renderer || !camera || !labelRenderer) return
  if (props.width !== undefined && props.height !== undefined) return
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  setRendererSize(width, height)
}

function resetViewport() {
  if (
    camera &&
    store.state.displayConfig.initialCameraPosition &&
    store.state.displayConfig.initialCameraQuaternion
  ) {
    camera.position.copy(store.state.displayConfig.initialCameraPosition)
    camera.quaternion.copy(store.state.displayConfig.initialCameraQuaternion)
    camera.updateProjectionMatrix()
    if (controls) {
      controls.target.set(0, 0, 0)
      controls.update()
    }
    if (avatarGroup) {
      avatarGroup.rotation.set(0, 0, 0)
    }
  }
}

const waitForVisible = async (): Promise<void> => {
  await nextTick()
  return new Promise((resolve) => {
    const check = () => {
      if (container.value && container.value.clientWidth > 0 && container.value.clientHeight > 0) {
        resolve()
      } else {
        requestAnimationFrame(check)
      }
    }
    check()
  })
}

const initThree = () => {
  if (!container.value) return
  const initialWidth = props.width ?? container.value.clientWidth
  const initialHeight = props.height ?? container.value.clientHeight
  const setup = ThreeSetup.setupScene(initialWidth, initialHeight)
  scene = setup.scene
  camera = setup.camera
  renderer = ThreeSetup.setupRenderer(container.value, initialWidth, initialHeight)
  controls = ThreeSetup.setupOrbitControls(camera, renderer, props.orbitControlsEnabled)
  ThreeSetup.setupLights(scene)

  // CSS2DRenderer setup
  labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(initialWidth, initialHeight)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0'
  labelRenderer.domElement.style.left = '0'
  labelRenderer.domElement.style.pointerEvents = 'none'
  labelRenderer.domElement.style.width = '100%'
  labelRenderer.domElement.style.height = '100%'
  container.value.appendChild(labelRenderer.domElement)

  animate()

  if (props.width === undefined || props.height === undefined) {
    resizeObserver = new ResizeObserver(resizeRenderer)
    resizeObserver.observe(container.value)
    window.addEventListener('resize', resizeRenderer)
  }
}

function loadAvatarModel(path: string) {
  if (!scene) return
  if (loadedModel) {
    AvatarHelpers.disposeModel(loadedModel, scene)
    loadedModel = null
  }
  if (avatarGroup) {
    removeAllMarkerMeshes()
    scene.remove(avatarGroup)
    avatarGroup = null
  }
  avatarGroup = new THREE.Group()
  const loader = new OBJLoader()
  loader.load(
    path,
    (object) => {
      const box = AvatarHelpers.centerModel(object)
      AvatarHelpers.fitCameraToModel(camera, box)
      store.commit(DisplayConfigMutations.SET_INITIAL_CAMERA, {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
      })
      loadedModel = object
      AvatarHelpers.setWireframeMode(loadedModel, props.wireframeEnabled)
      avatarGroup!.add(loadedModel)
      scene.add(avatarGroup!)
      ThreeSetup.resetOrbitControls(controls)

      // After centering and adding loadedModel to avatarGroup, compute center once
      const boxAfter = new THREE.Box3().setFromObject(loadedModel)
      const center = boxAfter.getCenter(new THREE.Vector3())
      // Re-add existing markers on the new model at correct relative positions
      store.state.displayConfig.markers.forEach((marker: Marker, index) => {
        const position = markerBarycentricToWorld(marker, loadedModel as THREE.Mesh)
        if (position) {
          // Apply inverse of the centering offset to correct vertical position
          position.sub(center)
          const markerMesh = createMarker(position, index)
          avatarGroup!.add(markerMesh)
        }        
      })
    },
    undefined,
    (error) => {
      console.error('Error loading OBJ model:', error)
    },
  )
}

const animate = () => {
  if (!renderer || !scene || !camera || !labelRenderer) return
  animationId = requestAnimationFrame(animate)
  if (props.animate && avatarGroup) {
    avatarGroup.rotation.y += 0.01
  }
  controls.update()
  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}

function barycentricInterpolation(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  p: THREE.Vector3,
) {
  const v0 = b.clone().sub(a)
  const v1 = c.clone().sub(a)
  const v2 = p.clone().sub(a)
  const d00 = v0.dot(v0)
  const d01 = v0.dot(v1)
  const d11 = v1.dot(v1)
  const d20 = v2.dot(v0)
  const d21 = v2.dot(v1)
  const denom = d00 * d11 - d01 * d01
  const v = (d11 * d20 - d01 * d21) / denom
  const w = (d00 * d21 - d01 * d20) / denom
  const u = 1.0 - v - w
  return { u, v, w }
}

function calculateBarycentricCoords(
  hit: THREE.Intersection,
  point: THREE.Vector3,
): { u: number; v: number; w: number } {
  const transformVertex = (index: number) => {
    const posAttr = (hit.object.geometry as THREE.BufferGeometry).attributes.position
    return new THREE.Vector3()
      .fromBufferAttribute(posAttr, index)
      .applyMatrix4(hit.object.matrixWorld)
  }
  if (hit.face && hit.object instanceof THREE.Mesh) {
    const a = transformVertex(hit.face.a)
    const b = transformVertex(hit.face.b)
    const c = transformVertex(hit.face.c)
    return barycentricInterpolation(a, b, c, point)
  }
  return { u: 0, v: 0, w: 0 }
}

function createMarker(point: THREE.Vector3, index: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.05, 16, 16)
  const material = new THREE.MeshBasicMaterial({ color: markerDefaultColor })
  const markerMesh = new THREE.Mesh(geometry, material)
  markerMesh.position.copy(point)
  markerMesh.userData.markerIndex = index

  // --- 2D Text Label using CSS2DObject ---
  const labelDiv = document.createElement('div')
  labelDiv.className = 'marker-label'
  labelDiv.textContent = `M${index+1}`
  labelDiv.style.color = colors.deepOrange.darken1
  const labelObj = new CSS2DObject(labelDiv)
  labelObj.position.set(0, 0.2, 0) // float higher above the marker
  markerMesh.add(labelObj)

  return markerMesh
}

function addMarkerToStore(
  point: THREE.Vector3,
  faceId: number,
  baryCoords: { u: number; v: number; w: number },
) {
  store.commit(DisplayConfigMutations.ADD_MARKER, {
    channel: store.state.displayConfig.markers.length,
    faceId,
    barycentricCoords: baryCoords,
  })
}

function getIntersectionPoint(
  event: MouseEvent | PointerEvent,
): { point: THREE.Vector3; faceId: number; hit: THREE.Intersection } | null {
  if (!renderer || !camera || !loadedModel) return null

  updateMouseNDC(event)

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(loadedModel, true)
  if (intersects.length === 0) return null

  const hit = intersects[0]
  const point = hit.point
  const faceId = hit.faceIndex ?? -1
  return { point, faceId, hit }
}

function updateMouseNDC(event: MouseEvent | PointerEvent) {
  if (!renderer) return
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function addMarkerAtClick(event: MouseEvent) {
  if (!markerAddMode.value) return
  if (!avatarGroup) return

  const intersection = getIntersectionPoint(event)
  if (!intersection) return

  const { point, faceId, hit } = intersection
  const baryCoords = calculateBarycentricCoords(hit, point)
  const index = store.state.displayConfig.markers.length
  const markerMesh = createMarker(point, index)
  avatarGroup.add(markerMesh)
  addMarkerToStore(point, faceId, baryCoords)
}

function removeAllMarkerMeshes() {
  if (!avatarGroup) return
  const toRemove: THREE.Object3D[] = []

  avatarGroup.children.forEach((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry) {
      toRemove.push(obj)
    }
  })

  toRemove.forEach((obj) => {
    avatarGroup!.remove(obj)
    // Remove associated CSS2D label DOM elements
    obj.traverse((child) => {
      if ((child as any).element instanceof HTMLElement) {
        (child as any).element.remove()
      }
    })
  })
}

function onPointerDown(event: PointerEvent) {
  if (!markerMoveMode.value) return
  if (!renderer || !camera || !loadedModel || !avatarGroup) return

  updateMouseNDC(event)

  raycaster.setFromCamera(mouse, camera)

  // Check intersection with markers first
  const markerMeshesInGroup: THREE.Mesh[] = []
  avatarGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry) {
      const mat = obj.material as THREE.MeshBasicMaterial
      if (mat.color.equals(markerDefaultColor)) {
        markerMeshesInGroup.push(obj)
      }
    }
  })

  const intersects = raycaster.intersectObjects(markerMeshesInGroup, false)
  if (intersects.length === 0) return

  const intersectedMarkerMesh = intersects[0].object as THREE.Mesh
  const index = intersectedMarkerMesh.userData.markerIndex
  if (typeof index !== 'number') return

  draggingMarker = { mesh: intersectedMarkerMesh, index }
  intersectedMarkerMesh.material.color.copy(markerDragColor)
  controls.enabled = false
}

function onPointerMove(event: PointerEvent) {
  if (!renderer || !camera || !avatarGroup) return
  updateMouseNDC(event)

  // --- Marker Drag Logic ---
  if (draggingMarker && loadedModel) {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(loadedModel, true)
    if (intersects.length === 0) return
    const hit = intersects[0]
    const point = hit.point
    draggingMarker.mesh.position.copy(point)
    ;(draggingMarker.mesh.material as THREE.MeshBasicMaterial).color.copy(markerDragColor)
  }
}

function onPointerUp(event: PointerEvent) {
  if (!draggingMarker) return
  if (!renderer || !camera || !loadedModel) return

  updateMouseNDC(event)
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(loadedModel, true)
  if (intersects.length === 0) {
    draggingMarker.mesh.material.color.copy(markerDefaultColor)
    draggingMarker = null
    controls.enabled = props.orbitControlsEnabled ?? true
    return
  }

  const hit = intersects[0]
  const point = hit.point
  const faceId = hit.faceIndex ?? -1
  const baryCoords = calculateBarycentricCoords(hit, point)

  store.commit(DisplayConfigMutations.UPDATE_MARKER, {
    channel: draggingMarker.index,
    faceId,
    barycentricCoords: baryCoords,
  })

  draggingMarker.mesh.position.copy(point)
  draggingMarker.mesh.material.color.copy(markerDefaultColor)

  draggingMarker = null
  controls.enabled = props.orbitControlsEnabled ?? true
}

function enableMarkerMoveListeners() {
  if (!renderer) return
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.style.touchAction = 'none'
}

function disableMarkerMoveListeners() {
  if (!renderer) return
  renderer.domElement.removeEventListener('pointerdown', onPointerDown)
  renderer.domElement.removeEventListener('pointermove', onPointerMove)
  renderer.domElement.removeEventListener('pointerup', onPointerUp)
  renderer.domElement.style.touchAction = ''
}

function markerBarycentricToWorld(
  marker: Marker,
  mesh: THREE.Object3D,
): THREE.Vector3 | null {
  if (marker.barycentricCoords == undefined) {
    console.error("marker-coordinate are undefined");
    return;
  }
    
  // Find a mesh with geometry
  let targetMesh: THREE.Mesh | null = null
  mesh.traverse((obj) => {
    if (!targetMesh && obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BufferGeometry) {
      targetMesh = obj
    }
  })
  if (!targetMesh) return null

  const geom = targetMesh.geometry as THREE.BufferGeometry
  const posAttr = geom.attributes.position;
  const { u, v, w } = marker.barycentricCoords;
  let a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3

  if (geom.index) {
    const faceIndex = marker.faceId
    const aIndex = geom.index.getX(faceIndex * 3)
    const bIndex = geom.index.getX(faceIndex * 3 + 1)
    const cIndex = geom.index.getX(faceIndex * 3 + 2)
    a = new THREE.Vector3()
      .fromBufferAttribute(posAttr, aIndex)
      .applyMatrix4(targetMesh.matrixWorld)
    b = new THREE.Vector3()
      .fromBufferAttribute(posAttr, bIndex)
      .applyMatrix4(targetMesh.matrixWorld)
    c = new THREE.Vector3()
      .fromBufferAttribute(posAttr, cIndex)
      .applyMatrix4(targetMesh.matrixWorld)
  } else {
    const faceIndex = marker.faceId
    a = new THREE.Vector3()
      .fromBufferAttribute(posAttr, faceIndex * 3)
      .applyMatrix4(targetMesh.matrixWorld)
    b = new THREE.Vector3()
      .fromBufferAttribute(posAttr, faceIndex * 3 + 1)
      .applyMatrix4(targetMesh.matrixWorld)
    c = new THREE.Vector3()
      .fromBufferAttribute(posAttr, faceIndex * 3 + 2)
      .applyMatrix4(targetMesh.matrixWorld)
  }

  return new THREE.Vector3(
    a.x * u + b.x * v + c.x * w,
    a.y * u + b.y * v + c.y * w,
    a.z * u + b.z * v + c.z * w,
  )
}

onMounted(async () => {
  await waitForVisible()
  initThree()
  loadAvatarModel(store.state.displayConfig.modelPath)
})

onBeforeUnmount(() => {
  if (resizeObserver && container.value) {
    resizeObserver.unobserve(container.value)
  }
  if (renderer) {
    renderer.dispose()
    renderer.domElement.removeEventListener('click', addMarkerAtClick)
    disableMarkerMoveListeners()
  }
  window.removeEventListener('resize', resizeRenderer)
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
  }
})

watch(
  () => [props.width, props.height],
  ([newWidth, newHeight]) => {
    if (newWidth !== undefined && newHeight !== undefined && renderer && camera) {
      setRendererSize(newWidth, newHeight)
    }
  },
)

watch(
  () => props.orbitControlsEnabled,
  (enabled) => {
    if (controls) controls.enabled = enabled ?? true
  },
)

watch(
  () => props.wireframeEnabled,
  (enabled) => {
    if (loadedModel) {
      AvatarHelpers.setWireframeMode(loadedModel, enabled)
    }
  },
)

watch(
  markerAddMode,
  (enabled) =>
    renderer &&
    (enabled
      ? renderer.domElement.addEventListener('click', addMarkerAtClick)
      : renderer.domElement.removeEventListener('click', addMarkerAtClick)),
)

watch(markerMoveMode, (enabled) => {
  if (!renderer) return
  if (enabled) {
    enableMarkerMoveListeners()
  } else {
    disableMarkerMoveListeners()
    draggingMarker = null
  }
})

watch(
  () => store.state.displayConfig.markers.length,
  (len) => {
    if (len === 0) removeAllMarkerMeshes()
  },
)

defineExpose({
  resetViewport,
  loadAvatarModel,
  removeAllMarkerMeshes,
})
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.marker-label {
  font-size: 14px;
  font-family: Arial, sans-serif;
  pointer-events: none;
}
</style>
