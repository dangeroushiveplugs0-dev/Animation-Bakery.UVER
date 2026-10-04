import "./styles.css";
import {SceneManager} from "./engine/SceneManager";
import {CameraControls} from "./engine/CameraControls";
import {PhysicsEngine} from "./engine/physics/PhysicsEngine";
const app=document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML=`<canvas id="viewport"></canvas><div class="hud"><strong>Animation Bakery <span>UVER</span></strong><small>Three.js WebGL2 • Camera Controls</small></div><div class="hint">1 finger: orbit • 2 fingers: pan/zoom</div>`;
const canvas=document.querySelector<HTMLCanvasElement>("#viewport")!;
const scene=new SceneManager(canvas);
const camera=new CameraControls(scene.camera,canvas);
const physics=new PhysicsEngine();
await physics.init();
function frame(time:number){camera.update(time/1000);physics.step(1/60);scene.render();requestAnimationFrame(frame)}
requestAnimationFrame(frame);
addEventListener("resize",()=>scene.resize());
scene.resize();