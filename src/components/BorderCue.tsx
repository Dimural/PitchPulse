import React from 'react'
import { SessionMetrics } from '../pages/App'

interface BorderCueProps {
  metrics: SessionMetrics
}

const BorderCue: React.FC<BorderCueProps> = ({ metrics }) => {
  const getBorderColor = () => {
    const { gazeOnPct, alignmentScore } = metrics
    
    if (gazeOnPct < 50 || alignmentScore < 0.5) {
      return 'border-red-500'
    } else if (gazeOnPct < 80 || alignmentScore < 0.8) {
      return 'border-yellow-500'
    }
    return 'border-green-500'
  }

  return (
    <div className={`fixed inset-0 pointer-events-none border-4 ${getBorderColor()} transition-colors duration-500`} />
  )
}

export default BorderCue 