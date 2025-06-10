import { render, screen } from '@testing-library/react'
import BorderCue from '../BorderCue'
import type { SessionMetrics } from '../../pages/App'

describe('BorderCue', () => {
  const defaultMetrics: SessionMetrics = {
    fillerCount: 0,
    avgWPM: 120,
    gazeOnPct: 90,
    alignmentScore: 0.9
  }

  it('renders with good state by default', () => {
    render(<BorderCue metrics={defaultMetrics} />)
    const border = screen.getByRole('generic')
    expect(border).toHaveClass('border-cue good')
  })

  it('changes to warning state when metrics exceed thresholds', () => {
    const warningMetrics: SessionMetrics = {
      ...defaultMetrics,
      avgWPM: 160,
      gazeOnPct: 70,
      alignmentScore: 0.7
    }
    render(<BorderCue metrics={warningMetrics} />)
    const border = screen.getByRole('generic')
    expect(border).toHaveClass('border-cue warning')
  })

  it('changes to critical state when metrics exceed double thresholds', () => {
    const criticalMetrics: SessionMetrics = {
      ...defaultMetrics,
      avgWPM: 310,
      gazeOnPct: 40,
      alignmentScore: 0.4
    }
    render(<BorderCue metrics={criticalMetrics} />)
    const border = screen.getByRole('generic')
    expect(border).toHaveClass('border-cue critical')
  })
}) 