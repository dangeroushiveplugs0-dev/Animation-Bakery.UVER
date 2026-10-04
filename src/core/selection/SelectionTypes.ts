export type SelectionKind =
  | "object"
  | "bone"
  | "material"
  | "physics"
  | "animation-track";

export interface SelectionEntry {
  id: string;
  kind: SelectionKind;
  objectId?: string;
  label?: string;
}
