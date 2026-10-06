import * as THREE from "three";

export class BoneOverlayManager {
  private readonly group = new THREE.Group();
  private readonly entries = new Map<string, {bone: THREE.Bone; body: THREE.Mesh; joint: THREE.Mesh}>();
  private root: THREE.Object3D | null = null;

  constructor(private readonly scene: THREE.Scene, private readonly camera: THREE.PerspectiveCamera, private readonly canvas: HTMLCanvasElement) {
    this.group.name = "UVER_BoneOverlay";
    this.group.renderOrder = 900;
    this.scene.add(this.group);
  }

  setRoot(root: THREE.Object3D | null) {
    this.disposeVisuals();
    this.root = root;
    if (!root) return;

    root.traverse(object => {
      if (!(object as THREE.Bone).isBone) return;
      const bone = object as THREE.Bone;

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.09, 1, 6),
        new THREE.MeshBasicMaterial({
          color: 0x28a8ff,
          depthTest: false,
          depthWrite: false,
          transparent: true,
          opacity: 0.95
        })
      );
      body.renderOrder = 901;

      const joint = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 8, 6),
        new THREE.MeshBasicMaterial({
          color: 0x64e8a0,
          depthTest: false,
          depthWrite: false,
          transparent: true,
          opacity: 0.98
        })
      );
      joint.renderOrder = 902;

      this.group.add(body, joint);
      this.entries.set(bone.uuid, {bone, body, joint});
    });
  }

  update() {
    if (!this.root) return;
    this.root.updateMatrixWorld(true);

    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    const direction = new THREE.Vector3();

    for (const {bone, body, joint} of this.entries.values()) {
      bone.getWorldPosition(start);
      joint.position.copy(start);

      const child = bone.children.find(value => (value as THREE.Bone).isBone) as THREE.Bone | undefined;
      if (!child) {
        body.visible = false;
        continue;
      }

      child.getWorldPosition(end);
      direction.subVectors(end, start);
      const length = direction.length();

      if (length < 0.002 || !Number.isFinite(length)) {
        body.visible = false;
        continue;
      }

      // Ignore pathological root-to-child spokes that are far outside the
      // model's normal bone scale. They are usually helper/control nodes,
      // not deforming body bones.
      const box = new THREE.Box3().setFromObject(this.root);
      const maxLength = Math.max(box.getSize(new THREE.Vector3()).length() * 0.65, 0.5);
      if (length > maxLength) {
        body.visible = false;
        continue;
      }

      body.visible = true;
      body.position.copy(start).addScaledVector(direction, 0.5);
      body.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
      );
      const distance = this.camera.position.distanceTo(joint.position);
      const rect = this.canvas.getBoundingClientRect();
      const viewportHeight = Math.max(rect.height, window.innerHeight, 1);
      const worldPerPixel = (2 * Math.max(distance, 0.001) * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5))) / viewportHeight;
      const thickness = worldPerPixel * 3.5;
      const jointSize = worldPerPixel * 3.0;
      const maxVisualSize = Math.max(length * 0.16, worldPerPixel * 6.0);

      body.scale.set(
        Math.min(thickness, maxVisualSize),
        Math.max(length * 0.5, thickness),
        Math.min(thickness, maxVisualSize)
      );
      joint.scale.setScalar(Math.min(jointSize, maxVisualSize));
    }
  }

  getBones(): THREE.Bone[] {
    return [...this.entries.values()].map(entry => entry.bone);
  }

  dispose() {
    this.disposeVisuals();
    this.root = null;
  }

  private disposeVisuals() {
    for (const entry of this.entries.values()) {
      entry.body.geometry.dispose();
      (entry.body.material as THREE.Material).dispose();
      entry.joint.geometry.dispose();
      (entry.joint.material as THREE.Material).dispose();
    }
    this.entries.clear();
    this.group.clear();
  }
}
