export interface PlotData {
  id: string;
  type: 'bar' | 'scatter';
  title: string;
  data: number[];
}

export interface Artifact {
  id: string;
  title: string;
  summary: string;
  plots: PlotData[];
  createdAt: number;
  status?: 'pending' | 'complete';
  progress?: number;
}
