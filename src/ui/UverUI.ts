import * as THREE from "three";
import {TransformGizmoManager, type TransformMode} from "../engine/gizmos/TransformGizmoManager";
import {ViewportSelectionController} from "../engine/selection/ViewportSelectionController";

export class UverUI {
  private root: THREE.Object3D | null = null;
  private currentModel: THREE.Object3D | null = null;
  private wireframe = false;
  private paused = false;
  private panel: HTMLElement | null = null;
  private readonly materialStates = new Map<THREE.Material, boolean>();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly gizmos: TransformGizmoManager,
    private readonly selection: ViewportSelectionController,
    private readonly onFrame: () => void,
    private readonly onPause: (paused: boolean) => void,
    private readonly onCameraSnap: (axis: "x" | "y" | "z") => void
  ) {
    this.install();
  }

  setRoot(root: THREE.Object3D | null) {
    this.root = root;
    this.currentModel = root;
    this.refreshTree();
  }

  private install() {
    const host = document.createElement("div");
    host.id = "uver-ui";
    host.innerHTML = `
      <div class="uver-topbar">
        <button class="uver-icon" data-panel="select" title="Selection">☷</button>
        <button class="uver-icon" data-panel="view" title="View">◉</button>
        <button class="uver-icon" data-panel="environment" title="Environment">☀</button>
        <button class="uver-icon" data-panel="scene" title="Scene">⚙</button>
        <div class="uver-spacer"></div>
        <button class="uver-icon" data-action="reset" title="Frame model">⌖</button>
        <button class="uver-icon" data-action="pause" title="Pause animation">Ⅱ</button>
      </div>

      <div class="uver-panel" hidden></div>

      <div class="uver-transformbar">
        <button class="uver-tool active" data-mode="translate">Move</button>
        <button class="uver-tool" data-mode="rotate">Rotate</button>
        <button class="uver-tool" data-mode="scale">Scale</button>
        <span class="uver-divider"></span>
        <button class="uver-tool" data-space="world">World</button>
        <button class="uver-tool" data-space="local">Local</button>
      </div>

      <div class="uver-axis">
        <button data-axis="x">X</button>
        <button data-axis="y">Y</button>
        <button data-axis="z">Z</button>
      </div>
    `;
    document.body.appendChild(host);

    host.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach(button => {
      button.addEventListener("click", () => {
        const mode = button.dataset.mode as TransformMode;
        this.gizmos.setMode(mode);
        host.querySelectorAll("[data-mode]").forEach(item => item.classList.toggle("active", item === button));
      });
    });

    host.querySelectorAll<HTMLButtonElement>("[data-space]").forEach(button => {
      button.addEventListener("click", () => {
        const space = button.dataset.space as "world" | "local";
        this.gizmos.setSpace(space);
        host.querySelectorAll("[data-space]").forEach(item => item.classList.toggle("active", item === button));
      });
    });

    host.querySelectorAll<HTMLButtonElement>("[data-panel]").forEach(button => {
      button.addEventListener("click", () => this.togglePanel(button.dataset.panel!));
    });

    host.querySelector<HTMLButtonElement>('[data-action="reset"]')?.addEventListener("click", () => this.onFrame());
    host.querySelector<HTMLButtonElement>('[data-action="pause"]')?.addEventListener("click", event => {
      this.paused = !this.paused;
      (event.currentTarget as HTMLButtonElement).textContent = this.paused ? "▶" : "Ⅱ";
      this.onPause(this.paused);
    });

    host.querySelectorAll<HTMLButtonElement>("[data-axis]").forEach(button => {
      button.addEventListener("click", () => this.onCameraSnap(button.dataset.axis as "x" | "y" | "z"));
    });
  }

  private togglePanel(name: string) {
    const panel = document.querySelector<HTMLElement>(".uver-panel");
    if (!panel) return;
    if (!panel.hidden && panel.dataset.panel === name) {
      panel.hidden = true;
      this.panel = null;
      return;
    }

    panel.dataset.panel = name;
    panel.hidden = false;
    this.panel = panel;
    if (name === "select") this.renderSelectionPanel(panel);
    if (name === "view") this.renderViewPanel(panel);
    if (name === "environment") this.renderEnvironmentPanel(panel);
    if (name === "scene") this.renderScenePanel(panel);
  }

  private renderSelectionPanel(panel: HTMLElement) {
    panel.innerHTML = `
      <div class="uver-panel-title">Scene</div>
      <div class="uver-tree" id="uver-tree"></div>
    `;
    this.refreshTree();
  }

  private refreshTree() {
    const tree = document.querySelector<HTMLElement>("#uver-tree");
    if (!tree) return;
    tree.innerHTML = "";
    if (!this.root) {
      tree.innerHTML = '<div class="uver-empty">Import a model to inspect it.</div>';
      return;
    }

    const add = (object: THREE.Object3D, depth: number) => {
      if (object !== this.root && object.visible === false) return;
      const isBone = (object as THREE.Bone).isBone;
      const isMesh = (object as THREE.Mesh).isMesh || (object as THREE.SkinnedMesh).isSkinnedMesh;
      if (object !== this.root && !isBone && !isMesh) {
        for (const child of object.children) add(child, depth);
        return;
      }

      const row = document.createElement("button");
      row.className = "uver-tree-row";
      row.style.paddingLeft = `${10 + depth * 14}px`;
      row.innerHTML = `<span class="uver-tree-mark">${isBone ? "◇" : isMesh ? "□" : "○"}</span><span>${object.name || (isBone ? "Bone" : "Object")}</span>`;
      row.addEventListener("click", () => {
        if (isBone) this.selection.selectBoneObject(object as THREE.Bone);
        else this.selection.selectObjectDirect(object);
      });
      tree.appendChild(row);
      for (const child of object.children) add(child, depth + 1);
    };

    add(this.root, 0);
  }

  private renderViewPanel(panel: HTMLElement) {
    panel.innerHTML = `
      <div class="uver-panel-title">View / Display</div>
      <label class="uver-toggle"><span>Wireframe</span><input id="uver-wire" type="checkbox" ${this.wireframe ? "checked" : ""}></label>
      <label class="uver-toggle"><span>Grid</span><input id="uver-grid" type="checkbox" checked></label>
      <button class="uver-row-button" id="uver-bounds">Frame selection</button>
    `;

    panel.querySelector<HTMLInputElement>("#uver-wire")?.addEventListener("change", event => {
      this.wireframe = (event.target as HTMLInputElement).checked;
      this.applyWireframe();
    });
    panel.querySelector<HTMLInputElement>("#uver-grid")?.addEventListener("change", event => {
      const visible = (event.target as HTMLInputElement).checked;
      const grid = this.scene.children.find(child => child.type === "GridHelper");
      if (grid) grid.visible = visible;
    });
    panel.querySelector("#uver-bounds")?.addEventListener("click", () => this.onFrame());
  }

  private renderEnvironmentPanel(panel: HTMLElement) {
    panel.innerHTML = `
      <div class="uver-panel-title">Environment</div>
      <div class="uver-preset-grid">
        <button data-env="studio">Studio</button>
        <button data-env="dark">Dark</button>
        <button data-env="warm">Warm</button>
        <button data-env="bright">Bright</button>
      </div>
    `;
    panel.querySelectorAll<HTMLButtonElement>("[data-env]").forEach(button => {
      button.addEventListener("click", () => this.applyEnvironment(button.dataset.env!));
    });
  }

  private renderScenePanel(panel: HTMLElement) {
    panel.innerHTML = `
      <div class="uver-panel-title">Scene Settings</div>
      <button class="uver-row-button" id="uver-clear-selection">Clear selection</button>
      <button class="uver-row-button" id="uver-reset-view">Reset camera</button>
      <div class="uver-small">Bone editing uses the actual imported skeleton. Camera gestures are blocked while a gizmo drag is active.</div>
    `;
    panel.querySelector("#uver-clear-selection")?.addEventListener("click", () => this.selection.clearSelection());
    panel.querySelector("#uver-reset-view")?.addEventListener("click", () => this.onFrame());
  }

  private applyWireframe() {
    if (!this.currentModel) return;
    this.currentModel.traverse(object => {
      if (!(object as THREE.Mesh).isMesh) return;
      const materials = Array.isArray((object as THREE.Mesh).material)
        ? (object as THREE.Mesh).material as THREE.Material[]
        : [(object as THREE.Mesh).material as THREE.Material];

      for (const material of materials) {
        if (!("wireframe" in material)) continue;
        const wireMaterial = material as THREE.Material & { wireframe: boolean };
        wireMaterial.wireframe = this.wireframe;
        wireMaterial.needsUpdate = true;
      }
    });
  }

  private applyEnvironment(name: string) {
    const presets: Record<string, {background: number; hemi: number; key: number}> = {
      studio: {background: 0x111214, hemi: 2.2, key: 2.5},
      dark: {background: 0x050607, hemi: 1.0, key: 1.2},
      warm: {background: 0x211914, hemi: 1.8, key: 2.0},
      bright: {background: 0x30343a, hemi: 3.0, key: 3.2}
    };
    const preset = presets[name];
    if (!preset) return;
    this.scene.background = new THREE.Color(preset.background);
    const hemi = this.scene.children.find(child => child instanceof THREE.HemisphereLight) as THREE.HemisphereLight | undefined;
    const key = this.scene.children.find(child => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight | undefined;
    if (hemi) hemi.intensity = preset.hemi;
    if (key) key.intensity = preset.key;
  }
}
