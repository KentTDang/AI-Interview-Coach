import { PoseLandmarker } from "@mediapipe/tasks-vision";

export const initializePoseDetection = async (
  vision: any
): Promise<PoseLandmarker> => {
  return await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
    },
    runningMode: "VIDEO",
  });
};