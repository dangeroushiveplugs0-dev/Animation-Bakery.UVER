import * as THREE from "three";
import type {AnimationLifecycle} from "../../core/animation/AnimationLifecycle";

export class AnimationManager implements AnimationLifecycle {
  private mixer?: THREE.AnimationMixer;
  private activeAction?: THREE.AnimationAction;
  private activeClip?: THREE.AnimationClip;
  private fps = 30;

  load(root: THREE.Object3D, clip?: THREE.AnimationClip) {
    this.dispose();
    if (!clip) return;
    this.mixer = new THREE.AnimationMixer(root);
    this.activeClip = clip;
    this.activeAction = this.mixer.clipAction(clip);
    this.activeAction.play();
  }

  setFPS(fps: number) {
    this.fps = Math.max(1, Math.min(240, fps));
  }

  update(delta: number) {
    this.mixer?.update(delta);
  }

  getFPS() {
    return this.fps;
  }

  getActiveClip() {
    if (!this.activeClip) return undefined;
    return {
      id: this.activeClip.uuid,
      name: this.activeClip.name,
      fps: this.fps,
      duration: this.activeClip.duration,
      loop: true
    };
  }

  dispose() {
    if (this.activeAction) {
      this.activeAction.stop();
      this.activeAction.reset();
    }
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
    }
    this.mixer = undefined;
    this.activeAction = undefined;
    this.activeClip = undefined;
  }
}
