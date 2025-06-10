import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import type { SessionMetrics } from '../pages/App'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type ReportCardProps = {
  metrics: SessionMetrics
  transcript: string
  onClose: () => void
}

type ReportSummary = {
  summary: string
  tips: string[]
}

export default function ReportCard({ metrics, transcript, onClose }: ReportCardProps) {
  const [summary, setSummary] = useState<ReportSummary | null>(null)

  useEffect(() => {
    // TODO: Call GPT-4 to generate summary and tips
    // This is a placeholder for now
    setSummary({
      summary: "Your presentation showed good engagement but could use some pacing adjustments. You maintained good eye contact but occasionally spoke too quickly.",
      tips: [
        "Practice speaking at a more measured pace",
        "Consider adding more pauses between key points",
        "Work on reducing filler words in transitions"
      ]
    })
  }, [metrics, transcript])

  const chartData = {
    labels: ['Start', '25%', '50%', '75%', 'End'],
    datasets: [
      {
        label: 'Filler Words',
        data: [0, 2, 1, 3, 1], // TODO: Replace with actual data
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Presentation Report</h2>
        
        <div className="stats shadow mb-4">
          <div className="stat">
            <div className="stat-title">Average Pace</div>
            <div className="stat-value">{Math.round(metrics.avgWPM)} WPM</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Filler Words</div>
            <div className="stat-value">{metrics.fillerCount}</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Eye Contact</div>
            <div className="stat-value">{Math.round(metrics.gazeOnPct)}%</div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Filler Word Trend</h3>
          <Line data={chartData} />
        </div>

        {summary && (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p>{summary.summary}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Top Tips</h3>
              <ul className="list-disc list-inside">
                {summary.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 