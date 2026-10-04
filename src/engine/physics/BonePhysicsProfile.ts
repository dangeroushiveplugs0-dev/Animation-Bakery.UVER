export type BonePhysicsType =
  | "none"
  | "spring"
  | "jiggle"
  | "secondary"
  | "follow"
  | "dynamic"
  | "collision";

export interface BonePhysicsProfile{
  boneName:string;
  type:BonePhysicsType;
  stiffness:number;
  damping:number;
  mass:number;
  gravityScale:number;
  influence:number;
  collisionEnabled:boolean;
}

export function createBonePhysicsProfile(boneName:string):BonePhysicsProfile{
  return {
    boneName,
    type:"none",
    stiffness:.5,
    damping:.25,
    mass:1,
    gravityScale:1,
    influence:1,
    collisionEnabled:false
  };
}
