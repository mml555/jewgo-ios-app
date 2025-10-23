/**
 * Camera move reason types to control region normalization behavior
 */
export const CameraMoveReason = {
  UserGesture: 'user',
  ClusterPress: 'cluster-press',
  Programmatic: 'programmatic',
} as const;

export type CameraMoveReason =
  (typeof CameraMoveReason)[keyof typeof CameraMoveReason];
