import { Buffer } from 'buffer'

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions'

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null
  private isListening: boolean = false
  private transcript: string = ''

  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        this.transcript = finalTranscript || interimTranscript
      }

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
      }
    } else {
      console.error('Speech recognition not supported in this browser')
    }
  }

  startListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'))
        return
      }

      try {
        this.recognition.start()
        this.isListening = true
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  stopListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'))
        return
      }

      try {
        this.recognition.stop()
        this.isListening = false
        resolve(this.transcript)
      } catch (error) {
        reject(error)
      }
    })
  }

  getTranscript(): string {
    return this.transcript
  }
}

// Create a singleton instance
const speechRecognition = new SpeechRecognitionService()

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // Start listening
    await speechRecognition.startListening()
    
    // Wait for 1 second to get some speech data
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Stop listening and get the transcript
    const transcript = await speechRecognition.stopListening()
    return transcript
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw error
  }
} 