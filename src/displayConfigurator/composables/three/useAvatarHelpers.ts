import * as THREE from "three";

export function centerModel(object: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  box.getCenter(center);
  object.position.sub(center); // Center at origin
  return box;
}

export function fitCameraToModel(
  camera: THREE.PerspectiveCamera,
  box: THREE.Box3,
) {
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const fitHeightDistance =
    maxDim / (2 * Math.atan((Math.PI * camera.fov) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = Math.max(fitHeightDistance, fitWidthDistance);
  camera.position.set(0, 0, distance * 1.2);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
}

export function setWireframeMode(
  object: THREE.Object3D,
  enabled: boolean | undefined,
) {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          mat.wireframe = enabled ?? false;
        });
      } else if (mesh.material) {
        mesh.material.wireframe = enabled ?? false;
      }
    }
  });
}

export function disposeModel(object: THREE.Object3D, scene: THREE.Scene) {
  scene.remove(object);
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
      mesh.geometry.dispose();
    }
  });
}
