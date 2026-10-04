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

export class ProjectMigrationRegistry {
  private readonly migrations = new Map<number, ProjectMigration>();

  register(migration: ProjectMigration): void {
    if (migration.toVersion <= migration.fromVersion) {
      throw new Error("Project migration must move forward.");
    }
    if (this.migrations.has(migration.fromVersion)) {
      throw new Error(
        `A migration from version ${migration.fromVersion} is already registered.`
      );
    }
    this.migrations.set(migration.fromVersion, migration);
  }

  migrate(project: AnimationBakeryProject): AnimationBakeryProject {
    if (project.manifest.format !== PROJECT_FORMAT) {
      throw new Error("Unsupported Animation Bakery project format.");
    }

    let current = project;

    while (current.manifest.version < CURRENT_PROJECT_VERSION) {
      const migration = this.migrations.get(current.manifest.version);
      if (!migration) {
        throw new Error(
          `No migration registered for project version ${current.manifest.version}.`
        );
      }

      current = migration.migrate(current);

      if (current.manifest.version !== migration.toVersion) {
        throw new Error(
          `Migration did not produce version ${migration.toVersion}.`
        );
      }
    }

    if (current.manifest.version > CURRENT_PROJECT_VERSION) {
      throw new Error("Project was created by a newer version of Animation Bakery.");
    }

    return current;
  }
}

export function migrateProject(
  project: AnimationBakeryProject,
  registry = new ProjectMigrationRegistry()
): AnimationBakeryProject {
  return registry.migrate(project);
}
