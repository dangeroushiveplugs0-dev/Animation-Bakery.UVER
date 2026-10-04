import {
  CURRENT_PROJECT_VERSION,
  PROJECT_FORMAT,
  type AnimationBakeryProject
} from "./ProjectFormat";

export interface ProjectMigration {
  readonly fromVersion: number;
  readonly toVersion: number;
  migrate(project: AnimationBakeryProject): AnimationBakeryProject;
}

export function migrateProject(project: AnimationBakeryProject): AnimationBakeryProject {
  if (project.manifest.format !== PROJECT_FORMAT) {
    throw new Error("Unsupported Animation Bakery project format.");
  }

  let current = project;
  while (current.manifest.version < CURRENT_PROJECT_VERSION) {
    throw new Error(
      `No migration registered for project version ${current.manifest.version}.`
    );
  }

  if (current.manifest.version > CURRENT_PROJECT_VERSION) {
    throw new Error("Project was created by a newer version of Animation Bakery.");
  }

  return current;
}
