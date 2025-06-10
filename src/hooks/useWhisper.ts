import { useState, useCallback, useEffect, useRef } from 'react'
import mitt from 'mitt'

const eventBus = mitt()

// Simple filler word detection
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'so', 'basically', 'actually']

export const useWhisper = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  // Track words in a list
  const spokenWords = useRef<string[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioUrlRef = useRef<string | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)

  // Reset the word list
  const resetWordList = useCallback(() => {
    spokenWords.current = []
    console.log('Word list reset')
  }, [])

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript
            // Add words to our list as soon as they appear in the transcript
            const words = transcript.split(/\s+/).filter(word => word.length > 0)
            console.log('New transcript:', transcript)
            console.log('Words extracted:', words)
            spokenWords.current.push(...words)
            console.log('Current word list:', spokenWords.current)
            console.log('Total words so far:', spokenWords.current.length)
            
            // Emit metrics update with current word count
            const lastMetrics = (window as any).lastMetrics || { gazeOnPct: 0, avgWPM: 0, totalWords: 0 }
            const newMetrics = {
              ...lastMetrics,
              totalWords: spokenWords.current.length
            }
            ;(window as any).lastMetrics = newMetrics
            window.dispatchEvent(new CustomEvent('metrics', {
              detail: newMetrics
            }))
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setError(new Error(event.error))
      }

      recognition.onend = () => {
        if (isRecording) {
          recognition.start()
        }
      }

      setRecognition(recognition)
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [isRecording])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        audioUrlRef.current = audioUrl
        audioBlobRef.current = audioBlob
      }

      // Initialize speech recognition
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      // Reset word list at the start of recording
      spokenWords.current = []

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript
            const words = transcript.split(/\s+/).filter(word => word.length > 0)
            spokenWords.current.push(...words)

            // Get existing metrics
            const lastMetrics = (window as any).lastMetrics || { avgWPM: 0, totalWords: 0, gazeOnPct: 0 }
            
            // Update metrics with new word count
            const newMetrics = {
              ...lastMetrics,
              totalWords: spokenWords.current.length
            }
            
            // Store in window object
            ;(window as any).lastMetrics = newMetrics
            
            // Emit metrics event
            window.dispatchEvent(new CustomEvent('metrics', {
              detail: newMetrics
            }))
          }
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setError(new Error(event.error))
      }

      recognition.start()
      mediaRecorder.start()
      setIsRecording(true)
      setError(null)

      // Store recognition instance for cleanup
      recognitionRef.current = recognition
      mediaRecorderRef.current = mediaRecorder
    } catch (err) {
      console.error('Error starting recording:', err)
      setError(err instanceof Error ? err : new Error('Failed to start recording'))
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      // Stop all tracks in the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)

    // Get the last metrics to preserve gaze percentage
    const lastMetrics = (window as any).lastMetrics || { avgWPM: 0, totalWords: 0, gazeOnPct: 50 }

    // Emit final metrics with the total word count and preserved gaze
    const finalMetrics = {
      totalWords: spokenWords.current.length,
      wpm: 0,
      gazeOnPct: lastMetrics.gazeOnPct // Preserve the last gaze percentage
    }
    window.dispatchEvent(new CustomEvent('metrics', {
      detail: finalMetrics
    }))

    // Clean up references
    mediaRecorderRef.current = null
    recognitionRef.current = null
  }, [spokenWords])

  return {
    isRecording,
    startRecording,
    stopRecording,
    wordCount: spokenWords.current.length,
    audioUrl: audioUrlRef.current,
    audioBlob: audioBlobRef.current,
    error: error
  }
} 