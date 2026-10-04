import * as THREE from "three";

export class SelectionManager{
  private selected?:THREE.Object3D;

  select(object?:THREE.Object3D){
    this.selected=object;
  }

  clear(){
    this.selected=undefined;
  }

  getSelected(){
    return this.selected;
  }

  isSelected(object:THREE.Object3D){
    return this.selected===object;
  }
}
