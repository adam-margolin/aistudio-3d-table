import { Component, ErrorInfo, ReactNode, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { Theme, themes } from './themes';

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

export type VisualizationStrategy = 'spatial-sidebar' | 'background-tabs' | 'spatial-grouping' | 'immersive-gallery';
export type InteractionStrategy = 'ui-overlay' | 'contextual-menu';
export type ProgressStrategy = 'none' | 'spreadsheet-overlay' | 'artifact-streaming';

export default function App() {
  const [triggerRun, setTriggerRun] = useState<{ id: number, type?: string, numPlots?: number }>({ id: 0 });
  const [numPlots, setNumPlots] = useState<number>(10);
  const [strategy, setStrategy] = useState<VisualizationStrategy>('spatial-sidebar');
  const [interactionStrategy, setInteractionStrategy] = useState<InteractionStrategy>('ui-overlay');
  const [progressStrategy, setProgressStrategy] = useState<ProgressStrategy>('none');
  const [themeId, setThemeId] = useState<string>('blue-purple');
  const [isMenuCollapsed, setIsMenuCollapsed] = useState<boolean>(false);
  const [enable3DControls, setEnable3DControls] = useState<boolean>(false);

  const currentTheme = themes.find(t => t.id === themeId) || themes[0];

  const handleRun = useCallback((type?: string, customNumPlots?: number) => {
    setTriggerRun({ id: Date.now(), type, numPlots: customNumPlots });
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ backgroundColor: currentTheme.background }}>
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
            theme={currentTheme}
            enable3DControls={enable3DControls}
          />
        </Canvas>
      </ErrorBoundary>

      {/* 2D UI Overlay */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col items-end gap-4">
        <button
          onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
          className="px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-colors font-medium text-sm flex items-center gap-2"
          style={{ backgroundColor: currentTheme.uiBackground, color: currentTheme.uiText, border: '1px solid ' + currentTheme.uiBorder }}
        >
          {isMenuCollapsed ? '🛠️ Show Tools' : '✕ Hide Tools'}
        </button>

        {!isMenuCollapsed && (
          <div
            className="flex flex-col gap-4 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-80 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: currentTheme.uiBackground, color: currentTheme.uiText, border: '1px solid ' + currentTheme.uiBorder }}
          >
            <h2 className="font-semibold text-lg" style={{ color: currentTheme.textHeader }}>Analysis Tools</h2>
            <p className="text-sm" style={{ color: currentTheme.textData }}>Select data from the spreadsheet and run an algorithm.</p>

            {interactionStrategy === 'ui-overlay' ? (
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={() => handleRun('Descriptive Stats')}
                  className="px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-lg"
                  style={{ backgroundColor: currentTheme.accent, boxShadow: `0 10px 15px -3px ${currentTheme.accent}33` }}
                >
                  Run Descriptive Stats
                </button>
                <button
                  onClick={() => handleRun('Linear Regression')}
                  className="px-4 py-2 rounded-lg font-medium transition-colors border"
                  style={{ backgroundColor: currentTheme.container, color: currentTheme.textData, borderColor: currentTheme.uiBorder }}
                >
                  Run Linear Regression
                </button>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleRun('Multi-Panel Test', numPlots)}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors border shadow-sm"
                    style={{ backgroundColor: currentTheme.container, color: currentTheme.textData, borderColor: currentTheme.uiBorder }}
                  >
                    Load Multi-Panel
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numPlots}
                    onChange={(e) => setNumPlots(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-2 rounded-lg border text-sm text-center focus:outline-none focus:ring-2"
                    title="Number of Panels"
                    style={{
                      backgroundColor: currentTheme.container,
                      color: currentTheme.textData,
                      borderColor: currentTheme.uiBorder,
                      outlineColor: currentTheme.accent
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-2 p-3 rounded-lg border" style={{ backgroundColor: currentTheme.container, borderColor: currentTheme.uiBorder }}>
                <p className="text-sm text-center" style={{ color: currentTheme.textData }}>
                  Right-click on the spreadsheet to access analysis tools.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t" style={{ borderColor: currentTheme.uiBorder }}>
              <h3 className="font-semibold text-sm" style={{ color: currentTheme.textHeader }}>Theme</h3>
              <select
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                className="w-full p-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: currentTheme.container,
                  color: currentTheme.textData,
                  borderColor: currentTheme.uiBorder,
                  outlineColor: currentTheme.accent
                }}
              >
                {themes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t" style={{ borderColor: currentTheme.uiBorder }}>
              <h3 className="font-semibold text-sm" style={{ color: currentTheme.textHeader }}>Interaction Strategy</h3>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: currentTheme.textData }}>
                <input
                  type="radio"
                  name="interactionStrategy"
                  value="ui-overlay"
                  checked={interactionStrategy === 'ui-overlay'}
                  onChange={() => setInteractionStrategy('ui-overlay')}
                  className="cursor-pointer"
                  style={{ accentColor: currentTheme.accent }}
                />
                UI Overlay
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: currentTheme.textData }}>
                <input
                  type="radio"
                  name="interactionStrategy"
                  value="contextual-menu"
                  checked={interactionStrategy === 'contextual-menu'}
                  onChange={() => setInteractionStrategy('contextual-menu')}
                  className="cursor-pointer"
                  style={{ accentColor: currentTheme.accent }}
                />
                Contextual Menu
              </label>
            </div>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t" style={{ borderColor: currentTheme.uiBorder }}>
              <h3 className="font-semibold text-sm" style={{ color: currentTheme.textHeader }}>Progress Strategy</h3>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: currentTheme.textData }}>
                <input
                  type="radio"
                  name="progressStrategy"
                  value="none"
                  checked={progressStrategy === 'none'}
                  onChange={() => setProgressStrategy('none')}
                  className="cursor-pointer"
                  style={{ accentColor: currentTheme.accent }}
                />
                None (Immediate)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: currentTheme.textData }}>
                <input
                  type="radio"
                  name="progressStrategy"
                  value="spreadsheet-overlay"
                  checked={progressStrategy === 'spreadsheet-overlay'}
                  onChange={() => setProgressStrategy('spreadsheet-overlay')}
                  className="cursor-pointer"
                  style={{ accentColor: currentTheme.accent }}
                />
                Spreadsheet Overlay
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: currentTheme.textData }}>
                <input
                  type="radio"
                  name="progressStrategy"
                  value="artifact-streaming"
                  checked={progressStrategy === 'artifact-streaming'}
                  onChange={() => setProgressStrategy('artifact-streaming')}
                  className="cursor-pointer"
                  style={{ accentColor: currentTheme.accent }}
                />
                Artifact Streaming
              </label>
            </div>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t" style={{ borderColor: currentTheme.uiBorder }}>
              <h3 className="font-semibold text-sm" style={{ color: currentTheme.textHeader }}>Visualization Strategy</h3>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: currentTheme.textData }}>
                <input
                  type="radio"
                  name="strategy"
                  value="spatial-sidebar"
                  checked={strategy === 'spatial-sidebar'}
                  onChange={() => setStrategy('spatial-sidebar')}
                  className="cursor-pointer"
                  style={{ accentColor: currentTheme.accent }}
                />
                Spatial Sidebar
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: currentTheme.textData }}>
                <input
                  type="radio"
                  name="strategy"
                  value="background-tabs"
                  checked={strategy === 'background-tabs'}
                  onChange={() => setStrategy('background-tabs')}
                  className="cursor-pointer"
                  style={{ accentColor: currentTheme.accent }}
                />
                Background Tabs
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: currentTheme.textData }}>
                <input
                  type="radio"
                  name="strategy"
                  value="spatial-grouping"
                  checked={strategy === 'spatial-grouping'}
                  onChange={() => setStrategy('spatial-grouping')}
                  className="cursor-pointer"
                  style={{ accentColor: currentTheme.accent }}
                />
                Spatial Grouping
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: currentTheme.textData }}>
                <input
                  type="radio"
                  name="strategy"
                  value="immersive-gallery"
                  checked={strategy === 'immersive-gallery'}
                  onChange={() => setStrategy('immersive-gallery')}
                  className="cursor-pointer"
                  style={{ accentColor: currentTheme.accent }}
                />
                Immersive Gallery
              </label>
            </div>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t" style={{ borderColor: currentTheme.uiBorder }}>
              <h3 className="font-semibold text-sm" style={{ color: currentTheme.textHeader }}>3D Camera controls</h3>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: currentTheme.textData }}>
                <input
                  type="checkbox"
                  checked={enable3DControls}
                  onChange={() => setEnable3DControls(!enable3DControls)}
                  className="cursor-pointer"
                  style={{ accentColor: currentTheme.accent }}
                />
                Enable 3D Controls
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
