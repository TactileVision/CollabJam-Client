import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
export function setupScene(
  width: number,
  height: number,
): { scene: THREE.Scene; camera: THREE.PerspectiveCamera } {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 2;
  return { scene, camera };
}

export function setupRenderer(
  container: HTMLDivElement,
  width: number,
  height: number,
): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);
  return renderer;
}

export function setupLights(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  const backDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  backDirectionalLight.position.set(-5, 10, -7.5);
  backDirectionalLight.castShadow = true;
  scene.add(backDirectionalLight);
  const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x444444, 0.6);
  hemisphereLight.position.set(0, 20, 0);
  scene.add(hemisphereLight);
}

export function setupOrbitControls(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  enable = true,
): OrbitControls {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enabled = enable;
  return controls;
}

export function resetOrbitControls(controls: OrbitControls) {
  controls.target.set(0, 0, 0);
  controls.update();
}
