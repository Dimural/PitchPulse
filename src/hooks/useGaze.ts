import { useEffect, useRef } from 'react'
import * as facemesh from '@mediapipe/face_mesh'
import { Camera } from '@mediapipe/camera_utils'
import { eventBus } from '../utils/eventBus'

const GAZE_THRESHOLD = 0.5

export const useGaze = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const faceMeshRef = useRef<facemesh.FaceMesh | null>(null)

  useEffect(() => {
    if (!videoRef.current) return

    const faceMesh = new facemesh.FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      }
    })

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0]
        // Process landmarks and emit gaze events
        eventBus.emit('gazeUpdate', { landmarks })
      }
    })

    faceMeshRef.current = faceMesh

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await faceMesh.send({ image: videoRef.current })
        }
      },
      width: 640,
      height: 480
    })

    camera.start()

    return () => {
      camera.stop()
      faceMesh.close()
    }
  }, [videoRef])

  return faceMeshRef
} 