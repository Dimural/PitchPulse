import { useRef, useEffect } from 'react'

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })

      // Store stream reference
      streamRef.current = stream

      if (videoRef.current) {
        console.log('Setting up video element...')
        videoRef.current.srcObject = stream
        // Ensure video is playing
        await videoRef.current.play()
        // Mirror the video
        videoRef.current.style.transform = 'scaleX(-1)'
        console.log('Camera setup complete')
      } else {
        console.error('Video element not found')
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      throw error
    }
  }

  const stopCamera = () => {
    console.log('Stopping camera...')
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind)
      })
      streamRef.current = null
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
      console.log('Cleared video element')
    }
    console.log('Camera stopped')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return {
    videoRef,
    startCamera,
    stopCamera
  }
} 