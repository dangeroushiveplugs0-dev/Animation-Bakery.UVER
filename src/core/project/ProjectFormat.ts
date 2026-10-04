export const PROJECT_FORMAT = "AnimationBakeryProject";
export const CURRENT_PROJECT_VERSION = 1;

export interface ProjectManifest {
  format: typeof PROJECT_FORMAT;
  version: number;
  appVersion: string;
}

export interface AnimationBakeryProject {
  manifest: ProjectManifest;
  model: unknown;
  materials: unknown[];
  textures: unknown[];
  rig: unknown;
  animations: unknown[];
  physics: unknown;
  editor: unknown;
  pluginData: Record<string, unknown>;
}

export function createProjectManifest(appVersion: string): ProjectManifest {
  return {
    format: PROJECT_FORMAT,
    version: CURRENT_PROJECT_VERSION,
    appVersion
  };
}

export function createEmptyProject(appVersion: string): AnimationBakeryProject {
  return {
    manifest: createProjectManifest(appVersion),
    model: null,
    materials: [],
    textures: [],
    rig: null,
    animations: [],
    physics: null,
    editor: null,
    pluginData: {}
  };
}
