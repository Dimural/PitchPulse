import React from 'react'

interface Props {
  metrics: { gazeOnPct: number }
  isRecording: boolean
}

export const StatsPanel = ({ metrics, isRecording }: Props) => {
  return (
    <div className="bg-base-100 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Live Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-title">Speaking</div>
          <div className="stat-value text-primary">{isRecording ? 'Active' : 'Inactive'}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-title">Gaze Focus</div>
          <div className="stat-value text-secondary">{metrics.gazeOnPct}%</div>
        </div>
      </div>
    </div>
  )
} 