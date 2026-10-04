import type {Disposable} from "../../core/contracts/Disposable";

export class ResourceRegistry {
  private readonly resources = new Set<Disposable>();

  register<T extends Disposable>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }

  unregister(resource: Disposable): void {
    this.resources.delete(resource);
  }

  disposeAll(): void {
    for (const resource of this.resources) resource.dispose();
    this.resources.clear();
  }

  get size(): number {
    return this.resources.size;
  }
}
