import { Landmark } from "./types";

export const isFacingForward = (landmarks: Landmark[]): boolean => {
  if (landmarks.length < 473) {
    console.warn("Not enough landmarks provided for gaze estimation.");
    return false;
  }

  // Define indices for the right eye corners.
  const rightEyeOuter = landmarks[33];
  const rightEyeInner = landmarks[133];

  const irisLandmarks = landmarks.slice(468, 468 + 5);
  if (irisLandmarks.length < 5) {
    console.warn("Not enough iris landmarks for gaze estimation.");
    return false;
  }

  // Compute the iris center by averaging the iris landmark coordinates.
  const irisCenter = irisLandmarks.reduce(
    (acc, cur) => ({
      x: acc.x + cur.x,
      y: acc.y + cur.y,
      z: acc.z + cur.z,
      visibility: 0,
    }),
    { x: 0, y: 0, z: 0, visibility: 0 }
  );

  irisCenter.x /= irisLandmarks.length;
  irisCenter.y /= irisLandmarks.length;
  irisCenter.z /= irisLandmarks.length;

  // Calculate the vector from the outer to inner corner of the right eye.
  const AB = {
    x: rightEyeInner.x - rightEyeOuter.x,
    y: rightEyeInner.y - rightEyeOuter.y,
  };

  // Calculate the vector from the outer eye corner to the iris center.
  const AI = {
    x: irisCenter.x - rightEyeOuter.x,
    y: irisCenter.y - rightEyeOuter.y,
  };

  // Calculate the dot product and the squared magnitude of AB.
  const dot = AI.x * AB.x + AI.y * AB.y;
  const norm2 = AB.x * AB.x + AB.y * AB.y;
  if (norm2 === 0) {
    return false;
  }

  // Normalized position (t) along the eye line.
  const t = dot / norm2;

  // Return true if t is between the thresholds, indicating a forward gaze.
  return t >= 0.4 && t <= 0.6;
};

export const isBadPosture = (landmarks: Landmark[]): boolean => {
  const head = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!head || !leftShoulder || !rightShoulder) return false;

  // Calculate the midpoint between the shoulders.
  const midShoulders = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };

  // Compute the Euclidean distance between the head and the shoulder midpoint.
  const dx = head.x - midShoulders.x;
  const dy = head.y - midShoulders.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Return true if the distance is less than a defined threshold (e.g., 0.2).
  return distance < 0.3;
};