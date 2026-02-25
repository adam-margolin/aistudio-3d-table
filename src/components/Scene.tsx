import { useState, useCallback, useEffect } from 'react';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Spreadsheet } from './Spreadsheet';
import { ArtifactBoard } from './ArtifactBoard';
import { Artifact, PlotData } from '../types';
import { VisualizationStrategy, InteractionStrategy, ProgressStrategy } from '../App';
import { Theme } from '../themes';

// Mock Data Generator
const generateMockArtifact = (id: string, type?: string): Artifact => {
  const types = ['Descriptive Stats', 'Linear Regression', 'Clustering', 'Time Series'];
  const selectedType = type || types[Math.floor(Math.random() * types.length)];
  
  const generateData = () => Array.from({ length: 10 }, () => Math.random() * 100);

  return {
    id,
    title: `${selectedType} Analysis`,
    summary: `Analysis completed successfully.\n\nMean: ${(Math.random() * 50 + 20).toFixed(2)}\nStd Dev: ${(Math.random() * 10).toFixed(2)}\nVariance: ${(Math.random() * 100).toFixed(2)}\n\nFound significant correlation (p < 0.05) in the selected dataset.`,
    plots: [
      {
        id: `plot-1-${id}`,
        type: 'bar',
        title: 'Distribution',
        data: generateData(),
      },
      {
        id: `plot-2-${id}`,
        type: 'scatter',
        title: 'Residuals',
        data: generateData(),
      },
      {
        id: `plot-3-${id}`,
        type: 'bar',
        title: 'Feature Importance',
        data: generateData(),
      },
      {
        id: `plot-4-${id}`,
        type: 'scatter',
        title: 'Correlation',
        data: generateData(),
      },
      {
        id: `plot-5-${id}`,
        type: 'bar',
        title: 'Variance',
        data: generateData(),
      },
      {
        id: `plot-6-${id}`,
        type: 'scatter',
        title: 'Outliers',
        data: generateData(),
      }
    ],
    createdAt: Date.now(),
    status: 'complete',
  };
};

interface SceneProps {
  triggerRun: number;
  strategy: VisualizationStrategy;
  interactionStrategy: InteractionStrategy;
  progressStrategy: ProgressStrategy;
  onRunAlgorithm: () => void;
  theme: Theme;
}

export function Scene({ triggerRun, strategy, interactionStrategy, progressStrategy, onRunAlgorithm, theme }: SceneProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const runAlgorithm = useCallback((type?: string) => {
    setIsProcessing(true);
    
    if (progressStrategy === 'artifact-streaming') {
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
          setArtifacts(prev => prev.map(a => a.id === newId ? generateMockArtifact(newId, type) : a));
          setIsProcessing(false);
        } else {
          setArtifacts(prev => prev.map(a => a.id === newId ? { ...a, progress } : a));
        }
      }, 150);
    } else {
      // Simulate processing time
      setTimeout(() => {
        const newId = `artifact-${Date.now()}`;
        const newArtifact = generateMockArtifact(newId, type);
        
        setArtifacts(prev => [newArtifact, ...prev]);
        setActiveArtifactId(newId);
        setIsProcessing(false);
      }, 1500);
    }
  }, [progressStrategy]);

  useEffect(() => {
    if (triggerRun > 0) {
      runAlgorithm();
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
        position={[-4, 0, 0]} 
        interactionStrategy={interactionStrategy} 
        onRunAlgorithm={runAlgorithm}
        isProcessing={isProcessing && progressStrategy === 'spreadsheet-overlay'}
        theme={theme}
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
          />
        );
      })}

      {/* Controls */}
      <OrbitControls
        makeDefault
        enableRotate={false}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={5}
        maxDistance={40}
        target={[0, 4, 0]}
      />
    </>
  );
}
