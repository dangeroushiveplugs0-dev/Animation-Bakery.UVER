import RAPIER from "@dimforge/rapier3d-compat";
import type {PhysicsLifecycle, PhysicsQuality} from "../../core/physics/PhysicsLifecycle";

export class PhysicsEngine implements PhysicsLifecycle {
  private world?: RAPIER.World;
  private quality: PhysicsQuality = "auto";
  private paused = false;

  async init() {
    await this.initialize();
  }

  async initialize() {
    if (this.world) return;
    await RAPIER.init();
    this.world = new RAPIER.World({x: 0, y: -9.81, z: 0});
  }

  setQuality(quality: PhysicsQuality) {
    this.quality = quality;
  }

  step(_dt: number) {
    if (this.paused || !this.world) return;
    this.world.step();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  clear() {
    this.world = undefined;
  }

  dispose() {
    this.clear();
  }

  getQuality() {
    return this.quality;
  }
}
