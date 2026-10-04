export type InputPointerType = "touch" | "mouse" | "pen";

export interface InputPoint {
  x: number;
  y: number;
  pointerId: number;
  type: InputPointerType;
}

export interface InputEvent {
  point: InputPoint;
  deltaX: number;
  deltaY: number;
  buttons: number;
  timestamp: number;
}
