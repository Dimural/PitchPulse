import { FC } from 'react';
import { SessionMetrics } from '../types';

interface StatsPanelProps {
  metrics: SessionMetrics;
}

export const StatsPanel: FC<StatsPanelProps> = ({ metrics }) => {
  return (
    <div className="stats-panel">
      <div className="stat">
        <h3>Words per Minute</h3>
        <p>{metrics.wpm.toFixed(1)}</p>
      </div>
      <div className="stat">
        <h3>Eye Contact</h3>
        <p>{metrics.gazeOnPct.toFixed(1)}%</p>
      </div>
      <div className="stat">
        <h3>Confidence</h3>
        <p>{metrics.confidence.toFixed(1)}%</p>
      </div>
    </div>
  );
}; 