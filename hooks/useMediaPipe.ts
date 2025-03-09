
import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { initializeHandDetection } from "../lib/mediapipe/handDetection";
import { initializeFaceDetection } from "../lib/mediapipe/faceDetection";
import { initializePoseDetection } from "../lib/mediapipe/poseDetection";
import { isFacingForward, isBadPosture } from "../lib/analytics";
import { drawHandLandmarks, drawFaceMeshLandmarks, drawPoseLandmarkers } from "../lib/drawing";
import { useMetrics } from "@/context/MetricsContext";

export const useMediapipe = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  overlayEnabled: boolean
) => {
  // Detection states
  const [handPresence, setHandPresence] = useState(false);
  const [facePresence, setFacePresence] = useState(false);
  const [posePresence, setPosePresence] = useState(false);

  // Analytics states (counters, durations)
  const [handDetectionCounter, setHandDetectionCounter] = useState(0);
  const [handDetectionDuration, setHandDetectionDuration] = useState(0);
  const [notFacingCounter, setNotFacingCounter] = useState(0);
  const [notFacingDuration, setNotFacingDuration] = useState(0);
  const [badPostureDetectionCounter, setBadPostureDetectionCounter] = useState(0);
  const [badPostureDuration, setBadPostureDuration] = useState(0);

  // Refs to hold temporary values
  const isHandOnScreenRef = useRef(false);
  const handDetectionStartTimeRef = useRef(0);
  const notFacingStartTimeRef = useRef<number | null>(null);
  const notFacingRef = useRef(false);
  const hasBadPostureRef = useRef(false);
  const badPostureStartTimeRef = useRef(0);

  // Refs to store detector instances
  const handDetectorRef = useRef<HandLandmarker | null>(null);
  const faceDetectorRef = useRef<FaceLandmarker | null>(null);
  const poseDetectorRef = useRef<PoseLandmarker | null>(null);

  const { updateMetrics } = useMetrics();

  useEffect(() => {
    const timer = setTimeout(() => {
      updateMetrics({
        handDetectionCounter,
        handDetectionDuration,
        notFacingCounter,
        notFacingDuration,
        badPostureDetectionCounter,
        badPostureDuration
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [
    updateMetrics,
    handDetectionCounter, 
    handDetectionDuration,
    notFacingCounter,
    notFacingDuration,
    badPostureDetectionCounter,
    badPostureDuration,
  ]);

  useEffect(() => {
    let animationFrameId: number;

    const setupDetectors = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      handDetectorRef.current = await initializeHandDetection(vision);
      faceDetectorRef.current = await initializeFaceDetection(vision);
      poseDetectorRef.current = await initializePoseDetection(vision);
    };

    const detect = () => {
      const currentTime = performance.now();

      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        canvasRef.current
      ) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }

        // --- Hand Detection Logic ---
        if (handDetectorRef.current) {
          const handResults = handDetectorRef.current.detectForVideo(
            videoRef.current,
            currentTime
          );
          setHandPresence(handResults.handednesses.length > 0);
          if (handResults.landmarks.length > 0) {
            if (!isHandOnScreenRef.current) {
              setHandDetectionCounter((prev) => prev + 1);
              handDetectionStartTimeRef.current = currentTime;
              isHandOnScreenRef.current = true;
            }
          } else {
            if (isHandOnScreenRef.current && handDetectionStartTimeRef.current) {
              const durationSec = (currentTime - handDetectionStartTimeRef.current) / 1000;
              setHandDetectionDuration((prev) => prev + durationSec);
              handDetectionStartTimeRef.current = 0;
            }
            isHandOnScreenRef.current = false;
          }
          if (overlayEnabled && handResults.landmarks) {
            drawHandLandmarks(canvas, handResults.landmarks);
          }
        }

        // --- Face Detection and Facing Forward Logic ---
        if (faceDetectorRef.current) {
          const faceResults = faceDetectorRef.current.detectForVideo(
            videoRef.current,
            currentTime
          );
          const hasFace = faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0;
          setFacePresence(hasFace);
          if (hasFace) {
            if (overlayEnabled) {
              drawFaceMeshLandmarks(canvas, faceResults);
            }
            // Use helper to decide if looking forward.
            const lookingForward = isFacingForward(faceResults.faceLandmarks[0]);
            notFacingRef.current = !lookingForward;
            if (!lookingForward) {
              if (notFacingStartTimeRef.current === null) {
                notFacingStartTimeRef.current = currentTime;
                setNotFacingCounter((prev) => prev + 1);
              }
            } else {
              if (notFacingStartTimeRef.current !== null) {
                const elapsedSec = (currentTime - notFacingStartTimeRef.current) / 1000;
                setNotFacingDuration((prev) => prev + elapsedSec);
                notFacingStartTimeRef.current = null;
              }
            }
          }
        }

        // --- Pose Detection and Bad Posture Logic ---
        if (poseDetectorRef.current) {
          const poseResults = poseDetectorRef.current.detectForVideo(
            videoRef.current,
            currentTime
          );
          const hasPose = poseResults.landmarks && poseResults.landmarks.length > 0;
          setPosePresence(hasPose);
          if (hasPose) {
            const landmarks = poseResults.landmarks[0];
            const badPosture = isBadPosture(landmarks);
            if (badPosture) {
              if (!hasBadPostureRef.current) {
                setBadPostureDetectionCounter((prev) => prev + 1);
                badPostureStartTimeRef.current = currentTime;
                hasBadPostureRef.current = true;
              }
            } else {
              if (hasBadPostureRef.current) {
                const durationSec = (currentTime - badPostureStartTimeRef.current) / 1000;
                setBadPostureDuration((prev) => prev + durationSec);
                badPostureStartTimeRef.current = 0;
                hasBadPostureRef.current = false;
              }
            }
            if (overlayEnabled && poseResults.landmarks) {
              drawPoseLandmarkers(canvas, poseResults.landmarks);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(detect);
    };

    setupDetectors().then(() => {
      detect();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      handDetectorRef.current?.close();
      faceDetectorRef.current?.close();
      poseDetectorRef.current?.close();
    };
  }, [videoRef, canvasRef, overlayEnabled]);

  return {
    handPresence,
    facePresence,
    posePresence,
    handDetectionCounter,
    handDetectionDuration,
    notFacingCounter,
    notFacingDuration,
    badPostureDetectionCounter,
    badPostureDuration,
    isHandOnScreenRef,
    notFacingRef,
    hasBadPostureRef
  };
};
