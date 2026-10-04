export interface PerformanceBudget{
  targetTriangles:number;
  targetDrawCalls:number;
  targetTextureMB:number;
  targetBones:number;
  targetPhysicsBodies:number;
  targetPhysicsConstraints:number;
}

export function createPerformanceBudget():PerformanceBudget{
  return {
    targetTriangles:150000,
    targetDrawCalls:80,
    targetTextureMB:96,
    targetBones:180,
    targetPhysicsBodies:80,
    targetPhysicsConstraints:160
  };
}
