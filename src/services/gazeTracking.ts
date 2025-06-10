import * as tf from '@tensorflow/tfjs'
import * as faceapi from 'face-api.js'

let isModelLoaded = false

export async function loadModels() {
  if (isModelLoaded) return

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ])
    isModelLoaded = true
    console.log('Face detection models loaded')
  } catch (error) {
    console.error('Error loading face detection models:', error)
    throw error
  }
}

export async function detectGaze(videoElement: HTMLVideoElement): Promise<{
  gazeOnPct: number
  faceDetected: boolean
}> {
  if (!isModelLoaded) {
    await loadModels()
  }

  try {
    const detections = await faceapi.detectAllFaces(
      videoElement,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks()

    if (detections.length === 0) {
      return {
        gazeOnPct: 0,
        faceDetected: false
      }
    }

    // Get the first detected face
    const face = detections[0]
    const landmarks = face.landmarks

    // Calculate eye positions
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()

    // Calculate eye aspect ratio (EAR) to detect if eyes are open
    const leftEAR = calculateEAR(leftEye)
    const rightEAR = calculateEAR(rightEye)
    const ear = (leftEAR + rightEAR) / 2

    // Calculate gaze direction based on eye landmarks
    const gazeDirection = calculateGazeDirection(leftEye, rightEye)

    // Determine if looking at camera (simplified)
    const isLookingAtCamera = Math.abs(gazeDirection.x) < 0.2 && Math.abs(gazeDirection.y) < 0.2

    return {
      gazeOnPct: isLookingAtCamera ? 100 : 0,
      faceDetected: true
    }
  } catch (error) {
    console.error('Error detecting gaze:', error)
    return {
      gazeOnPct: 0,
      faceDetected: false
    }
  }
}

function calculateEAR(eye: faceapi.Point[]): number {
  // Calculate the eye aspect ratio
  const A = distance(eye[1], eye[5])
  const B = distance(eye[2], eye[4])
  const C = distance(eye[0], eye[3])
  return (A + B) / (2.0 * C)
}

function calculateGazeDirection(leftEye: faceapi.Point[], rightEye: faceapi.Point[]): { x: number, y: number } {
  // Calculate the center of each eye
  const leftEyeCenter = {
    x: leftEye.reduce((sum, point) => sum + point.x, 0) / leftEye.length,
    y: leftEye.reduce((sum, point) => sum + point.y, 0) / leftEye.length
  }

  const rightEyeCenter = {
    x: rightEye.reduce((sum, point) => sum + point.x, 0) / rightEye.length,
    y: rightEye.reduce((sum, point) => sum + point.y, 0) / rightEye.length
  }

  // Calculate the gaze direction (normalized)
  return {
    x: (leftEyeCenter.x + rightEyeCenter.x) / 2 - 0.5,
    y: (leftEyeCenter.y + rightEyeCenter.y) / 2 - 0.5
  }
}

function distance(p1: faceapi.Point, p2: faceapi.Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
} 