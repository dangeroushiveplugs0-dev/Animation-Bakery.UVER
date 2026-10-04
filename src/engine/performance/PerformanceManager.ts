import * as THREE from "three";
import {PerformanceBudget,createPerformanceBudget} from "./PerformanceBudget";
import {ModelMetrics,measureModel} from "./ModelMetrics";

export class PerformanceManager{
  readonly budget:PerformanceBudget;
  private fps=60;

  constructor(private readonly renderer:THREE.WebGLRenderer,budget=createPerformanceBudget()){
    this.budget=budget;
  }

  measureModel(root:THREE.Object3D):ModelMetrics{
    return measureModel(root);
  }

  recordFrame(delta:number){
    this.fps=delta>0?1/delta:60;
  }

  getFPS(){return this.fps;}
  getDrawCalls(){return this.renderer.info.render.calls;}
}
