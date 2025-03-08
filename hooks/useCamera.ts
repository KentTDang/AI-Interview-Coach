import { useEffect } from "react";

export const useCamera = (videoRef: React.RefObject<HTMLVideoElement>) => {
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    const checkPermissionAndStart = async () => {
      // Check if the Permissions API is available.
      console.log("navigator permissions: ", navigator.permissions);
      if (navigator.permissions) {
        try {
          // Query the current camera permission status.
          const permissionStatus = await navigator.permissions.query({ name: "camera" as PermissionName });
          console.log("Camera permission state:", permissionStatus.state);

          // Optionally, listen for changes in permission state.
          permissionStatus.onchange = () => {
            console.log("Camera permission state changed:", permissionStatus.state);
          };

          // If permission is granted or the browser is prompting, start the camera.
          if (permissionStatus.state === "granted" || permissionStatus.state === "prompt") {
            console.log("✅ Starting camera")
            startCamera();
          } else {
            console.warn("Camera permission is denied.");
          }
        } catch (err) {
          console.error("Error checking camera permission:", err);
          // Fallback to directly starting the camera if the Permissions API fails.
          console.log("❌ Failed to check camera permissions");
          startCamera();
        }
      } else {
        // Fallback for browsers that don't support the Permissions API.
        console.log("❌ Browser does not support permissions api");
        startCamera();
      }
    };

    checkPermissionAndStart();

    return () => {
      // Stop all tracks when the component unmounts.
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoRef]);
};
