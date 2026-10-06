import * as THREE from "three";

export type TransformMode = "translate" | "rotate" | "scale";
export type TransformAxis = "x" | "y" | "z" | "xyz";

type Handle = THREE.Object3D & { userData: { axis?: TransformAxis; mode?: TransformMode } };

export class TransformGizmoManager {
  readonly group = new THREE.Group();

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly handles: Handle[] = [];
  private readonly startPosition = new THREE.Vector3();
  private readonly startScale = new THREE.Vector3();
  private readonly startQuaternion = new THREE.Quaternion();
  private readonly startHit = new THREE.Vector3();
  private readonly dragOffset = new THREE.Vector3();
  private readonly dragPlane = new THREE.Plane();
  private readonly axisVector = new THREE.Vector3();
  private readonly worldPoint = new THREE.Vector3();
  private readonly cameraDirection = new THREE.Vector3();
  private lastPointerX = 0;
  private lastPointerY = 0;

  private target: THREE.Object3D | null = null;
  private activeAxis: TransformAxis | null = null;
  private activeMode: TransformMode | null = null;

  mode: TransformMode = "translate";
  space: "world" | "local" = "world";
  visible = true;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
    private readonly canvas: HTMLCanvasElement
  ) {
    this.group.name = "UVER_Transform_Gizmos";
    this.group.renderOrder = 1000;
    this.scene.add(this.group);

    this.canvas.style.touchAction = "none";
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerup", this.onUp);
    this.canvas.addEventListener("pointercancel", this.onUp);
    this.rebuild();
  }

  attach(object: THREE.Object3D | null) {
    this.target = object;
    this.activeAxis = null;
    this.activeMode = null;
    this.sync();
  }

  attachMany(objects: THREE.Object3D[]) {
    this.attach(objects.length ? objects[0] : null);
  }

  detach() {
    this.attach(null);
  }

  getTarget() {
    return this.target;
  }

  setMode(mode: TransformMode) {
    this.mode = mode;
    this.activeAxis = null;
    this.activeMode = null;
    this.rebuild();
    this.sync();
  }

  setSpace(space: "world" | "local") {
    this.space = space;
    this.sync();
  }

  setVisible(value: boolean) {
    this.visible = value;
    this.sync();
  }

  sync() {
    if (!this.target) {
      this.group.visible = false;
      return;
    }

    this.group.visible = this.visible;
    this.group.position.copy(this.target.getWorldPosition(new THREE.Vector3()));

    if (this.space === "local") {
      this.group.quaternion.copy(this.target.getWorldQuaternion(new THREE.Quaternion()));
    } else {
      this.group.quaternion.identity();
    }

    const distance = this.group.position.distanceTo(this.camera.position);
    const size = THREE.MathUtils.clamp(distance * 0.16, 0.3, 2.6);
    this.group.scale.setScalar(size);
  }

  private rebuild() {
    this.group.clear();
    this.handles.length = 0;

    if (this.mode === "translate") {
      this.addTranslateHandle("x", 0xff5555);
      this.addTranslateHandle("y", 0x66dd77);
      this.addTranslateHandle("z", 0x5599ff);
      this.addCenterHandle("xyz", 0xffffff);
    } else if (this.mode === "scale") {
      this.addScaleHandle("x", 0xff5555);
      this.addScaleHandle("y", 0x66dd77);
      this.addScaleHandle("z", 0x5599ff);
      this.addCenterHandle("xyz", 0xffffff);
    } else {
      this.addRotateRing("x", 0xff5555);
      this.addRotateRing("y", 0x66dd77);
      this.addRotateRing("z", 0x5599ff);
    }
  }

  private material(color: number) {
    return new THREE.MeshBasicMaterial({
      color,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.96
    });
  }

  private addTranslateHandle(axis: TransformAxis, color: number) {
    const group = new THREE.Group() as Handle;
    group.userData.axis = axis;
    group.userData.mode = "translate";

    const direction = this.axisDirection(axis);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.78, 8),
      this.material(color)
    );
    shaft.position.copy(direction).multiplyScalar(0.39);
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.26, 8),
      this.material(color)
    );
    tip.position.copy(direction).multiplyScalar(0.9);
    tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

    group.add(shaft, tip);
    group.renderOrder = 1001;
    this.group.add(group);
    this.handles.push(group);
  }

  private addScaleHandle(axis: TransformAxis, color: number) {
    const group = new THREE.Group() as Handle;
    group.userData.axis = axis;
    group.userData.mode = "scale";

    const direction = this.axisDirection(axis);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8),
      this.material(color)
    );
    shaft.position.copy(direction).multiplyScalar(0.36);
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.18),
      this.material(color)
    );
    cube.position.copy(direction).multiplyScalar(0.8);

    group.add(shaft, cube);
    group.renderOrder = 1001;
    this.group.add(group);
    this.handles.push(group);
  }

  private addCenterHandle(axis: TransformAxis, color: number) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      this.material(color)
    ) as Handle;
    mesh.userData.axis = axis;
    mesh.userData.mode = this.mode;
    mesh.renderOrder = 1002;
    this.group.add(mesh);
    this.handles.push(mesh);
  }

  private addRotateRing(axis: TransformAxis, color: number) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.05, 6, 48),
      this.material(color)
    ) as Handle;
    ring.userData.axis = axis;
    ring.userData.mode = "rotate";
    ring.renderOrder = 1001;

    if (axis === "x") ring.rotation.y = Math.PI / 2;
    if (axis === "y") ring.rotation.x = Math.PI / 2;

    this.group.add(ring);
    this.handles.push(ring);
  }

  private axisDirection(axis: TransformAxis) {
    if (axis === "x") return new THREE.Vector3(1, 0, 0);
    if (axis === "y") return new THREE.Vector3(0, 1, 0);
    return new THREE.Vector3(0, 0, 1);
  }

  private setPointer(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
      -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1
    );
  }

  private onDown = (event: PointerEvent) => {
    if (!this.target || !this.visible || event.button !== 0) return;

    this.setPointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const hits = this.raycaster.intersectObjects(this.handles, true);
    if (!hits.length) return;

    let handle: THREE.Object3D | null = hits[0].object;
    while (handle && !this.handles.includes(handle as Handle)) handle = handle.parent;
    if (!handle) return;

    const axis = (handle.userData.axis ?? "xyz") as TransformAxis;
    const mode = (handle.userData.mode ?? this.mode) as TransformMode;

    this.activeAxis = axis;
    this.activeMode = mode;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.startPosition.copy(this.target.position);
    this.startScale.copy(this.target.scale);
    this.startQuaternion.copy(this.target.quaternion);

    const worldPosition = this.target.getWorldPosition(new THREE.Vector3());

    if (mode === "translate") {
      if (axis === "xyz") {
        this.dragPlane.setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(this.cameraDirection).negate(),
          worldPosition
        );
      } else {
        this.axisVector.copy(this.axisDirection(axis));
        if (this.space === "local") {
          this.axisVector.applyQuaternion(this.target.getWorldQuaternion(new THREE.Quaternion()));
        }
        const view = this.camera.getWorldDirection(this.cameraDirection);
        const normal = new THREE.Vector3()
          .crossVectors(this.axisVector, view)
          .cross(this.axisVector);

        if (normal.lengthSq() < 1e-8) {
          normal.copy(view).cross(this.axisVector);
        }
        normal.normalize();
        this.dragPlane.setFromNormalAndCoplanarPoint(normal, worldPosition);
      }

      if (this.raycaster.ray.intersectPlane(this.dragPlane, this.startHit)) {
        this.dragOffset.copy(worldPosition).sub(this.startHit);
      }
    } else {
      this.startHit.copy(worldPosition);
    }

    this.canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  private onMove = (event: PointerEvent) => {
    if (!this.target || !this.activeAxis || !this.activeMode) return;

    this.setPointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    if (this.activeMode === "translate") {
      if (!this.raycaster.ray.intersectPlane(this.dragPlane, this.worldPoint)) return;

      const point = this.worldPoint.clone().add(this.dragOffset);
      const currentWorld = this.target.getWorldPosition(new THREE.Vector3());
      const delta = point.sub(currentWorld);

      if (this.activeAxis === "xyz") {
        const desiredWorld = currentWorld.clone().add(delta);
        if (this.target.parent) {
          this.target.position.copy(this.target.parent.worldToLocal(desiredWorld));
        } else {
          this.target.position.copy(desiredWorld);
        }
      } else {
        const axis = this.axisDirection(this.activeAxis);
        // The target position is parent-local, so in local mode the axis is
        // already expressed in the correct coordinate system.
        const amount = delta.dot(axis);
        this.target.position.copy(this.startPosition).add(axis.multiplyScalar(amount));
      }
    } else if (this.activeMode === "scale") {
      const dy = (event.clientY - this.lastPointerY) * -0.012;
      const factor = Math.max(0.05, 1 + Math.max(-0.9, dy));

      if (this.activeAxis === "xyz") {
        this.target.scale.copy(this.startScale).multiplyScalar(factor);
      } else {
        this.target.scale.copy(this.startScale);
        this.target.scale[this.activeAxis] = Math.max(
          0.05,
          this.startScale[this.activeAxis] * factor
        );
      }
    } else {
      const dx = event.clientX - this.lastPointerX;
      const dy = event.clientY - this.lastPointerY;
      const angle = (dx - dy) * 0.01;
      const axis = this.axisDirection(this.activeAxis);

      if (this.space === "local") {
        this.target.quaternion.copy(this.startQuaternion);
        this.target.rotateOnAxis(axis, angle);
      } else {
        const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        this.target.quaternion.copy(this.startQuaternion).premultiply(q);
      }
    }

    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.sync();
    event.preventDefault();
  };

  private onUp = (event: PointerEvent) => {
    this.activeAxis = null;
    this.activeMode = null;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };

  dispose() {
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onUp);
    this.scene.remove(this.group);
  }
}
