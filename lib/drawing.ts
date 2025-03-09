import { DrawingUtils, GestureRecognizer } from "@mediapipe/tasks-vision";
import { Landmark, FaceDetections } from "./types";

export const drawHandLandmarks = (
  canvas: HTMLCanvasElement,
  landmarksArray: Landmark[][]
): void => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const drawingUtils = new DrawingUtils(ctx);
  landmarksArray.forEach((landmarks) => {
    drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
      color: "#1b998b",
      lineWidth: 2,
    });
    drawingUtils.drawLandmarks(landmarks, { color: "#d7263d", lineWidth: 1 });
  });
};

export const drawFaceMeshLandmarks = (
  canvas: HTMLCanvasElement,
  faceDetections: FaceDetections
): void => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Ensure we have detected face landmarks.
  if (!faceDetections.faceLandmarks || faceDetections.faceLandmarks.length === 0)
    return;

  // Use the first detected face.
  const landmarks = faceDetections.faceLandmarks[0];
  if (!landmarks || landmarks.length === 0) return;

  landmarks.forEach((landmark: Landmark, index: number) => {
    const x = landmark.x * canvas.width;
    const y = landmark.y * canvas.height;
    ctx.beginPath();
    ctx.fillStyle = index >= 468 && index < 468 + 10 ? "#219ebc" : "white";
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fill();
  });
};

export const drawPoseLandmarkers = (
  canvas: HTMLCanvasElement,
  poseLandmarks: Landmark[][]
): void => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  poseLandmarks.forEach((landmarks) => {
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = (index >= 0 && index <= 10) || (index >= 15 && index <= 22) ? "transparent" : "#fb8500";
      ctx.fill();
    });
  });
};