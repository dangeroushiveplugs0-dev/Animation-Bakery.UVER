import * as THREE from "three";
export class SceneManager{
  readonly renderer:THREE.WebGLRenderer; readonly scene=new THREE.Scene(); readonly camera=new THREE.PerspectiveCamera(55,1,.01,1000);
  constructor(canvas:HTMLCanvasElement){
    this.scene.background=new THREE.Color(0x101114);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    this.camera.position.set(3,2.2,4.5); this.camera.lookAt(0,0,0);
    const grid=new THREE.GridHelper(20,20,0x39404a,0x252a31); this.scene.add(grid);
    const cube=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),new THREE.MeshStandardMaterial({color:0x7d8794,roughness:.72,metalness:0}));
    cube.position.y=.7; this.scene.add(cube);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x20242b,2.2));
    const key=new THREE.DirectionalLight(0xffffff,2.5); key.position.set(4,6,3); this.scene.add(key);
  }
  resize(){const w=Math.max(1,this.renderer.domElement.clientWidth),h=Math.max(1,this.renderer.domElement.clientHeight);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false)}
  render(){this.renderer.render(this.scene,this.camera)}
}