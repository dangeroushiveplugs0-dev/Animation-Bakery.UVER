import * as THREE from "three";
import {SelectionManager} from "./SelectionManager";
import {SelectionHighlightManager} from "./SelectionHighlightManager";
import {TransformGizmoManager} from "../gizmos/TransformGizmoManager";
import {BoneOverlayManager} from "../rig/BoneOverlayManager";

export class ViewportSelectionController {
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly bones: THREE.Bone[] = [];
  private readonly start = new THREE.Vector2();
  private root: THREE.Object3D | null = null;
  private dragging = false;

  constructor(
    private readonly camera: THREE.Camera,
    private readonly canvas: HTMLCanvasElement,
    private readonly selection: SelectionManager,
    private readonly highlight: SelectionHighlightManager,
    private readonly gizmos: TransformGizmoManager,
    private readonly boneOverlay: BoneOverlayManager
  ) {
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onCancel);
  }

  setRoot(root: THREE.Object3D | null) {
    this.root = root;
    this.bones.length = 0;

    if (root) {
      root.traverse(object => {
        if ((object as THREE.Bone).isBone) {
          this.bones.push(object as THREE.Bone);
        }
      });
    }

    this.boneOverlay.setRoot(root);
    this.clear();
  }

  clear() {
    this.selection.clear();
    this.highlight.clear();
    this.gizmos.detach();
  }

  private setPointer(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
      -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1
    );
  }

  private onDown = (event: PointerEvent) => {
    if (!this.root || event.button !== 0) return;
    this.start.set(event.clientX, event.clientY);
    this.dragging = false;

    this.setPointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    if (this.raycaster.intersectObject(this.gizmos.group, true).length) {
      return;
    }

    const bone = this.pickBone();
    if (bone) {
      this.selection.selectBone(bone.uuid, bone.name || "Bone");
      this.gizmos.attach(bone);
      this.highlight.clear();
      event.preventDefault();
      return;
    }

    // Do not steal the gesture from the camera when the finger lands on a mesh.
    // Mesh selection is only committed on a short tap in onUp.
  };

  private onUp = (event: PointerEvent) => {
    if (!this.root || event.button !== 0) return;

    const dx = event.clientX - this.start.x;
    const dy = event.clientY - this.start.y;
    this.dragging = Math.hypot(dx, dy) > 10;

    if (this.dragging) return;

    this.setPointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    if (this.raycaster.intersectObject(this.gizmos.group, true).length) return;

    // Bones get priority, even when the bone line passes over the mesh.
    const bone = this.pickBone();
    if (bone) {
      this.selection.selectBone(bone.uuid, bone.name || "Bone");
      this.gizmos.attach(bone);
      this.highlight.clear();
      event.preventDefault();
      return;
    }

    const hits = this.raycaster.intersectObject(this.root, true)
      .filter(hit => !this.isBoneObject(hit.object));

    if (hits.length) {
      const object = this.resolveSelectableObject(hits[0].object);
      if (object) {
        this.selection.selectObject(object.uuid, object.name || "Object");
        this.highlight.selectObject(object);
        this.gizmos.attach(object);
        return;
      }
    }

    // A background tap clears selection. Dragging the background remains camera orbit.
    this.clear();
  };

  private resolveSelectableObject(object: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = object;

    while (
      current?.parent &&
      current.parent !== this.root &&
      !(current as THREE.SkinnedMesh).isSkinnedMesh
    ) {
      current = current.parent;
    }

    return current && !(current as THREE.Bone).isBone ? current : null;
  }

  private isBoneObject(object: THREE.Object3D): boolean {
    return !!(object as THREE.Bone).isBone;
  }

  private pickBone(): THREE.Bone | null {
    if (!this.bones.length) return null;

    const distance = this.camera.position.distanceTo(this.raycaster.ray.origin);
    const threshold = THREE.MathUtils.clamp(distance * 0.025, 0.02, 0.3);

    let best: THREE.Bone | null = null;
    let bestDistance = Infinity;

    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    const closestRay = new THREE.Vector3();
    const closestSegment = new THREE.Vector3();

    for (const bone of this.bones) {
      bone.getWorldPosition(start);

      const child = bone.children.find(child => (child as THREE.Bone).isBone);
      if (child) {
        child.getWorldPosition(end);
      } else {
        end.copy(start).add(new THREE.Vector3(0, threshold * 2, 0));
      }

      const distanceSq = this.raycaster.ray.distanceSqToSegment(
        start,
        end,
        closestRay,
        closestSegment
      );

      if (distanceSq < threshold * threshold && distanceSq < bestDistance) {
        bestDistance = distanceSq;
        best = bone;
      }
    }

    return best;
  }

  dispose() {
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onCancel);
    this.boneOverlay.dispose();
  }

  private onCancel = () => {
    this.dragging = false;
  };
}
