import { useCallback, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import { eventBus } from '../pages/App'

const POLL_INTERVAL = 1500 // 1.5 seconds
const TITLE_REGION = { x: 0, y: 0, width: 1, height: 0.2 } // Top 20% of screen

export function useSlideOCR() {
  const workerRef = useRef<Tesseract.Worker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastTitleRef = useRef<string>('')
  const lastChangeTimeRef = useRef<number>(0)

  const initWorker = useCallback(async () => {
    if (!workerRef.current) {
      workerRef.current = await createWorker()
      await workerRef.current.loadLanguage('eng')
      await workerRef.current.initialize('eng')
    }
  }, [])

  const captureTitleRegion = useCallback(async (stream: MediaStream) => {
    const video = document.createElement('video')
    video.srcObject = stream
    await video.play()

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return null

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame
    context.drawImage(video, 0, 0)

    // Calculate title region
    const titleHeight = canvas.height * TITLE_REGION.height
    const titleData = context.getImageData(
      0,
      0,
      canvas.width,
      titleHeight
    )

    // Clean up
    video.srcObject = null
    return titleData
  }, [])

  const startSlideTracking = useCallback(async () => {
    try {
      await initWorker()
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' }
      })
      streamRef.current = stream

      const pollSlide = async () => {
        if (!streamRef.current || !workerRef.current) return

        const titleData = await captureTitleRegion(streamRef.current)
        if (!titleData) return

        const { data: { text } } = await workerRef.current.recognize(titleData)
        const currentTitle = text.trim()

        // Check if title has changed significantly
        if (currentTitle && currentTitle !== lastTitleRef.current) {
          const similarity = calculateSimilarity(currentTitle, lastTitleRef.current)
          if (similarity < 0.85) { // 15% change threshold
            lastTitleRef.current = currentTitle
            lastChangeTimeRef.current = Date.now()
            
            // TODO: Compare with transcript using CLIP embeddings
            // For now, simulate alignment score
            const alignmentScore = Math.random() * 0.3 + 0.7 // Random score between 0.7 and 1.0
            eventBus.emit('metrics', { alignmentScore })
          }
        }

        setTimeout(pollSlide, POLL_INTERVAL)
      }

      pollSlide()
    } catch (error) {
      console.error('Error starting slide tracking:', error)
    }
  }, [initWorker, captureTitleRegion])

  const stopSlideTracking = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (workerRef.current) {
      await workerRef.current.terminate()
      workerRef.current = null
    }
    lastTitleRef.current = ''
    lastChangeTimeRef.current = 0
  }, [])

  return {
    startSlideTracking,
    stopSlideTracking
  }
}

// Simple string similarity function (Levenshtein distance)
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      )
    }
  }

  const maxLength = Math.max(str1.length, str2.length)
  return 1 - track[str2.length][str1.length] / maxLength
} 