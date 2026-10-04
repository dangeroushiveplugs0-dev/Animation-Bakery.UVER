import type {SelectionEntry,SelectionKind} from "../../core/selection/SelectionTypes";

export type SelectionListener = (current: SelectionEntry | undefined) => void;

export class SelectionManager {
  private selected?: SelectionEntry;
  private readonly listeners = new Set<SelectionListener>();

  select(entry?: SelectionEntry): void {
    this.selected = entry;
    this.emit();
  }

  selectObject(objectId: string, label?: string): void {
    this.select({id: objectId, kind: "object", objectId, label});
  }

  selectBone(boneId: string, label?: string): void {
    this.select({id: boneId, kind: "bone", objectId: boneId, label});
  }

  clear(): void {
    this.select(undefined);
  }

  getSelected(): SelectionEntry | undefined {
    return this.selected;
  }

  isSelected(id: string, kind?: SelectionKind): boolean {
    return !!this.selected &&
      this.selected.id === id &&
      (kind === undefined || this.selected.kind === kind);
  }

  subscribe(listener: SelectionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.selected);
  }
}
