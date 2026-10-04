import "./styles.css";
import {SceneManager} from "./engine/SceneManager";
import {CameraControls} from "./engine/CameraControls";
import {PhysicsEngine} from "./engine/physics/PhysicsEngine";
import {AssetManager} from "./engine/AssetManager";
import {PerformanceManager} from "./engine/performance/PerformanceManager";
import {AnimationManager} from "./engine/animation/AnimationManager";
import {BrowserDeviceCapabilities} from "./engine/device/BrowserDeviceCapabilities";

const app=document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML=`<canvas id="viewport"></canvas>
<div class="hud"><strong>Animation Bakery <span>UVER</span></strong><small>0.1.3 • Three.js WebGL2</small></div>
<div class="toolbar"><label class="tool-button">Import Model<input id="model-input" type="file" accept=".glb,.gltf,.obj,.bin,.png,.jpg,.jpeg" multiple hidden></label></div>
<div id="status" class="status">Ready</div>
<div class="hint">1 finger: orbit • 2 fingers: pan/zoom</div>`;

const canvas=document.querySelector<HTMLCanvasElement>("#viewport")!;
const scene=new SceneManager(canvas);
const camera=new CameraControls(scene.camera,canvas);
const physics=new PhysicsEngine();
const assets=new AssetManager(scene.scene);
const device=new BrowserDeviceCapabilities().detect();
const performance=new PerformanceManager(scene.renderer,device.performanceTier);
const animation=new AnimationManager();
const input=document.querySelector<HTMLInputElement>("#model-input")!;
const status=document.querySelector<HTMLDivElement>("#status")!;

input.addEventListener("change",async()=>{
  const files=Array.from(input.files||[]);
  const file=files.find(value=>/\.(glb|gltf|obj)$/i.test(value.name));
  if(!file)return;
  status.textContent=`Loading ${file.name}…`;
  try{
    const model=await assets.loadModels(files);
    scene.frameObject(model);
    const metrics=performance.measureModel(model);
    status.textContent=`Loaded ${file.name} • ${metrics.triangles.toLocaleString()} tris • ${metrics.meshes} meshes`;
    animation.dispose();
  }catch(error){
    console.error(error);
    status.textContent=error instanceof Error?error.message:"Import failed";
  }finally{input.value="";}
});

await physics.init();
let previous=globalThis.performance.now();

function frame(time:number){
  const delta=Math.min((time-previous)/1000,0.05);
  previous=time;

  camera.update(delta);
  physics.step(delta);
  animation.update(delta);
  performance.recordFrame(delta);
  scene.render();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
addEventListener("resize",()=>scene.resize());
scene.resize();

console.info("UVER device capabilities",device);
