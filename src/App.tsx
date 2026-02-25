import { Component, ErrorInfo, ReactNode, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 w-full h-full bg-[#0B0E14] text-red-500 p-8 font-mono">
          <h1 className="text-2xl mb-4">Something went wrong</h1>
          <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export type VisualizationStrategy = 'spatial-sidebar' | 'background-tabs' | 'spatial-grouping';
export type InteractionStrategy = 'ui-overlay' | 'contextual-menu';
export type ProgressStrategy = 'spreadsheet-overlay' | 'artifact-streaming';

export default function App() {
  const [triggerRun, setTriggerRun] = useState<number>(0);
  const [strategy, setStrategy] = useState<VisualizationStrategy>('spatial-sidebar');
  const [interactionStrategy, setInteractionStrategy] = useState<InteractionStrategy>('ui-overlay');
  const [progressStrategy, setProgressStrategy] = useState<ProgressStrategy>('spreadsheet-overlay');

  const handleRun = useCallback(() => {
    setTriggerRun(Date.now());
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#0B0E14] overflow-hidden">
      <ErrorBoundary>
        <Canvas
          camera={{ position: [0, 5, 15], fov: 45 }}
          shadows
          gl={{ antialias: true, localClippingEnabled: true }}
        >
          <Scene 
            triggerRun={triggerRun} 
            strategy={strategy} 
            interactionStrategy={interactionStrategy} 
            progressStrategy={progressStrategy}
            onRunAlgorithm={handleRun} 
          />
        </Canvas>
      </ErrorBoundary>

      {/* 2D UI Overlay */}
      <div className="absolute bottom-8 right-8 z-10">
        <div className="flex flex-col gap-4 bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-2xl w-80 max-h-[80vh] overflow-y-auto">
          <h2 className="text-slate-200 font-semibold text-lg">Analysis Tools</h2>
          <p className="text-slate-400 text-sm">Select data from the spreadsheet and run an algorithm.</p>
          
          {interactionStrategy === 'ui-overlay' ? (
            <div className="flex flex-col gap-2 mt-2">
              <button 
                onClick={handleRun}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                Run Descriptive Stats
              </button>
              <button 
                onClick={handleRun}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors border border-slate-700"
              >
                Run Linear Regression
              </button>
            </div>
          ) : (
            <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-slate-300 text-sm text-center">
                Right-click on the spreadsheet to access analysis tools.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-700/50">
            <h3 className="text-slate-200 font-semibold text-sm">Interaction Strategy</h3>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
              <input 
                type="radio" 
                name="interactionStrategy" 
                value="ui-overlay" 
                checked={interactionStrategy === 'ui-overlay'} 
                onChange={() => setInteractionStrategy('ui-overlay')}
                className="cursor-pointer"
              />
              UI Overlay
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
              <input 
                type="radio" 
                name="interactionStrategy" 
                value="contextual-menu" 
                checked={interactionStrategy === 'contextual-menu'} 
                onChange={() => setInteractionStrategy('contextual-menu')}
                className="cursor-pointer"
              />
              Contextual Menu
            </label>
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-700/50">
            <h3 className="text-slate-200 font-semibold text-sm">Progress Strategy</h3>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
              <input 
                type="radio" 
                name="progressStrategy" 
                value="spreadsheet-overlay" 
                checked={progressStrategy === 'spreadsheet-overlay'} 
                onChange={() => setProgressStrategy('spreadsheet-overlay')}
                className="cursor-pointer"
              />
              Spreadsheet Overlay
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
              <input 
                type="radio" 
                name="progressStrategy" 
                value="artifact-streaming" 
                checked={progressStrategy === 'artifact-streaming'} 
                onChange={() => setProgressStrategy('artifact-streaming')}
                className="cursor-pointer"
              />
              Artifact Streaming
            </label>
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-700/50">
            <h3 className="text-slate-200 font-semibold text-sm">Visualization Strategy</h3>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
              <input 
                type="radio" 
                name="strategy" 
                value="spatial-sidebar" 
                checked={strategy === 'spatial-sidebar'} 
                onChange={() => setStrategy('spatial-sidebar')}
                className="cursor-pointer"
              />
              Spatial Sidebar
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
              <input 
                type="radio" 
                name="strategy" 
                value="background-tabs" 
                checked={strategy === 'background-tabs'} 
                onChange={() => setStrategy('background-tabs')}
                className="cursor-pointer"
              />
              Background Tabs
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
              <input 
                type="radio" 
                name="strategy" 
                value="spatial-grouping" 
                checked={strategy === 'spatial-grouping'} 
                onChange={() => setStrategy('spatial-grouping')}
                className="cursor-pointer"
              />
              Spatial Grouping
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
