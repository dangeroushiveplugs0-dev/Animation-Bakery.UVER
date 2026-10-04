import * as THREE from "three";
import CameraControlsImpl from "camera-controls";
CameraControlsImpl.install({THREE});
export class CameraControls{
  private controls:CameraControlsImpl;
  constructor(camera:THREE.PerspectiveCamera,dom:HTMLElement){
    this.controls=new CameraControlsImpl(camera,dom);
    this.controls.dampingFactor=.12;
    this.controls.draggingDampingFactor=.18;
    this.controls.smoothTime=.16;
    this.controls.azimuthRotateSpeed=.55;
    this.controls.polarRotateSpeed=.55;
    this.controls.dollySpeed=.9;
    this.controls.truckSpeed=1;
    this.controls.maxPolarAngle=Math.PI-.05;
    this.controls.minDistance=.35;
    this.controls.maxDistance=100;
    this.controls.saveState();
  }
  update(delta:number){this.controls.update(delta)}
}