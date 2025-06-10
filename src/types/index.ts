export interface SessionMetrics {
  wpm: number;
  gazeOnPct: number;
  confidence: number;
  fillerCount: number;
  alignmentScore: number;
  lastUpdate: number;
  runtime: string;
  refineLandmarks: boolean;
  maxFaces: number;
} 