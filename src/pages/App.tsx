import React, { useState, useEffect, useRef } from 'react'
import { StatsPanel } from '../components/StatsPanel'
import BorderCue from '../components/BorderCue'
import { useWhisper } from '../hooks/useWhisper'
import { useCamera } from '../hooks/useCamera'
import { useGazeTracking } from '../hooks/useGazeTracking'
import LandingPage from './LandingPage'

export type SessionMetrics = {
  avgWPM: number
  gazeOnPct: number
  totalWords: number
  lastUpdate: number
}

type Difficulty = 'beginner' | 'intermediate' | 'hard'

const QUESTIONS = {
  beginner: [
    "What's your favorite hobby and why do you enjoy it?",
    "Describe your ideal vacation destination.",
    "What's the most interesting thing you learned this week?",
    "Tell us about your favorite book or movie.",
    "What's your favorite season and why?"
  ],
  intermediate: [
    "How has technology changed the way we communicate in the last decade?",
    "What are the pros and cons of remote work?",
    "How can we make our cities more environmentally friendly?",
    "What role should artificial intelligence play in our daily lives?",
    "How has social media impacted modern relationships?"
  ],
  hard: [
    "What are the ethical implications of genetic engineering in humans?",
    "How can we balance economic growth with environmental sustainability?",
    "What are the potential impacts of quantum computing on cybersecurity?",
    "How should we approach the regulation of artificial intelligence?",
    "What are the long-term implications of the current global economic system?"
  ]
}

const SESSION_DURATIONS = {
  beginner: 20,
  intermediate: 45,
  hard: 120
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [metrics, setMetrics] = useState<SessionMetrics>({
    avgWPM: 0,
    gazeOnPct: 0,
    totalWords: 0,
    lastUpdate: Date.now()
  })
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [showLandingPage, setShowLandingPage] = useState(true)
  const { videoRef, startCamera, stopCamera } = useCamera()
  const { startRecording, stopRecording, wordCount } = useWhisper()
  const { startGazeTracking, stopGazeTracking } = useGazeTracking()
  const sessionStartTime = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleMetrics = (event: CustomEvent<SessionMetrics>) => {
      console.log('Received metrics event:', event.detail)
      const currentTime = Date.now()
      const timeElapsed = (currentTime - sessionStartTime.current) / 1000 / 60 // in minutes
      
      // Calculate WPM based on the total session time
      const newWordCount = event.detail.totalWords
      const wordsPerMinute = timeElapsed > 0 ? Math.round(newWordCount / timeElapsed) : 0
      
      console.log('Time elapsed (minutes):', timeElapsed)
      console.log('New word count:', newWordCount)
      console.log('Calculated WPM:', wordsPerMinute)
      
      // Create new metrics object, preserving the gaze percentage if it's not 0
      const newMetrics = {
        ...event.detail,
        avgWPM: wordsPerMinute,
        gazeOnPct: event.detail.gazeOnPct || metrics.gazeOnPct // Preserve existing gaze if new one is 0
      }
      
      // Store in window object
      ;(window as any).lastMetrics = newMetrics
      
      // Update metrics state
      setMetrics(newMetrics)
    }

    window.addEventListener('metrics', handleMetrics as EventListener)
    return () => window.removeEventListener('metrics', handleMetrics as EventListener)
  }, [metrics.gazeOnPct])

  const getRandomQuestion = (difficulty: Difficulty) => {
    const questions = QUESTIONS[difficulty]
    return questions[Math.floor(Math.random() * questions.length)]
  }

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty)
    setCurrentQuestion(getRandomQuestion(difficulty))
    setTimeRemaining(SESSION_DURATIONS[difficulty])
  }

  const startSession = async () => {
    if (!selectedDifficulty) return
    
    try {
      setError(null)
      setShowResults(false)
      sessionStartTime.current = Date.now() // Set the session start time
      setMetrics({
        totalWords: 0,
        avgWPM: 0,
        gazeOnPct: 0,
        lastUpdate: Date.now()
      })
      
      // Start camera and gaze tracking
      await startCamera()
      if (videoRef.current) {
        startGazeTracking(videoRef.current)
      }
      
      // Start recording
      await startRecording()
      
      // Start the timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current)
            }
            stopSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Set recording state after a short delay
      setTimeout(() => {
        setIsRecording(true)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
    }
  }

  const calculateSessionScore = (metrics: SessionMetrics, timeRemaining: number, selectedDifficulty: Difficulty) => {
    // Base weights for different components
    const WPM_WEIGHT = 0.3
    const GAZE_WEIGHT = 0.4
    const CONFIDENCE_WEIGHT = 0.3

    // Calculate WPM score (target range: 120-160 WPM)
    const wpmScore = Math.min(Math.max((metrics.avgWPM - 80) / (160 - 80) * 100, 0), 100)

    // Calculate gaze score (target: 80%+ gaze)
    const gazeScore = Math.min(metrics.gazeOnPct * 1.25, 100)

    // Calculate confidence score based on WPM and gaze
    const confidenceScore = Math.min(
      (metrics.gazeOnPct * 0.6 + Math.min(Math.max((metrics.avgWPM - 110) / (160 - 110) * 100, 0), 100) * 0.4),
      100
    )

    // Calculate time penalty if session ended early
    const totalTime = SESSION_DURATIONS[selectedDifficulty]
    const timeUsed = totalTime - timeRemaining
    const timePenalty = timeUsed < totalTime ? (timeRemaining / totalTime) * 20 : 0 // Up to 20 points penalty

    // Calculate final score
    const finalScore = Math.round(
      (wpmScore * WPM_WEIGHT +
      gazeScore * GAZE_WEIGHT +
      confidenceScore * CONFIDENCE_WEIGHT) - timePenalty
    )

    return Math.max(0, Math.min(100, finalScore)) // Ensure score is between 0 and 100
  }

  const getScoreFeedback = (score: number) => {
    if (score >= 90) return { message: "Outstanding performance!", color: "text-success" }
    if (score >= 80) return { message: "Excellent work!", color: "text-success" }
    if (score >= 70) return { message: "Great job!", color: "text-primary" }
    if (score >= 60) return { message: "Good effort!", color: "text-primary" }
    if (score >= 50) return { message: "Solid performance", color: "text-warning" }
    return { message: "Keep practicing!", color: "text-error" }
  }

  const stopSession = async () => {
    try {
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      // Stop recording and get the final metrics
      await stopRecording()
      stopGazeTracking()
      stopCamera()
      
      // Get the final word count from the last metrics event
      const lastMetrics = (window as any).lastMetrics || { avgWPM: 0, totalWords: 0, gazeOnPct: 0 }
      
      // Calculate final WPM using the actual session duration
      const sessionDuration = (Date.now() - sessionStartTime.current) / 1000 / 60 // in minutes
      const finalWPM = sessionDuration > 0 ? Math.round(lastMetrics.totalWords / sessionDuration) : 0
      
      // Update metrics with final values
      const finalMetrics = {
        ...lastMetrics,
        avgWPM: finalWPM
      }
      setMetrics(finalMetrics)

      // Calculate final score
      const finalScore = calculateSessionScore(finalMetrics, timeRemaining, selectedDifficulty!)
      const scoreFeedback = getScoreFeedback(finalScore)
      
      // Emit final metrics
      const finalMetricsEvent = new CustomEvent('finalMetrics', {
        detail: {
          ...finalMetrics,
          duration: sessionDuration * 60, // Convert back to seconds
          score: finalScore
        }
      })
      window.dispatchEvent(finalMetricsEvent)
      
      setShowResults(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop session')
    }
  }

  const getWPMFeedback = (wpm: number) => {
    if (wpm < 110) {
      return {
        message: "You're speaking too slowly. Try to maintain a pace of 110-160 words per minute for better engagement.",
        color: "text-error",
        icon: "🐢"
      }
    } else if (wpm < 130) {
      return {
        message: "Your pace is a bit slow. Aim for 130-160 words per minute for optimal engagement.",
        color: "text-warning",
        icon: "⏱️"
      }
    } else if (wpm > 160) {
      return {
        message: "You're speaking too quickly. Try to slow down to 130-160 words per minute for better clarity.",
        color: "text-error",
        icon: "⚡"
      }
    } else if (wpm > 150) {
      return {
        message: "Good pace, but try to maintain 130-150 words per minute for optimal clarity.",
        color: "text-warning",
        icon: "🏃"
      }
    } else {
      return {
        message: "Excellent pace! You're speaking at an optimal rate of 130-150 words per minute.",
        color: "text-success",
        icon: "🎯"
      }
    }
  }

  const getGazeFeedback = (gaze: number) => {
    if (gaze < 50) {
      return {
        message: "Your eye contact needs significant improvement. Try to maintain more consistent focus on your audience.",
        color: "text-error",
        icon: "👀"
      }
    } else if (gaze < 70) {
      return {
        message: "Your eye contact is below average. Work on maintaining more consistent focus.",
        color: "text-warning",
        icon: "🤔"
      }
    } else if (gaze < 85) {
      return {
        message: "Good eye contact, but there's still room for improvement in maintaining focus.",
        color: "text-info",
        icon: "👁️"
      }
    } else if (gaze < 95) {
      return {
        message: "Very good eye contact! You're maintaining strong engagement with your audience.",
        color: "text-success",
        icon: "✨"
      }
    } else {
      return {
        message: "Outstanding eye contact! You're demonstrating exceptional audience engagement.",
        color: "text-success",
        icon: "🌟"
      }
    }
  }

  const getConfidenceLevel = (gaze: number, wpm: number) => {
    // Normalize WPM to a 0-100 scale (assuming 130-150 WPM is optimal)
    const normalizedWPM = Math.min(Math.max((wpm - 110) / (160 - 110) * 100, 0), 100)
    
    // Combine gaze and WPM with weights (60% gaze, 40% WPM)
    const confidenceScore = (gaze * 0.6) + (normalizedWPM * 0.4)
    
    if (confidenceScore < 40) {
      return {
        level: 'Low',
        color: 'text-error',
        bgColor: 'bg-error/20',
        message: 'Your confidence appears low. Focus on maintaining better eye contact and speaking at a steady pace.',
        icon: '🌱'
      }
    } else if (confidenceScore < 60) {
      return {
        level: 'Moderate',
        color: 'text-warning',
        bgColor: 'bg-warning/20',
        message: 'You\'re showing moderate confidence. Keep working on maintaining eye contact and speaking pace.',
        icon: '🌿'
      }
    } else if (confidenceScore < 80) {
      return {
        level: 'Good',
        color: 'text-info',
        bgColor: 'bg-info/20',
        message: 'You\'re showing good confidence! Maintain your current level of engagement.',
        icon: '🌳'
      }
    } else if (confidenceScore < 90) {
      return {
        level: 'Very Good',
        color: 'text-success',
        bgColor: 'bg-success/20',
        message: 'Excellent confidence! You\'re maintaining great eye contact and speaking at a good pace.',
        icon: '🌲'
      }
    } else {
      return {
        level: 'Exceptional',
        color: 'text-success',
        bgColor: 'bg-success/30',
        message: 'Outstanding confidence! You\'re demonstrating exceptional presentation skills.',
        icon: '🎯'
      }
    }
  }

  if (showLandingPage) {
    return <LandingPage onGetStarted={() => setShowLandingPage(false)} />
  }

  if (!selectedDifficulty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
        <div className="container mx-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Choose Your Level
              </h1>
              <p className="text-2xl text-base-content/80">Select a difficulty level to begin your practice session</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-base-100/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="card-body">
                  <h2 className="card-title text-2xl">Beginner</h2>
                  <div className="badge badge-primary">20 seconds</div>
                  <p className="text-base-content/70">Simple topics to get you started</p>
                  <div className="card-actions justify-end mt-4">
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={() => handleDifficultySelect('beginner')}
                    >
                      Start Session
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="card bg-base-100/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="card-body">
                  <h2 className="card-title text-2xl">Intermediate</h2>
                  <div className="badge badge-secondary">45 seconds</div>
                  <p className="text-base-content/70">More challenging topics</p>
                  <div className="card-actions justify-end mt-4">
                    <button 
                      className="btn btn-secondary btn-lg"
                      onClick={() => handleDifficultySelect('intermediate')}
                    >
                      Start Session
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="card bg-base-100/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="card-body">
                  <h2 className="card-title text-2xl">Hard</h2>
                  <div className="badge badge-accent">2 minutes</div>
                  <p className="text-base-content/70">Complex topics for advanced speakers</p>
                  <div className="card-actions justify-end mt-4">
                    <button 
                      className="btn btn-accent btn-lg"
                      onClick={() => handleDifficultySelect('hard')}
                    >
                      Start Session
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                className="btn btn-ghost btn-lg"
                onClick={() => setShowLandingPage(true)}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div className="container mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-2/3">
            <div className="bg-base-100/80 backdrop-blur-sm rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-semibold mb-4">Camera Feed</h2>
              <div className="aspect-video bg-base-300 rounded-lg overflow-hidden shadow-inner relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-base-100/80 px-3 py-1.5 rounded-full shadow-lg">
                    <div className="animate-pulse w-3 h-3 bg-error rounded-full"></div>
                    <span className="text-error font-semibold">Recording</span>
                  </div>
                )}
                {isRecording && (
                  <div className="absolute bottom-4 left-4 bg-base-100/80 px-4 py-2 rounded-lg shadow-lg">
                    <div className="text-lg font-semibold flex items-center gap-2">
                      <span className="text-primary">⏱️</span>
                      <span>{timeRemaining}s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:w-1/3 flex flex-col">
            <StatsPanel metrics={metrics} isRecording={isRecording} />
            
            {!isRecording && !showResults && !selectedDifficulty && (
              <div className="bg-base-100/80 backdrop-blur-sm rounded-lg p-6 shadow-xl mt-4">
                <h2 className="text-2xl font-semibold mb-4">Select Difficulty</h2>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    key="beginner"
                    className="btn btn-primary btn-lg group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20"
                    onClick={() => handleDifficultySelect('beginner')}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="text-lg">Beginner</span>
                      <span className="text-sm opacity-80">({SESSION_DURATIONS.beginner}s)</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 animate-pulse"></div>
                    </div>
                  </button>
                  <button
                    key="intermediate"
                    className="btn btn-primary btn-lg group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20"
                    onClick={() => handleDifficultySelect('intermediate')}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="text-lg">Intermediate</span>
                      <span className="text-sm opacity-80">({SESSION_DURATIONS.intermediate}s)</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 animate-pulse"></div>
                    </div>
                  </button>
                  <button
                    key="advanced"
                    className="btn btn-primary btn-lg group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/20"
                    onClick={() => handleDifficultySelect('hard')}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="text-lg">Advanced</span>
                      <span className="text-sm opacity-80">({SESSION_DURATIONS.hard}s)</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 animate-pulse"></div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {!isRecording && !showResults && selectedDifficulty && (
              <div className="bg-base-100/80 backdrop-blur-sm rounded-lg p-6 shadow-xl mt-4">
                <h2 className="text-2xl font-semibold mb-4">Ready to Start</h2>
                <div className="bg-base-200 rounded-lg p-4 shadow-inner mb-6">
                  <p className="text-lg font-semibold mb-2">Selected Difficulty:</p>
                  <p className="text-xl text-primary">{selectedDifficulty} ({SESSION_DURATIONS[selectedDifficulty]}s)</p>
                </div>
                <div className="flex gap-4">
                  <button
                    className="btn btn-primary btn-lg flex-1 group relative overflow-hidden"
                    onClick={startSession}
                  >
                    <span className="relative z-10">Start Session</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                  <button
                    className="btn btn-ghost btn-lg"
                    onClick={() => setSelectedDifficulty(null)}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {isRecording && (
              <div className="bg-base-100/80 backdrop-blur-sm rounded-lg p-6 shadow-xl mt-4">
                <h2 className="text-2xl font-semibold mb-4">Current Question</h2>
                <div className="bg-base-200 rounded-lg p-4 shadow-inner">
                  <p className="text-lg">{currentQuestion}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    className="btn btn-error btn-lg"
                    onClick={stopSession}
                  >
                    End Session
                  </button>
                </div>
              </div>
            )}

            {showResults && (
              <div className="bg-base-100/80 backdrop-blur-sm rounded-lg p-6 shadow-xl mt-4">
                <h2 className="text-2xl font-semibold mb-4">Session Results</h2>
                <div className="space-y-4">
                  <div className="stat bg-base-200 rounded-lg shadow-inner">
                    <div className="stat-title">Total Words Spoken</div>
                    <div className="stat-value text-primary">{metrics.totalWords}</div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg shadow-inner">
                    <div className="stat-title">Words Per Minute</div>
                    <div className="stat-value text-primary">{metrics.avgWPM}</div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg shadow-inner">
                    <div className="stat-title">Average Gaze Focus</div>
                    <div className="stat-value text-secondary">{metrics.gazeOnPct}%</div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg shadow-inner">
                    <div className="stat-title">Confidence Level</div>
                    <div className="stat-value">
                      <div className={`flex items-center gap-2 ${getConfidenceLevel(metrics.gazeOnPct, metrics.avgWPM).color}`}>
                        <span className="text-2xl">{getConfidenceLevel(metrics.gazeOnPct, metrics.avgWPM).icon}</span>
                        <span>{getConfidenceLevel(metrics.gazeOnPct, metrics.avgWPM).level}</span>
                        <div className="w-32 h-4 bg-base-300 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${getConfidenceLevel(metrics.gazeOnPct, metrics.avgWPM).bgColor}`}
                            style={{ 
                              width: `${Math.min(Math.max((metrics.gazeOnPct * 0.6 + Math.min(Math.max((metrics.avgWPM - 110) / (160 - 110) * 100, 0), 100) * 0.4), 0), 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg shadow-inner">
                    <div className="stat-title">Final Score</div>
                    <div className="stat-value">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-4xl font-bold text-primary">
                          {calculateSessionScore(metrics, timeRemaining, selectedDifficulty!)}/100
                        </div>
                        <div className={`text-lg ${getScoreFeedback(calculateSessionScore(metrics, timeRemaining, selectedDifficulty!)).color}`}>
                          {getScoreFeedback(calculateSessionScore(metrics, timeRemaining, selectedDifficulty!)).message}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-base-200 rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold mb-4">Feedback</h3>
                  <div className="space-y-4">
                    <div className={`${getWPMFeedback(metrics.avgWPM).color} text-lg flex items-center gap-3`}>
                      <span className="text-2xl">{getWPMFeedback(metrics.avgWPM).icon}</span>
                      <div>
                        <span className="font-semibold block">Speaking Pace:</span>
                        <span>{getWPMFeedback(metrics.avgWPM).message}</span>
                      </div>
                    </div>
                    <div className={`${getGazeFeedback(metrics.gazeOnPct).color} text-lg flex items-center gap-3`}>
                      <span className="text-2xl">{getGazeFeedback(metrics.gazeOnPct).icon}</span>
                      <div>
                        <span className="font-semibold block">Eye Contact:</span>
                        <span>{getGazeFeedback(metrics.gazeOnPct).message}</span>
                      </div>
                    </div>
                    <div className={`${getConfidenceLevel(metrics.gazeOnPct, metrics.avgWPM).color} text-lg flex items-center gap-3`}>
                      <span className="text-2xl">{getConfidenceLevel(metrics.gazeOnPct, metrics.avgWPM).icon}</span>
                      <div>
                        <span className="font-semibold block">Confidence:</span>
                        <span>{getConfidenceLevel(metrics.gazeOnPct, metrics.avgWPM).message}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    className="btn btn-primary btn-lg w-full group relative overflow-hidden"
                    onClick={() => {
                      setSelectedDifficulty(null)
                      setShowResults(false)
                    }}
                  >
                    <span className="relative z-10">Back to Difficulty Selection</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 