import React from 'react'
import { motion } from 'framer-motion'

interface LandingPageProps {
  onGetStarted: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Logo and Title Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-8">
              <div className="relative w-32 h-32 mx-auto">
                {/* Logo Design */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full transform rotate-45" />
                <div className="absolute inset-2 bg-base-100 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-base-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                      <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PitchPulse
            </h1>
            <p className="text-2xl text-base-content/80 mb-2">Your AI-Powered Speech Coach</p>
            <p className="text-base-content/60">Master the art of public speaking with real-time feedback</p>
          </motion.div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-base-200/90 backdrop-blur-lg rounded-xl p-6 border border-base-300"
            >
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2 text-base-content">Real-time Feedback</h3>
              <p className="text-base-content/80">Get instant feedback on your speaking pace and eye contact during practice sessions.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-base-200/90 backdrop-blur-lg rounded-xl p-6 border border-base-300"
            >
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2 text-base-content">AI-Powered Analysis</h3>
              <p className="text-base-content/80">Advanced AI technology analyzes your speech patterns and provides detailed insights.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-base-200/90 backdrop-blur-lg rounded-xl p-6 border border-base-300"
            >
              <div className="text-3xl mb-4">💪</div>
              <h3 className="text-xl font-semibold mb-2 text-base-content">Confidence Building</h3>
              <p className="text-base-content/80">Build your confidence through structured practice sessions with varying difficulty levels.</p>
            </motion.div>
          </div>

          {/* Get Started Button */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center"
          >
            <button
              onClick={onGetStarted}
              className="btn btn-primary btn-lg px-12 text-lg font-semibold hover:scale-105 transition-transform duration-300"
            >
              Get Started
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage 