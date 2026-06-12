"use client";

// Detecção de pose no NAVEGADOR — MediaPipe Pose Landmarker (BlazePose GHUM).
// As fotos não saem do dispositivo para a detecção de landmarks; apenas o
// arquivo vai para o bucket privado e os landmarks (números) para o banco.

import type { NormalizedLandmark } from "./pipeline";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let landmarkerPromise: Promise<import("@mediapipe/tasks-vision").PoseLandmarker> | null = null;

async function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      return PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "IMAGE",
        numPoses: 1,
        outputSegmentationMasks: false,
      });
    })();
  }
  return landmarkerPromise;
}

export async function detectPoseFromFile(file: File): Promise<{
  landmarks: NormalizedLandmark[] | null;
  width: number;
  height: number;
}> {
  const bitmap = await createImageBitmap(file);
  try {
    const landmarker = await getLandmarker();
    const result = landmarker.detect(bitmap);
    const lm = result.landmarks?.[0];
    return {
      landmarks: lm
        ? lm.map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }))
        : null,
      width: bitmap.width,
      height: bitmap.height,
    };
  } catch {
    // falha de rede/CDN: segue sem landmarks (qualidade será marcada baixa)
    return { landmarks: null, width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}
