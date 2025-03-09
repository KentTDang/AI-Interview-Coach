import { HandLandmarker } from "@mediapipe/tasks-vision";

export const initializeHandDetection = async (
  vision: any
): Promise<HandLandmarker> => {
  return await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    },
    numHands: 2,
    runningMode: "VIDEO",
  });
};