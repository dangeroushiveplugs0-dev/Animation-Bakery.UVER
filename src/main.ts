import "./styles.css";
import {SceneManager} from "./engine/SceneManager";
import {CameraControls} from "./engine/CameraControls";
import {PhysicsEngine} from "./engine/physics/PhysicsEngine";
import {AssetManager} from "./engine/AssetManager";

const app=document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML=`<canvas id="viewport"></canvas>
<div class="hud"><strong>Animation Bakery <span>UVER</span></strong><small>0.1.1 • Three.js WebGL2</small></div>
<div class="toolbar"><label class="tool-button">Import Model<input id="model-input" type="file" accept=".glb,.gltf,.obj" hidden></label></div>
<div id="status" class="status">Ready</div>
<div class="hint">1 finger: orbit • 2 fingers: pan/zoom</div>`;

const canvas=document.querySelector<HTMLCanvasElement>("#viewport")!;
const scene=new SceneManager(canvas);
const camera=new CameraControls(scene.camera,canvas);
const physics=new PhysicsEngine();
const assets=new AssetManager(scene.scene);
const input=document.querySelector<HTMLInputElement>("#model-input")!;
const status=document.querySelector<HTMLDivElement>("#status")!;

input.addEventListener("change",async()=>{
  const file=input.files?.[0];
  if(!file)return;
  status.textContent=`Loading ${file.name}…`;
  try{
    const model=await assets.loadModel(file);
    scene.frameObject(model);
    status.textContent=`Loaded ${file.name}`;
  }catch(error){
    console.error(error);
    status.textContent=error instanceof Error?error.message:"Import failed";
  }finally{input.value="";}
});

await physics.init();
let previous=performance.now();
function frame(time:number){
  const delta=Math.min((time-previous)/1000,0.05); previous=time;
  camera.update(delta); physics.step(delta); scene.render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
addEventListener("resize",()=>scene.resize());
scene.resize();