import {
  PROJECT_FORMAT,
  CURRENT_PROJECT_VERSION,
  type AnimationBakeryProject
} from "./ProjectFormat";
import {ProjectMigrationRegistry} from "./ProjectMigration";

export class ProjectSerializer {
  constructor(
    private readonly migrations = new ProjectMigrationRegistry()
  ) {}

  serialize(project: AnimationBakeryProject): string {
    if (project.manifest.format !== PROJECT_FORMAT) {
      throw new Error("Unsupported Animation Bakery project format.");
    }
    if (project.manifest.version !== CURRENT_PROJECT_VERSION) {
      throw new Error("Project must be migrated before saving.");
    }
    return JSON.stringify(project);
  }

  deserialize(serialized: string): AnimationBakeryProject {
    let parsed: unknown;

    try {
      parsed = JSON.parse(serialized);
    } catch {
      throw new Error("Invalid Animation Bakery project data.");
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid Animation Bakery project root.");
    }

    const project = parsed as AnimationBakeryProject;
    return this.migrations.migrate(project);
  }
}
