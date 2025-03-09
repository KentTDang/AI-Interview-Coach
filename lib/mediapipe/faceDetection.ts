import { FaceLandmarker } from "@mediapipe/tasks-vision"; 

export const initializeFaceDetection = async (vision: any): Promise<FaceLandmarker> => {
  return await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    },
    runningMode: "VIDEO",
  });
};