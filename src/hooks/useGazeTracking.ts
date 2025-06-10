import { useRef } from 'react'
import * as faceapi from 'face-api.js'

export const useGazeTracking = () => {
  const intervalRef = useRef<number | null>(null)
  const gazeSamples = useRef<number[]>([])
  const finalGazeAverage = useRef<number>(0)
  const isTracking = useRef<boolean>(false)
  const lastGazePercentage = useRef<number>(0)
  const lastValidGazeTime = useRef<number>(0)
  const lastValidAverage = useRef<number>(0)  // New ref to store last valid average
  const MIN_VALID_GAZE = 10 // Minimum value to consider as valid gaze
  const MAX_SAMPLES = 10 // Maximum number of samples to keep
  const MIN_SAMPLES_FOR_AVERAGE = 3 // Reduced minimum samples needed for a valid average
  const GAZE_TIMEOUT = 1000 // Time in ms after which we consider gaze lost
  const INITIAL_GAZE_VALUE = 50 // Initial gaze value to prevent 0% flicker

  // Calculate gaze percentage with improved accuracy
  const calculateGazePercentage = (
    faceCenterX: number,
    faceCenterY: number,
    frameWidth: number,
    frameHeight: number
  ): number => {
    // Define a larger center region (50% of frame dimensions)
    const centerRegionWidth = frameWidth * 0.5
    const centerRegionHeight = frameHeight * 0.5
    
    // Calculate center region boundaries
    const centerLeft = (frameWidth - centerRegionWidth) / 2
    const centerRight = centerLeft + centerRegionWidth
    const centerTop = (frameHeight - centerRegionHeight) / 2
    const centerBottom = centerTop + centerRegionHeight

    // Check if face is within center region
    const isInCenter = 
      faceCenterX >= centerLeft && 
      faceCenterX <= centerRight && 
      faceCenterY >= centerTop && 
      faceCenterY <= centerBottom

    if (isInCenter) {
      // Calculate distance from center of frame
      const centerX = frameWidth / 2
      const centerY = frameHeight / 2
      const distanceFromCenter = Math.sqrt(
        Math.pow(faceCenterX - centerX, 2) + 
        Math.pow(faceCenterY - centerY, 2)
      )

      // Calculate maximum distance within center region
      const maxDistance = Math.sqrt(
        Math.pow(centerRegionWidth / 2, 2) + 
        Math.pow(centerRegionHeight / 2, 2)
      )

      // Calculate percentage (100% when face is exactly centered)
      // Use a more gradual falloff
      const rawPercentage = Math.max(0, Math.min(100, 
        Math.pow(1 - distanceFromCenter / maxDistance, 0.5) * 100
      ))

      // Apply stronger smoothing to reduce jitter
      const smoothingFactor = 0.3 // Increased smoothing factor
      const smoothedPercentage = lastGazePercentage.current * (1 - smoothingFactor) + 
                               rawPercentage * smoothingFactor
      
      lastGazePercentage.current = smoothedPercentage
      return Math.round(smoothedPercentage)
    }

    // If face is outside center region, calculate distance-based percentage
    const distanceFromCenter = Math.sqrt(
      Math.pow(faceCenterX - frameWidth / 2, 2) + 
      Math.pow(faceCenterY - frameHeight / 2, 2)
    )

    const maxDistance = Math.sqrt(
      Math.pow(frameWidth / 2, 2) + 
      Math.pow(frameHeight / 2, 2)
    )

    // Use a steeper falloff for outside region
    const rawPercentage = Math.max(0, Math.min(100, 
      Math.pow(1 - distanceFromCenter / maxDistance, 2) * 100
    ))

    // Apply stronger smoothing
    const smoothingFactor = 0.3 // Increased smoothing factor
    const smoothedPercentage = lastGazePercentage.current * (1 - smoothingFactor) + 
                             rawPercentage * smoothingFactor
    
    lastGazePercentage.current = smoothedPercentage
    return Math.round(smoothedPercentage)
  }

  const startGazeTracking = async (video: HTMLVideoElement) => {
    try {
      // Load face detection models
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models')

      // Reset samples and tracking state
      gazeSamples.current = []
      finalGazeAverage.current = 0
      isTracking.current = true
      lastGazePercentage.current = INITIAL_GAZE_VALUE // Initialize with a non-zero value
      lastValidGazeTime.current = Date.now()
      lastValidAverage.current = INITIAL_GAZE_VALUE // Initialize with a non-zero value

      // Start tracking
      intervalRef.current = window.setInterval(async () => {
        if (!isTracking.current) return

        const face = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        const currentTime = Date.now()
        
        if (face) {
          // Calculate center of the face
          const faceCenterX = face.box.x + face.box.width / 2
          const faceCenterY = face.box.y + face.box.height / 2
          
          // Calculate gaze percentage
          const gazePercentage = calculateGazePercentage(
            faceCenterX,
            faceCenterY,
            video.videoWidth,
            video.videoHeight
          )

          // Only consider valid gaze readings
          if (gazePercentage >= MIN_VALID_GAZE) {
            lastValidGazeTime.current = currentTime
            // Add to samples array, maintaining max size
            gazeSamples.current.push(gazePercentage)
            if (gazeSamples.current.length > MAX_SAMPLES) {
              gazeSamples.current.shift()
            }

            // Calculate and store the current average
            if (gazeSamples.current.length >= MIN_SAMPLES_FOR_AVERAGE) {
              const currentAverage = Math.round(
                gazeSamples.current.reduce((a, b) => a + b, 0) / gazeSamples.current.length
              )
              lastValidAverage.current = currentAverage

              // Get existing metrics from the last event
              const lastMetrics = (window as any).lastMetrics || { avgWPM: 0, totalWords: 0, gazeOnPct: INITIAL_GAZE_VALUE }
              
              // Only emit if the change is significant (more than 5%)
              if (Math.abs(currentAverage - lastMetrics.gazeOnPct) > 5) {
                window.dispatchEvent(new CustomEvent('metrics', {
                  detail: {
                    ...lastMetrics,
                    gazeOnPct: currentAverage
                  }
                }))
              }
            }
          }
        } else if (currentTime - lastValidGazeTime.current > GAZE_TIMEOUT) {
          // Use the last valid average instead of clearing samples
          if (lastValidAverage.current > 0) {
            const lastMetrics = (window as any).lastMetrics || { avgWPM: 0, totalWords: 0, gazeOnPct: INITIAL_GAZE_VALUE }
            
            // Only emit if the change is significant
            if (Math.abs(lastValidAverage.current - lastMetrics.gazeOnPct) > 5) {
              window.dispatchEvent(new CustomEvent('metrics', {
                detail: {
                  ...lastMetrics,
                  gazeOnPct: lastValidAverage.current
                }
              }))
            }
          }
        }
      }, 200) // Reduced interval for more frequent updates
    } catch (error) {
      console.error('Error starting gaze tracking:', error)
      isTracking.current = false
    }
  }

  const stopGazeTracking = () => {
    isTracking.current = false
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null

      // Use the last valid average for the final calculation
      if (lastValidAverage.current > 0) {
        finalGazeAverage.current = lastValidAverage.current
        
        const lastMetrics = (window as any).lastMetrics || { avgWPM: 0, totalWords: 0, gazeOnPct: INITIAL_GAZE_VALUE }
        
        // Always emit final metrics with the last valid average
        window.dispatchEvent(new CustomEvent('metrics', {
          detail: {
            ...lastMetrics,
            gazeOnPct: lastValidAverage.current
          }
        }))
      } else {
        // If no valid average was ever calculated, use the initial value
        finalGazeAverage.current = INITIAL_GAZE_VALUE
        
        const lastMetrics = (window as any).lastMetrics || { avgWPM: 0, totalWords: 0, gazeOnPct: INITIAL_GAZE_VALUE }
        
        window.dispatchEvent(new CustomEvent('metrics', {
          detail: {
            ...lastMetrics,
            gazeOnPct: INITIAL_GAZE_VALUE
          }
        }))
      }
    }
  }

  return {
    startGazeTracking,
    stopGazeTracking
  }
} 