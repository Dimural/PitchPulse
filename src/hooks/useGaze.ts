import { useCallback, useEffect, useRef } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import { eventBus } from '../pages/App'

const GAZE_THRESHOLD = 25 // degrees
const GAZE_DURATION = 750 // milliseconds

export function useGaze() {
  const modelRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const gazeOffStartRef = useRef<number | null>(null)
  const gazeOnTimeRef = useRef<number>(0)
  const totalTimeRef = useRef<number>(0)

  const loadModel = useCallback(async () => {
    try {
      await tf.ready()
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
      const detectorConfig = {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1
      }
      modelRef.current = await faceLandmarksDetection.createDetector(model, detectorConfig)
    } catch (error) {
      console.error('Error loading face mesh model:', error)
    }
  }, [])

  const startGazeTracking = useCallback(async () => {
    try {
      if (!modelRef.current) {
        await loadModel()
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      videoRef.current = video

      const detectGaze = async () => {
        if (!modelRef.current || !videoRef.current) return

        const faces = await modelRef.current.estimateFaces(videoRef.current)
        if (faces.length === 0) {
          if (!gazeOffStartRef.current) {
            gazeOffStartRef.current = Date.now()
          } else if (Date.now() - gazeOffStartRef.current > GAZE_DURATION) {
            eventBus.emit('gazeOff', {
              type: 'gazeOff',
              msOff: Date.now() - gazeOffStartRef.current
            })
          }
        } else {
          const face = faces[0]
          // TODO: Calculate actual gaze direction using face landmarks
          // For now, simulate gaze detection
          const isGazeOn = Math.random() > 0.2 // 80% of the time gaze is on
          
          if (isGazeOn) {
            gazeOnTimeRef.current += 100 // Assuming 100ms intervals
            gazeOffStartRef.current = null
          } else {
            if (!gazeOffStartRef.current) {
              gazeOffStartRef.current = Date.now()
            }
          }
          
          totalTimeRef.current += 100
          
          // Calculate and emit gaze percentage
          const gazeOnPct = (gazeOnTimeRef.current / totalTimeRef.current) * 100
          eventBus.emit('metrics', { gazeOnPct })
        }

        requestAnimationFrame(detectGaze)
      }

      detectGaze()
    } catch (error) {
      console.error('Error starting gaze tracking:', error)
    }
  }, [loadModel])

  const stopGazeTracking = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current = null
    }
    gazeOffStartRef.current = null
    gazeOnTimeRef.current = 0
    totalTimeRef.current = 0
  }, [])

  useEffect(() => {
    return () => {
      stopGazeTracking()
    }
  }, [stopGazeTracking])

  return {
    startGazeTracking,
    stopGazeTracking
  }
} 