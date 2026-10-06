import * as THREE from "three";

export class BoneOverlayManager {
  private helper: THREE.SkeletonHelper | null = null;
  private root: THREE.Object3D | null = null;

  constructor(private readonly scene: THREE.Scene) {}

  setRoot(root: THREE.Object3D | null) {
    this.dispose();
    this.root = root;
    if (!root) return;

    const bones: THREE.Bone[] = [];
    root.traverse(object => {
      if ((object as THREE.Bone).isBone) bones.push(object as THREE.Bone);
    });

    if (!bones.length) return;

    this.helper = new THREE.SkeletonHelper(root);
    this.helper.name = "UVER_BoneOverlay";
    this.helper.visible = true;
    this.helper.renderOrder = 900;
    const material = this.helper.material as THREE.LineBasicMaterial;
    material.depthTest = false;
    material.depthWrite = false;
    material.transparent = true;
    material.opacity = 0.95;
    material.linewidth = 2;
    this.scene.add(this.helper);
  }

  update() {
    if (!this.helper || !this.root) return;
    this.root.updateMatrixWorld(true);
    this.helper.updateMatrixWorld(true);
  }

  getBones(): THREE.Bone[] {
    return this.helper?.bones ?? [];
  }

  dispose() {
    if (!this.helper) return;
    this.scene.remove(this.helper);
    this.helper.dispose();
    this.helper = null;
    this.root = null;
  }
}
