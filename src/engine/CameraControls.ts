import * as THREE from "three";
import CameraControlsImpl from "camera-controls";

CameraControlsImpl.install({THREE});

export class CameraControls {
  private readonly controls: CameraControlsImpl;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    dom: HTMLElement
  ) {
    this.controls = new CameraControlsImpl(camera, dom);

    // Mobile-first tuning: smooth while dragging, but not syrupy.
    this.controls.smoothTime = 0.12;
    this.controls.draggingSmoothTime = 0.055;
    this.controls.azimuthRotateSpeed = 0.72;
    this.controls.polarRotateSpeed = 0.72;
    this.controls.dollySpeed = 1.0;
    this.controls.truckSpeed = 1.15;

    // Do not make the viewport stop responding just because the camera is
    // close to the model. The renderer near plane is also kept very small.
    this.controls.minDistance = 0.015;
    this.controls.maxDistance = 1000;

    // Full horizontal orbit. Vertical orbit remains the native camera-controls
    // 0..PI range, which avoids the uncontrolled roll of TrackballControls.
    this.controls.minAzimuthAngle = -Infinity;
    this.controls.maxAzimuthAngle = Infinity;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI;

    this.controls.saveState();
  }

  update(delta: number) {
    this.controls.update(delta);
  }

  frameObject(object: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    const distance = Math.max(radius * 3.0, 0.8);

    const position = center.clone().add(
      new THREE.Vector3(distance * 0.8, distance * 0.55, distance)
    );

    // Important: update camera-controls' internal target as well as the
    // actual camera. Direct camera.lookAt() leaves the controller state stale.
    this.controls.setLookAt(
      position.x,
      position.y,
      position.z,
      center.x,
      center.y,
      center.z,
      false
    );
    this.controls.saveState();
  }

  get target(): THREE.Vector3 {
    return this.controls.getTarget(new THREE.Vector3());
  }

  snapTo(axis: "x" | "y" | "z", requestedSign?: 1 | -1) {
    const target = this.controls.getTarget(new THREE.Vector3());
    const offset = this.camera.position.clone().sub(target);
    const distance = Math.max(offset.length(), 0.8);
    const sign = offset.dot(
      axis === "x" ? new THREE.Vector3(1, 0, 0) :
      axis === "y" ? new THREE.Vector3(0, 1, 0) :
      new THREE.Vector3(0, 0, 1)
    ) >= 0 ? 1 : -1;

    const position = target.clone();
    if (axis === "x") position.x += distance * sign;
    if (axis === "y") position.y += distance * sign;
    if (axis === "z") position.z += distance * sign;

    this.controls.setLookAt(
      position.x, position.y, position.z,
      target.x, target.y, target.z,
      true
    );
  }
}
