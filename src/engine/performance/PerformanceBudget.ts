import type {PerformanceTier} from "../../core/device/DeviceCapabilities";

export interface PerformanceBudget {
  targetTriangles: number;
  targetDrawCalls: number;
  targetTextureMB: number;
  targetBones: number;
  targetPhysicsBodies: number;
  targetPhysicsConstraints: number;
  physicsUpdateHz: number;
}

const BUDGETS: Record<PerformanceTier, PerformanceBudget> = {
  low: {
    targetTriangles: 80000,
    targetDrawCalls: 45,
    targetTextureMB: 48,
    targetBones: 100,
    targetPhysicsBodies: 35,
    targetPhysicsConstraints: 70,
    physicsUpdateHz: 30
  },
  medium: {
    targetTriangles: 150000,
    targetDrawCalls: 80,
    targetTextureMB: 96,
    targetBones: 180,
    targetPhysicsBodies: 80,
    targetPhysicsConstraints: 160,
    physicsUpdateHz: 60
  },
  high: {
    targetTriangles: 300000,
    targetDrawCalls: 140,
    targetTextureMB: 192,
    targetBones: 320,
    targetPhysicsBodies: 160,
    targetPhysicsConstraints: 320,
    physicsUpdateHz: 60
  }
};

export function createPerformanceBudget(tier: PerformanceTier = "medium"): PerformanceBudget {
  return {...BUDGETS[tier]};
}
