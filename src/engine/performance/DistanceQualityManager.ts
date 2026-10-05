import * as THREE from "three";

type QualityTier="close"|"medium"|"far"|"very-far";

export class DistanceQualityManager{
  private tier:QualityTier="close";
  private basePixelRatio=1;

  constructor(
    private readonly renderer:THREE.WebGLRenderer,
    private readonly devicePixelRatio=Math.min(globalThis.devicePixelRatio||1,1.75)
  ){
    this.basePixelRatio=this.devicePixelRatio;
    renderer.setPixelRatio(this.basePixelRatio);
  }

  update(camera:THREE.Camera,target:THREE.Object3D|null):void{
    if(!target) return;

    const box=new THREE.Box3().setFromObject(target);
    if(box.isEmpty()) return;

    const center=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3());
    const radius=Math.max(size.x,size.y,size.z)*0.5;
    const distance=camera.position.distanceTo(center);
    const normalized=distance/Math.max(radius,0.001);

    let next:QualityTier;
    if(normalized<5) next="close";
    else if(normalized<12) next="medium";
    else if(normalized<25) next="far";
    else next="very-far";

    if(next===this.tier) return;
    this.tier=next;

    const scale=next==="close"?1:next==="medium"?0.82:next==="far"?0.64:0.5;
    this.renderer.setPixelRatio(Math.max(0.5,this.basePixelRatio*scale));
  }

  get currentTier():QualityTier{
    return this.tier;
  }

  reset():void{
    this.tier="close";
    this.renderer.setPixelRatio(this.basePixelRatio);
  }
}
