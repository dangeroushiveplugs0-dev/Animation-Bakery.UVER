import * as THREE from "three";

export class BoneIKController {
  private readonly chain: THREE.Bone[] = [];
  private readonly target = new THREE.Vector3();
  private readonly joint = new THREE.Vector3();
  private readonly effector = new THREE.Vector3();
  private readonly toEffector = new THREE.Vector3();
  private readonly toTarget = new THREE.Vector3();
  private readonly correction = new THREE.Quaternion();
  private readonly currentWorldQuaternion = new THREE.Quaternion();
  private readonly desiredWorldQuaternion = new THREE.Quaternion();
  private readonly parentWorldQuaternion = new THREE.Quaternion();

  begin(bone: THREE.Bone) {
    this.chain.length = 0;
    let current: THREE.Object3D | null = bone;
    let depth = 0;

    while (current && (current as THREE.Bone).isBone && depth < 10) {
      this.chain.push(current as THREE.Bone);
      current = current.parent;
      depth++;
    }

    this.chain.reverse();
  }

  hasChain() {
    return this.chain.length > 0;
  }

  solveTo(worldTarget: THREE.Vector3) {
    if (this.chain.length < 2) {
      const effector = this.chain[0];
      if (!effector) return;
      if (effector.parent) {
        effector.parent.worldToLocal(this.target.copy(worldTarget));
        effector.position.copy(this.target);
      } else {
        effector.position.copy(worldTarget);
      }
      return;
    }

    this.target.copy(worldTarget);

    const root = this.chain[0];
    root.updateWorldMatrix(true, true);

    // CCD rotates parent joints instead of translating the bone itself.
    // That preserves the rest lengths of every link while the selected
    // effector follows the gizmo target.
    for (let iteration = 0; iteration < 8; iteration++) {
      root.updateWorldMatrix(true, true);
      const effectorBone = this.chain[this.chain.length - 1];
      effectorBone.getWorldPosition(this.effector);

      if (this.effector.distanceToSquared(this.target) < 1e-6) break;

      for (let i = this.chain.length - 2; i >= 0; i--) {
        const jointBone = this.chain[i];
        jointBone.getWorldPosition(this.joint);
        effectorBone.getWorldPosition(this.effector);

        this.toEffector.subVectors(this.effector, this.joint);
        this.toTarget.subVectors(this.target, this.joint);

        const lenA = this.toEffector.length();
        const lenB = this.toTarget.length();
        if (lenA < 1e-6 || lenB < 1e-6) continue;

        this.toEffector.multiplyScalar(1 / lenA);
        this.toTarget.multiplyScalar(1 / lenB);
        this.correction.setFromUnitVectors(this.toEffector, this.toTarget);

        jointBone.getWorldQuaternion(this.currentWorldQuaternion);
        this.desiredWorldQuaternion
          .copy(this.correction)
          .multiply(this.currentWorldQuaternion);

        if (jointBone.parent) {
          jointBone.parent.getWorldQuaternion(this.parentWorldQuaternion);
          jointBone.quaternion
            .copy(this.parentWorldQuaternion.invert())
            .multiply(this.desiredWorldQuaternion)
            .normalize();
        } else {
          jointBone.quaternion.copy(this.desiredWorldQuaternion).normalize();
        }

        jointBone.updateWorldMatrix(true, true);

        if (effectorBone.getWorldPosition(new THREE.Vector3()).distanceToSquared(this.target) < 1e-6) {
          break;
        }
      }
    }

    // If the target is beyond the chain's reach, translate only the root
    // enough to keep the chain responsive. This is the "body leans toward
    // the finger" behavior instead of lengthening a bone.
    root.updateWorldMatrix(true, true);
    const rootWorld = root.getWorldPosition(new THREE.Vector3());
    const finalEffector = this.chain[this.chain.length - 1].getWorldPosition(new THREE.Vector3());
    const error = this.target.clone().sub(finalEffector);
    const totalLength = this.chain.slice(0, -1).reduce((sum, bone) => {
      const child = bone.children.find(value => (value as THREE.Bone).isBone);
      return child ? sum + bone.getWorldPosition(new THREE.Vector3()).distanceTo(child.getWorldPosition(new THREE.Vector3())) : sum;
    }, 0);

    if (error.length() > Math.max(totalLength * 0.08, 0.02)) {
      const shift = error.multiplyScalar(Math.min(0.18, 0.35 / Math.max(error.length(), 0.001)));
      const desiredRoot = rootWorld.add(shift);
      if (root.parent) {
        root.position.copy(root.parent.worldToLocal(desiredRoot));
      } else {
        root.position.copy(desiredRoot);
      }
    }

    root.updateWorldMatrix(true, true);
  }
}
