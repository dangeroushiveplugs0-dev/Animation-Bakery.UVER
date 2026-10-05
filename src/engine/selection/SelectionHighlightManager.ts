import * as THREE from "three";

export type SelectionMode="object"|"part"|"face";

export interface SelectionRenderPolicy{
  mode:SelectionMode;
  maxWireDistance:number;
  maxHighlightedEdges:number;
  showUnselectedWireframe:boolean;
}

export class SelectionHighlightManager{
  readonly policy:SelectionRenderPolicy={
    mode:"object",
    maxWireDistance:4,
    maxHighlightedEdges:12000,
    showUnselectedWireframe:false
  };

  private outline:THREE.LineSegments|null=null;

  constructor(private readonly scene:THREE.Scene){}

  selectObject(object:THREE.Object3D):void{
    this.clear();
    const box=new THREE.Box3().setFromObject(object);
    if(box.isEmpty()) return;

    const geometry=new THREE.BoxGeometry(
      Math.max(box.max.x-box.min.x,0.001),
      Math.max(box.max.y-box.min.y,0.001),
      Math.max(box.max.z-box.min.z,0.001)
    );
    const edges=new THREE.EdgesGeometry(geometry);
    geometry.dispose();

    const material=new THREE.LineBasicMaterial({
      color:0xa8ef3f,
      depthTest:false,
      transparent:true,
      opacity:.95
    });

    this.outline=new THREE.LineSegments(edges,material);
    this.outline.name="SelectionOutline";
    this.outline.position.copy(box.getCenter(new THREE.Vector3()));
    this.scene.add(this.outline);
  }

  clear():void{
    if(!this.outline) return;
    this.outline.geometry.dispose();
    (this.outline.material as THREE.Material).dispose();
    this.scene.remove(this.outline);
    this.outline=null;
  }

  update(camera:THREE.Camera,selectedObject:THREE.Object3D|null):void{
    if(!selectedObject||!this.outline) return;

    const center=new THREE.Box3()
      .setFromObject(selectedObject)
      .getCenter(new THREE.Vector3());

    const distance=camera.position.distanceTo(center);
    this.outline.visible=distance<=this.policy.maxWireDistance*4;
  }
}
