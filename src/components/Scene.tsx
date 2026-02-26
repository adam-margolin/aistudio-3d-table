import { useState, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Spreadsheet } from './Spreadsheet';
import { ArtifactBoard } from './ArtifactBoard';
import { Artifact, PlotData } from '../types';
import { VisualizationStrategy, InteractionStrategy, ProgressStrategy } from '../App';
import { Theme } from '../themes';

// Mock Data Generator
const generateMockArtifact = (id: string, type?: string, numPlots: number = 6): Artifact => {
  const types = ['Descriptive Stats', 'Linear Regression', 'Clustering', 'Time Series'];
  const selectedType = type || types[Math.floor(Math.random() * types.length)];

  const generateData = () => Array.from({ length: 10 }, () => Math.random() * 100);

  const defaultTitles = ['Distribution', 'Residuals', 'Feature Importance', 'Correlation', 'Variance', 'Outliers'];

  const plots: PlotData[] = Array.from({ length: numPlots }, (_, i) => ({
    id: `plot-${i + 1}-${id}`,
    type: (i % 2 === 0 ? 'bar' : 'scatter') as 'bar' | 'scatter',
    title: defaultTitles[i] || `Analysis Plot ${i + 1}`,
    data: generateData(),
  }));

  return {
    id,
    title: `${selectedType} Analysis`,
    summary: `Analysis completed successfully.\n\nMean: ${(Math.random() * 50 + 20).toFixed(2)}\nStd Dev: ${(Math.random() * 10).toFixed(2)}\nVariance: ${(Math.random() * 100).toFixed(2)}\n\nFound significant correlation (p < 0.05) in the selected dataset.`,
    plots,
    createdAt: Date.now(),
    status: 'complete',
  };
};

interface SceneProps {
  triggerRun: { id: number, type?: string, numPlots?: number };
  strategy: VisualizationStrategy;
  interactionStrategy: InteractionStrategy;
  progressStrategy: ProgressStrategy;
  onRunAlgorithm: () => void;
  theme: Theme;
  enable3DControls: boolean;
}

export function Scene({ triggerRun, strategy, interactionStrategy, progressStrategy, onRunAlgorithm, theme, enable3DControls }: SceneProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Layout Architecture Math ---
  const { viewport, size } = useThree();

  // 1. Convert pixel reservations to 3D units
  const toolsPanelPx = 352; // 320px width + 32px margin 
  const marginPx = 32;

  const toolsPanel3D = (toolsPanelPx / size.width) * viewport.width;
  const margin3D = (marginPx / size.width) * viewport.width;

  // 2. Usable Horizontal Screen Width
  const availableWidth = viewport.width - toolsPanel3D - margin3D;

  // 3. Grid Columns
  const centerGap3D = margin3D;
  const tableWidth = (availableWidth - centerGap3D) / 2;
  const graphicsWidth = tableWidth;

  // 4. Vertical Grid
  const topMarginRatio = 0.20; // 20% flat top margin
  const topY = (viewport.height / 2) - (viewport.height * topMarginRatio);

  const bottomMarginPx = 32;
  const bottomMargin3D = (bottomMarginPx / size.height) * viewport.height;

  // Constrain bottom edge to not cut into the floor plane at y=-2.0
  const floorY = -1.9;
  const bottomY = Math.max(-viewport.height / 2 + bottomMargin3D, floorY);

  const tableHeight = Math.max(topY - bottomY, 2); // Ensure positive minimum height

  // 5. Explicit Positioning
  const tableX = -viewport.width / 2 + margin3D + tableWidth / 2;
  const tableY = bottomY + tableHeight / 2;

  // Artifacts Root Position
  const graphicsX = tableX + tableWidth / 2 + centerGap3D + graphicsWidth / 2;

  const runAlgorithm = useCallback((type?: string, numPlots?: number) => {
    setIsProcessing(true);

    if (progressStrategy === 'none') {
      const newId = `artifact-${Date.now()}`;
      const newArtifact = generateMockArtifact(newId, type, numPlots);

      setArtifacts(prev => [newArtifact, ...prev]);
      setActiveArtifactId(newId);
      setIsProcessing(false);
    } else if (progressStrategy === 'artifact-streaming') {
      const newId = `artifact-${Date.now()}`;
      const pendingArtifact: Artifact = {
        id: newId,
        title: `${type || 'Analysis'} (Running...)`,
        summary: '',
        plots: [],
        createdAt: Date.now(),
        status: 'pending',
        progress: 0,
      };

      setArtifacts(prev => [pendingArtifact, ...prev]);
      setActiveArtifactId(newId);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.1;
        if (progress >= 1) {
          clearInterval(interval);
          setArtifacts(prev => prev.map(a => a.id === newId ? generateMockArtifact(newId, type, numPlots) : a));
          setIsProcessing(false);
        } else {
          setArtifacts(prev => prev.map(a => a.id === newId ? { ...a, progress } : a));
        }
      }, 75);
    } else {
      // Simulate processing time
      setTimeout(() => {
        const newId = `artifact-${Date.now()}`;
        const newArtifact = generateMockArtifact(newId, type, numPlots);

        setArtifacts(prev => [newArtifact, ...prev]);
        setActiveArtifactId(newId);
        setIsProcessing(false);
      }, 750);
    }
  }, [progressStrategy]);

  useEffect(() => {
    if (triggerRun && triggerRun.id > 0) {
      runAlgorithm(triggerRun.type, triggerRun.numPlots);
    }
  }, [triggerRun, runAlgorithm]);

  const handleArtifactClick = (id: string) => {
    setActiveArtifactId(id);
  };

  return (
    <>
      <color attach="background" args={[theme.background]} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.1, 50]} />
      </directionalLight>
      <pointLight position={[-10, 10, -10]} intensity={0.5} color={theme.accent} />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={theme.floorplane} roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Grid helper for a professional tech look */}
      <gridHelper args={[100, 100, theme.grid, theme.grid]} position={[0, -1.99, 0]} />

      {/* Contact Shadows for realism */}
      <ContactShadows
        position={[0, -1.99, 0]}
        opacity={0.8}
        scale={20}
        blur={2}
        far={10}
        resolution={256}
        color="#000000"
      />

      {/* 3D Spreadsheet Container */}
      <Spreadsheet
        interactionStrategy={interactionStrategy}
        onRunAlgorithm={runAlgorithm}
        isProcessing={isProcessing && progressStrategy === 'spreadsheet-overlay'}
        theme={theme}
        tableX={tableX}
        tableY={tableY}
        tableWidth={tableWidth}
        tableHeight={tableHeight}
      />

      {/* Artifact Boards */}
      {artifacts.map((artifact) => {
        // Calculate the visual index in the stack
        const isActive = artifact.id === activeArtifactId;
        const inactiveIndex = isActive ? 0 : artifacts.filter(a => a.id !== activeArtifactId).indexOf(artifact);

        return (
          <ArtifactBoard
            key={artifact.id}
            artifact={artifact}
            isActive={isActive}
            inactiveIndex={inactiveIndex}
            onClick={() => handleArtifactClick(artifact.id)}
            strategy={strategy}
            theme={theme}
            boundaryWidth={graphicsWidth}
            boundaryHeight={tableHeight}
            boundaryX={graphicsX}
            boundaryY={tableY}
          />
        );
      })}

      {/* Controls */}
      <OrbitControls
        makeDefault
        enableRotate={enable3DControls}
        enablePan={enable3DControls}
        enableZoom={enable3DControls}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={5}
        maxDistance={40}
        target={[0, 4, 0]}
      />
    </>
  );
}
