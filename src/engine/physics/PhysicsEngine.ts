import RAPIER from "@dimforge/rapier3d-compat";
export class PhysicsEngine{
  private world?:RAPIER.World;
  async init(){await RAPIER.init();this.world=new RAPIER.World({x:0,y:-9.81,z:0});}
  step(dt:number){this.world?.step();}
}