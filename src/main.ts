import "./styles.css";
import * as THREE from "three";
import {SceneManager} from "./engine/SceneManager";
import {CameraControls} from "./engine/CameraControls";
import {TransformGizmoManager} from "./engine/gizmos/TransformGizmoManager";
import {BoneOverlayManager} from "./engine/rig/BoneOverlayManager";
import {PhysicsEngine} from "./engine/physics/PhysicsEngine";
import {AssetManager} from "./engine/AssetManager";
import {PerformanceManager} from "./engine/performance/PerformanceManager";
import {BrowserDeviceCapabilities} from "./engine/device/BrowserDeviceCapabilities";
import {AnimationManager} from "./engine/animation/AnimationManager";
import {CharacterController} from "./character/CharacterController";
import {DistanceQualityManager} from "./engine/performance/DistanceQualityManager";
import {SelectionManager} from "./engine/selection/SelectionManager";
import {SelectionHighlightManager} from "./engine/selection/SelectionHighlightManager";
import {ViewportSelectionController} from "./engine/selection/ViewportSelectionController";
import {UverUI} from "./ui/UverUI";

const app=document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML=
  '<canvas id="viewport"></canvas>'+
  '<div class="hud"><strong>Animation Bakery <span>UVER</span></strong><small>0.1.7 • Three.js WebGL2</small></div>'+
  '<div class="toolbar"><label class="tool-button">Import Model<input id="model-input" type="file" accept=".blend,.glb,.gltf,.obj,.bin,.png,.jpg,.jpeg" multiple hidden></label></div>'+
  '<div id="status" class="status" hidden></div>'+
  '<div class="hint">1 finger: orbit • 2 fingers: pan/zoom</div>';

const canvas=document.querySelector<HTMLCanvasElement>("#viewport")!;
const scene=new SceneManager(canvas);

// Selection/gizmo listeners are registered before camera-controls so a gizmo
// or bone can claim a gesture without the camera also starting an orbit.
const selectionState=new SelectionManager();
const highlight=new SelectionHighlightManager(scene.scene);
const gizmos=new TransformGizmoManager(scene.scene,scene.camera,canvas);
const bones=new BoneOverlayManager(scene.scene,scene.camera,canvas);
const viewportSelection=new ViewportSelectionController(
  scene.camera,
  canvas,
  selectionState,
  highlight,
  gizmos,
  bones
);

const camera=new CameraControls(scene.camera,canvas);
const physics=new PhysicsEngine();
const assets=new AssetManager(scene.scene,scene.renderer);
const device=new BrowserDeviceCapabilities().detect();
const performance=new PerformanceManager(scene.renderer,device.performanceTier);
const distanceQuality=new DistanceQualityManager(scene.renderer);
const animation=new AnimationManager();
const character=new CharacterController();
const input=document.querySelector<HTMLInputElement>("#model-input")!;
const status=document.querySelector<HTMLDivElement>("#status")!;
let importing=false;
let currentModel:THREE.Object3D|null=null;
let paused=false;

const ui=new UverUI(
  scene.scene,
  gizmos,
  viewportSelection,
  ()=>{ if(currentModel) camera.frameObject(currentModel); },
  value=>{ paused=value; },
  axis=>camera.snapTo(axis)
);

function showStatus(message:string){
  status.textContent=message;
  status.hidden=false;
  window.setTimeout(()=>{
    status.hidden=true;
  },2200);
}

input.addEventListener("change",async()=>{
  if(importing) return;
  const files=Array.from(input.files||[]);
  const file=files.find(value=>/\.(blend|glb|gltf|obj)$/i.test(value.name));
  if(!file) return;
  importing=true;
  showStatus("Loading model…");
  try{
    const model=await assets.loadModels(files);
    currentModel=model;
    viewportSelection.setRoot(model);
    ui.setRoot(model);
    camera.frameObject(model);
    character.inspect(model);
    animation.dispose();
    distanceQuality.reset();
    showStatus("Model ready");
  }catch(error){
    console.error(error);
    showStatus(error instanceof Error?error.message:"Import failed");
  }finally{
    importing=false;
    input.value="";
  }
});

await physics.init();
let previous=globalThis.performance.now();

function frame(time:number){
  const delta=Math.min((time-previous)/1000,0.05);
  previous=time;
  camera.update(delta);
  physics.step(delta);
  if(!paused) animation.update(delta);
  bones.update();
  gizmos.sync();
  distanceQuality.update(scene.camera,currentModel);
  performance.recordFrame(delta);
  scene.render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
addEventListener("resize",()=>scene.resize());
scene.resize();
console.info("UVER device capabilities",device);
