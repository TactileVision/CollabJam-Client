export interface Marker {
  channel: number;
  faceId: number;
  barycentricCoords?: { u: number; v: number; w: number };
}
