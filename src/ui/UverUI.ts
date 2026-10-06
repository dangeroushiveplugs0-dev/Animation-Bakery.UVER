import * as THREE from "three";
import {TransformGizmoManager, type TransformMode} from "../engine/gizmos/TransformGizmoManager";
import {ViewportSelectionController} from "../engine/selection/ViewportSelectionController";

type PanelName = "select" | "view" | "environment" | "scene";

export class UverUI {
  private root: THREE.Object3D | null = null;
  private currentModel: THREE.Object3D | null = null;
  private wireframe = false;
  private paused = false;
  private activePanel: PanelName | null = null;
  private panel: HTMLElement | null = null;
  private readonly materialStates = new Map<THREE.Material, boolean>();
  private readonly unsubscribeSelection: () => void;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly gizmos: TransformGizmoManager,
    private readonly selection: ViewportSelectionController,
    private readonly onFrame: () => void,
    private readonly onPause: (paused: boolean) => void,
    private readonly onCameraSnap: (axis: "x" | "y" | "z", sign: 1 | -1) => void
  ) {
    this.unsubscribeSelection = this.selection.getSelectionManager().subscribe(() => {
      if (this.activePanel === "select") this.refreshTree();
    });
    this.install();
  }

  setRoot(root: THREE.Object3D | null) {
    this.root = root;
    this.currentModel = root;
    this.refreshTree();
  }

  dispose() {
    this.unsubscribeSelection();
    document.getElementById("uver-ui")?.remove();
  }

  updateAxisFromCamera(camera: THREE.PerspectiveCamera) {
    const cube = document.querySelector<HTMLElement>(".uver-axis-cube");
    if (!cube) return;

    camera.updateMatrixWorld(true);
    const q = camera.quaternion.clone().invert();

    // The cube uses the inverse camera rotation, so it behaves like a real
    // modeling-app orientation gizmo rather than a fixed XYZ button cluster.
    cube.style.transform =
      "rotateX(" + THREE.MathUtils.radToDeg(new THREE.Euler().setFromQuaternion(q, "YXZ").x) + "deg) " +
      "rotateY(" + THREE.MathUtils.radToDeg(new THREE.Euler().setFromQuaternion(q, "YXZ").y) + "deg) " +
      "rotateZ(" + THREE.MathUtils.radToDeg(new THREE.Euler().setFromQuaternion(q, "YXZ").z) + "deg)";

    const faces = cube.querySelectorAll<HTMLElement>("[data-axis-face]");
    const axes: Record<string, THREE.Vector3> = {
      x: new THREE.Vector3(1, 0, 0),
      y: new THREE.Vector3(0, 1, 0),
      z: new THREE.Vector3(0, 0, 1)
    };
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    faces.forEach(face => {
      const axis = axes[face.dataset.axisFace || "x"];
      const facing = Math.abs(axis.dot(forward));
      face.style.opacity = String(0.38 + facing * 0.62);
    });
  }


  private install() {
    const host = document.createElement("div");
    host.id = "uver-ui";
    host.innerHTML = `
      <div class="uver-command-rail">
        <div class="uver-rail-group">
          <button class="uver-rail-button active" data-mode="translate" aria-label="Move" title="Move">✣</button>
          <button class="uver-rail-button" data-mode="rotate" aria-label="Rotate" title="Rotate">↻</button>
          <button class="uver-rail-button" data-mode="scale" aria-label="Scale" title="Scale">↗</button>
        </div>
        <span class="uver-rail-separator"></span>
        <div class="uver-rail-group">
          <button class="uver-rail-button" data-panel="select" aria-label="Selection" title="Selection">☷</button>
          <button class="uver-rail-button" data-panel="view" aria-label="View" title="View">◉</button>
          <button class="uver-rail-button" data-panel="environment" aria-label="Environment" title="Environment">☼</button>
          <button class="uver-rail-button" data-panel="scene" aria-label="Scene settings" title="Scene settings">⚙</button>
        </div>
        <span class="uver-rail-separator"></span>
        <div class="uver-rail-group">
          <button class="uver-rail-button" data-space="world" aria-label="World space" title="World space">W</button>
          <button class="uver-rail-button" data-space="local" aria-label="Local space" title="Local space">L</button>
          <button class="uver-rail-button" data-action="reset" aria-label="Frame model" title="Frame model">⌖</button>
          <button class="uver-rail-button" data-action="pause" aria-label="Pause animation" title="Pause animation">Ⅱ</button>
        </div>
      </div>

      <div class="uver-panel" hidden></div>

      <div class="uver-axis-widget" aria-label="3D view axis">
        <div class="uver-axis-stage">
          <div class="uver-axis-cube" aria-hidden="true">
            <button class="uver-axis-face front" data-axis="z" data-sign="1">Z</button>
            <button class="uver-axis-face back" data-axis="z" data-sign="-1">Z</button>
            <button class="uver-axis-face right" data-axis="x" data-sign="1">X</button>
            <button class="uver-axis-face left" data-axis="x" data-sign="-1">X</button>
            <button class="uver-axis-face top" data-axis="y" data-sign="1">Y</button>
            <button class="uver-axis-face bottom" data-axis="y" data-sign="-1">Y</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(host);

    host.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach(button => {
      button.addEventListener("click", () => {
        this.gizmos.setMode(button.dataset.mode as TransformMode);
        host.querySelectorAll("[data-mode]").forEach(item => item.classList.toggle("active", item === button));
      });
    });

    host.querySelectorAll<HTMLButtonElement>("[data-space]").forEach(button => {
      button.addEventListener("click", () => {
        this.gizmos.setSpace(button.dataset.space as "world" | "local");
        host.querySelectorAll("[data-space]").forEach(item => item.classList.toggle("active", item === button));
      });
    });

    host.querySelectorAll<HTMLButtonElement>("[data-panel]").forEach(button => {
      button.addEventListener("click", () => this.togglePanel(button.dataset.panel as PanelName));
    });

    host.querySelector<HTMLButtonElement>('[data-action="reset"]')?.addEventListener("click", () => this.onFrame());
    host.querySelector<HTMLButtonElement>('[data-action="pause"]')?.addEventListener("click", event => {
      this.paused = !this.paused;
      const button = event.currentTarget as HTMLButtonElement;
      button.textContent = this.paused ? "▶" : "Ⅱ";
      button.classList.toggle("active", this.paused);
      this.onPause(this.paused);
    });

    host.querySelectorAll<HTMLButtonElement>("[data-axis]").forEach(button => {
      button.addEventListener("click", () => this.onCameraSnap(button.dataset.axis as "x" | "y" | "z"));
    });
  }

  private togglePanel(name: PanelName) {
    const panel = document.querySelector<HTMLElement>(".uver-panel");
    if (!panel) return;

    if (this.activePanel === name && !panel.hidden) {
      panel.hidden = true;
      this.activePanel = null;
      this.panel = null;
      return;
    }

    this.activePanel = name;
    this.panel = panel;
    panel.dataset.panel = name;
    panel.hidden = false;

    if (name === "select") this.renderSelectionPanel(panel);
    if (name === "view") this.renderViewPanel(panel);
    if (name === "environment") this.renderEnvironmentPanel(panel);
    if (name === "scene") this.renderScenePanel(panel);
  }

  private renderSelectionPanel(panel: HTMLElement) {
    panel.innerHTML = `
      <div class="uver-panel-head">
        <strong>Selection</strong>
        <button class="uver-panel-close" aria-label="Close">×</button>
      </div>
      <div class="uver-tree" id="uver-tree"></div>
      <div class="uver-selection-details" id="uver-selection-details"></div>
    `;
    panel.querySelector(".uver-panel-close")?.addEventListener("click", () => this.closePanel());
    this.refreshTree();
  }

  private refreshTree() {
    const tree = document.querySelector<HTMLElement>("#uver-tree");
    const details = document.querySelector<HTMLElement>("#uver-selection-details");
    if (!tree) return;

    tree.innerHTML = "";
    if (!this.root) {
      tree.innerHTML = '<div class="uver-empty">Import a model to inspect it.</div>';
      return;
    }

    const selected = this.selection.getSelectionManager().getSelected();
    const add = (object: THREE.Object3D, depth: number) => {
      const isBone = (object as THREE.Bone).isBone;
      const isMesh = (object as THREE.Mesh).isMesh || (object as THREE.SkinnedMesh).isSkinnedMesh;
      const hasSelectableChild = object.children.some(child =>
        (child as THREE.Bone).isBone ||
        (child as THREE.Mesh).isMesh ||
        (child as THREE.SkinnedMesh).isSkinnedMesh
      );

      if (object !== this.root && !isBone && !isMesh) {
        if (hasSelectableChild) {
          for (const child of object.children) add(child, depth);
        }
        return;
      }

      const row = document.createElement("button");
      row.className = "uver-tree-row";
      if (selected?.objectId === object.uuid) row.classList.add("selected");
      row.style.paddingLeft = `${10 + depth * 13}px`;

      const icon = isBone ? "◇" : isMesh ? "□" : "○";
      row.innerHTML = `<span class="uver-tree-chevron">${object.children.length ? "›" : ""}</span><span class="uver-tree-mark">${icon}</span><span class="uver-tree-name">${this.escape(object.name || (isBone ? "Bone" : "Object"))}</span>`;

      row.addEventListener("click", () => {
        if (isBone) this.selection.selectBoneObject(object as THREE.Bone);
        else this.selection.selectObjectDirect(object);
        this.refreshTree();
      });
      tree.appendChild(row);

      for (const child of object.children) add(child, depth + 1);
    };

    add(this.root, 0);

    if (details) {
      const object = selected?.objectId ? this.findObject(selected.objectId) : null;
      details.innerHTML = this.renderSelectionDetails(object);
    }
  }

  private renderSelectionDetails(object: THREE.Object3D | null): string {
    if (!object) return '<div class="uver-empty">Select a mesh or bone.</div>';

    if ((object as THREE.Bone).isBone) {
      const bone = object as THREE.Bone;
      return `
        <div class="uver-detail-title">Bone</div>
        <div class="uver-detail-row"><span>Name</span><strong>${this.escape(bone.name || "Bone")}</strong></div>
        <div class="uver-detail-row"><span>Children</span><strong>${bone.children.filter(child => (child as THREE.Bone).isBone).length}</strong></div>
      `;
    }

    const mesh = object as THREE.Mesh;
    const materials = mesh.material
      ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material])
      : [];

    return `
      <div class="uver-detail-title">Material</div>
      <div class="uver-detail-row"><span>Object</span><strong>${this.escape(object.name || "Mesh")}</strong></div>
      <div class="uver-detail-row"><span>Slots</span><strong>${materials.length}</strong></div>
      ${materials.slice(0, 4).map(material => `<div class="uver-material-chip"><span></span>${this.escape(material.name || material.type)}</div>`).join("")}
    `;
  }

  private renderViewPanel(panel: HTMLElement) {
    panel.innerHTML = `
      <div class="uver-panel-head"><strong>View</strong><button class="uver-panel-close" aria-label="Close">×</button></div>
      <div class="uver-section-label">Display</div>
      <label class="uver-toggle"><span>Material</span><input id="uver-material" type="checkbox" checked></label>
      <label class="uver-toggle"><span>Wireframe</span><input id="uver-wire" type="checkbox" ${this.wireframe ? "checked" : ""}></label>
      <label class="uver-toggle"><span>Grid</span><input id="uver-grid" type="checkbox" checked></label>
      <button class="uver-row-button" id="uver-bounds">Frame model</button>
    `;
    panel.querySelector(".uver-panel-close")?.addEventListener("click", () => this.closePanel());

    panel.querySelector<HTMLInputElement>("#uver-wire")?.addEventListener("change", event => {
      this.wireframe = (event.target as HTMLInputElement).checked;
      this.applyWireframe();
    });
    panel.querySelector<HTMLInputElement>("#uver-grid")?.addEventListener("change", event => {
      const grid = this.scene.children.find(child => child.type === "GridHelper");
      if (grid) grid.visible = (event.target as HTMLInputElement).checked;
    });
    panel.querySelector("#uver-bounds")?.addEventListener("click", () => this.onFrame());
  }

  private renderEnvironmentPanel(panel: HTMLElement) {
    panel.innerHTML = `
      <div class="uver-panel-head"><strong>Environment</strong><button class="uver-panel-close" aria-label="Close">×</button></div>
      <div class="uver-section-label">Lighting presets</div>
      <div class="uver-preset-grid">
        <button data-env="studio"><span>▣</span>Studio</button>
        <button data-env="dark"><span>◐</span>Dark</button>
        <button data-env="warm"><span>◒</span>Warm</button>
        <button data-env="bright"><span>☼</span>Bright</button>
      </div>
    `;
    panel.querySelector(".uver-panel-close")?.addEventListener("click", () => this.closePanel());
    panel.querySelectorAll<HTMLButtonElement>("[data-env]").forEach(button => {
      button.addEventListener("click", () => this.applyEnvironment(button.dataset.env!));
    });
  }

  private renderScenePanel(panel: HTMLElement) {
    panel.innerHTML = `
      <div class="uver-panel-head"><strong>Scene</strong><button class="uver-panel-close" aria-label="Close">×</button></div>
      <button class="uver-row-button" id="uver-clear-selection">Clear selection</button>
      <button class="uver-row-button" id="uver-reset-view">Reset camera</button>
      <div class="uver-small">Gizmo drags stay independent from camera orbit.</div>
    `;
    panel.querySelector(".uver-panel-close")?.addEventListener("click", () => this.closePanel());
    panel.querySelector("#uver-clear-selection")?.addEventListener("click", () => this.selection.clearSelection());
    panel.querySelector("#uver-reset-view")?.addEventListener("click", () => this.onFrame());
  }

  private closePanel() {
    if (!this.panel) return;
    this.panel.hidden = true;
    this.activePanel = null;
    this.panel = null;
  }

  private findObject(uuid: string): THREE.Object3D | null {
    if (!this.root) return null;
    let result: THREE.Object3D | null = null;
    this.root.traverse(object => {
      if (object.uuid === uuid) result = object;
    });
    return result;
  }

  private escape(value: string): string {
    return value.replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character] ?? character);
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
        const wireMaterial = material as THREE.Material & {wireframe: boolean};
        if (!this.materialStates.has(material)) this.materialStates.set(material, wireMaterial.wireframe);
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
