import * as THREE from "three";
import type {PerformanceTier} from "../../core/device/DeviceCapabilities";
import {PerformanceBudget,createPerformanceBudget} from "./PerformanceBudget";
import {ModelMetrics,measureModel} from "./ModelMetrics";

export interface PerformanceSnapshot {
  fps: number;
  drawCalls: number;
  budget: PerformanceBudget;
  tier: PerformanceTier;
}

export class PerformanceManager {
  readonly budget: PerformanceBudget;
  readonly tier: PerformanceTier;
  private fps = 60;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    tier: PerformanceTier = "medium"
  ) {
    this.tier = tier;
    this.budget = createPerformanceBudget(tier);
  }

  measureModel(root: THREE.Object3D): ModelMetrics {
    return measureModel(root);
  }

  recordFrame(delta: number) {
    this.fps = delta > 0 ? 1 / delta : 60;
  }

  getFPS() {
    return this.fps;
  }

  getDrawCalls() {
    return this.renderer.info.render.calls;
  }

  snapshot(): PerformanceSnapshot {
    return {
      fps: this.fps,
      drawCalls: this.getDrawCalls(),
      budget: this.budget,
      tier: this.tier
    };
  }
}
