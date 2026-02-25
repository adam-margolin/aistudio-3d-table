import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Artifact, PlotData } from '../types';
import { VisualizationStrategy } from '../App';

interface ArtifactBoardProps {
  artifact: Artifact;
  isActive: boolean;
  inactiveIndex: number;
  onClick: () => void;
  strategy: VisualizationStrategy;
}

// A simple 3D Bar Chart
function BarChart({ data, position, opacity = 1 }: { data: number[], position: [number, number, number], opacity?: number }) {
  const maxVal = Math.max(...data, 1);
  const barWidth = 0.2;
  const gap = 0.05;
  const totalWidth = data.length * barWidth + (data.length - 1) * gap;
  const startX = -totalWidth / 2 + barWidth / 2;

  return (
    <group position={position}>
      {data.map((val, i) => {
        const height = (val / maxVal) * 2; // Max height 2
        return (
          <group key={i} position={[startX + i * (barWidth + gap), height / 2, 0]}>
            <RoundedBox args={[barWidth, height, barWidth]} radius={0.02} castShadow receiveShadow>
              <meshStandardMaterial color="#3b82f6" roughness={0.4} metalness={0.8} transparent opacity={opacity} />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}

// A simple 3D Scatter Plot
function ScatterPlot({ data, position, opacity = 1 }: { data: number[], position: [number, number, number], opacity?: number }) {
  const maxVal = Math.max(...data, 1);
  const width = 2.5;
  const height = 2;
  const startX = -width / 2;

  return (
    <group position={position}>
      {/* Axes */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width + 0.2, 0.02, 0.02]} />
        <meshStandardMaterial color="#64748b" transparent opacity={opacity} />
      </mesh>
      <mesh position={[startX, height / 2, 0]}>
        <boxGeometry args={[0.02, height + 0.2, 0.02]} />
        <meshStandardMaterial color="#64748b" transparent opacity={opacity} />
      </mesh>

      {/* Points */}
      {data.map((val, i) => {
        const x = startX + (i / (data.length - 1)) * width;
        const y = (val / maxVal) * height;
        return (
          <mesh key={i} position={[x, y, 0]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#10b981" roughness={0.2} metalness={0.5} transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
}

function PlotViewer({ plots, activeIndex, onSelect, isActive, isExpanded, onToggleExpand, boardHeight }: { plots: PlotData[], activeIndex: number, onSelect: (idx: number) => void, isActive: boolean, isExpanded: boolean, onToggleExpand: () => void, boardHeight: number }) {
  const activePlot = plots[activeIndex];
  const [page, setPage] = useState(0);

  if (!activePlot) return null;

  // For expanded view, we show a 2x2 grid (max 4 plots per page)
  const plotsPerPage = 4;
  const totalPages = Math.ceil(plots.length / plotsPerPage);
  const currentPlots = plots.slice(page * plotsPerPage, (page + 1) * plotsPerPage);

  const cols = 2;
  const rows = 2;

  const viewerPosition = isExpanded ? [1.5, 0.5, 0.2] : [1, -0.5, 0.2];

  return (
    <group position={viewerPosition as [number, number, number]}>
      {/* Active Plot Display or Grid Display */}
      {isExpanded ? (
        <group position={[0, 0, 0]}>
          {currentPlots.map((plot, i) => {
            // Calculate grid position for 2x2
            const col = i % cols;
            const row = Math.floor(i / cols);
            const xOffset = col * 4 - 2;
            const yOffset = 1.9 - row * 3.8;
            
            // Add a slight curve to the gallery to make it feel more immersive
            const rotationY = -xOffset * 0.05;
            const zOffset = Math.abs(xOffset) * 0.2;
            
            return (
              <group key={plot.id} position={[xOffset, yOffset, zOffset]} rotation={[0, rotationY, 0]}>
                <Text
                  position={[0, 2.2, 0]}
                  fontSize={0.2}
                  color="#f8fafc"
                  anchorX="center"
                  anchorY="bottom"
                >
                  {plot.title}
                </Text>
                
                {plot.type === 'bar' ? (
                  <BarChart data={plot.data} position={[0, 0, 0]} />
                ) : (
                  <ScatterPlot data={plot.data} position={[0, 0, 0]} />
                )}
              </group>
            );
          })}

          {/* Pagination Controls in 3D Space */}
          {totalPages > 1 && (
            <Html position={[-1.5, -3.5, 0]} transform center zIndexRange={[100, 0]}>
              <div className="flex items-center gap-4 bg-slate-900/80 p-2 rounded-full border border-slate-700/50 backdrop-blur-md pointer-events-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); setPage(Math.max(0, page - 1)); }}
                  disabled={page === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors pointer-events-auto"
                >
                  ←
                </button>
                <span className="text-slate-300 text-sm font-medium">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setPage(Math.min(totalPages - 1, page + 1)); }}
                  disabled={page === totalPages - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors pointer-events-auto"
                >
                  →
                </button>
              </div>
            </Html>
          )}
        </group>
      ) : (
        <group>
          <Text
            position={[0, 2.2, 0]}
            fontSize={0.2}
            color="#f8fafc"
            anchorX="center"
            anchorY="bottom"
          >
            {activePlot.title}
          </Text>
          
          {activePlot.type === 'bar' ? (
            <BarChart data={activePlot.data} position={[0, 0, 0]} />
          ) : (
            <ScatterPlot data={activePlot.data} position={[0, 0, 0]} />
          )}
        </group>
      )}

      {/* Tabs / Buttons UI - Only show when the board is active */}
      {isActive && (
        <Html position={[isExpanded ? -1.5 : 0, -boardHeight / 2 + 0.6 - viewerPosition[1], 0]} transform center zIndexRange={[100, 0]}>
          <div className="flex flex-wrap justify-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-700/50 backdrop-blur-md w-max max-w-[800px] pointer-events-auto">
            {!isExpanded && plots.map((plot, i) => {
              const isPlotActive = i === activeIndex;
              return (
                <button
                  key={plot.id}
                  onClick={(e) => { e.stopPropagation(); onSelect(i); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all pointer-events-auto ${
                    isPlotActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {/* Simple icon based on type */}
                  <span className="opacity-80">
                    {plot.type === 'bar' ? '📊' : '📈'}
                  </span>
                  {plot.title}
                </button>
              );
            })}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all bg-slate-100 text-slate-900 hover:bg-white shadow-lg pointer-events-auto"
            >
              {isExpanded ? 'Collapse Grid' : 'Expand Grid'}
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

export function ArtifactBoard({ artifact, isActive, inactiveIndex, onClick, strategy }: ArtifactBoardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const [activePlotIndex, setActivePlotIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // If inactive, force collapse
  const expanded = isActive && isExpanded;

  // Fixed size for expanded view (2x2 grid)
  let targetWidth = 7;
  let targetHeight = 5;

  if (isActive) {
    targetWidth = expanded ? 11 : 7;
    targetHeight = expanded ? 9 : 5;
  } else {
    if (strategy === 'background-tabs') {
      targetWidth = 6;
      targetHeight = 1.5;
    } else {
      targetWidth = 7;
      targetHeight = 5;
    }
  }

  const activeY = expanded ? 4.5 : 3;

  let targetPosition = new THREE.Vector3();
  let targetRotation = new THREE.Euler();
  let baseScale = 1;
  let targetOpacity = 1;

  if (isActive) {
    targetPosition.set(expanded ? 0 : 2, activeY, expanded ? 2 : 0);
    targetRotation.set(0, 0, 0);
    baseScale = 1;
    targetOpacity = 1;
  } else {
    if (strategy === 'spatial-sidebar') {
      targetPosition.set(7.5, 5 - inactiveIndex * 1.8, -2 - inactiveIndex * 0.2);
      targetRotation.set(0, -Math.PI / 6, 0);
      baseScale = 0.3;
      targetOpacity = hovered ? 0.9 : 0.5;
    } else if (strategy === 'background-tabs') {
      targetPosition.set(-0.3 + inactiveIndex * 2.5, 5.8, -0.5 - inactiveIndex * 0.01);
      targetRotation.set(0, 0, 0);
      baseScale = 0.4;
      targetOpacity = hovered ? 1 : 0.6;
    } else if (strategy === 'spatial-grouping') {
      // Create a semi-circle behind the main workspace
      const angle = (inactiveIndex - 2) * 0.3; // Center around index 2
      const radius = 10;
      targetPosition.set(
        Math.sin(angle) * radius,
        3 + Math.abs(inactiveIndex - 2) * 0.5, // layered vertically
        -Math.cos(angle) * radius + 2
      );
      targetRotation.set(0, angle, 0);
      baseScale = 0.4;
      targetOpacity = hovered ? 1 : 0.6;
    }
  }

  const targetScale = hovered && !isActive ? baseScale * 1.1 : baseScale;

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smoothly interpolate position
      groupRef.current.position.lerp(targetPosition, 6 * delta);
      
      // Smoothly interpolate scale
      const currentScale = groupRef.current.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 6 * delta);
      groupRef.current.scale.set(newScale, newScale, newScale);

      // Smoothly interpolate rotation
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.x, 6 * delta);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.y, 6 * delta);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotation.z, 6 * delta);
    }
    if (materialRef.current) {
      // Smoothly interpolate opacity
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 6 * delta);
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={[2, 3, -10]} 
      onClick={(e) => { 
        if (!isActive) { 
          e.stopPropagation(); 
          onClick(); 
          setHovered(false);
          document.body.style.cursor = 'auto';
        } 
      }}
      onPointerOver={(e) => { 
        if (!isActive) { 
          e.stopPropagation(); 
          setHovered(true); 
          document.body.style.cursor = 'pointer'; 
        } 
      }}
      onPointerOut={(e) => { 
        if (!isActive) { 
          setHovered(false); 
          document.body.style.cursor = 'auto'; 
        } 
      }}
    >
      {/* Backplate */}
      <RoundedBox args={[targetWidth, targetHeight, 0.1]} radius={0.1} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={materialRef}
          color="#0f172a"
          transparent
          opacity={0}
          roughness={0.2}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>

      {/* Content Container */}
      <group position={[0, 0, 0.06]}>
        {artifact.status === 'pending' ? (
          <group position={[0, 0, 0]}>
            <Text
              position={[0, 0.5, 0]}
              fontSize={0.4}
              color="#3b82f6"
              anchorX="center"
              anchorY="middle"
            >
              {artifact.title}
            </Text>
            {/* Progress Bar Background */}
            <mesh position={[0, -0.5, 0]}>
              <planeGeometry args={[4, 0.2]} />
              <meshBasicMaterial color="#1e293b" />
            </mesh>
            {/* Progress Bar Fill */}
            <mesh position={[-2 + (4 * (artifact.progress || 0)) / 2, -0.5, 0.01]}>
              <planeGeometry args={[4 * (artifact.progress || 0), 0.2]} />
              <meshBasicMaterial color="#3b82f6" />
            </mesh>
            <Text
              position={[0, -1, 0]}
              fontSize={0.2}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              {`${Math.round((artifact.progress || 0) * 100)}% Complete`}
            </Text>
          </group>
        ) : (!isActive && strategy === 'background-tabs') ? (
          <Text
            position={[0, 0, 0]}
            fontSize={0.6}
            color={hovered ? "#ffffff" : "#cbd5e1"}
            anchorX="center"
            anchorY="middle"
          >
            {artifact.plots[0]?.type === 'bar' ? '📊' : '📈'} {artifact.title}
          </Text>
        ) : (
          <>
            {/* Title */}
            <Text
              position={[-targetWidth / 2 + 0.3, targetHeight / 2 - 0.4, 0]}
              fontSize={0.3}
              color="#f8fafc"
              anchorX="left"
              anchorY="top"
            >
              {artifact.title}
            </Text>

            {/* Summary Text (Left Side) */}
            <Text
              position={[-targetWidth / 2 + 0.3, targetHeight / 2 - 1.1, 0]}
              fontSize={0.15}
              color="#cbd5e1"
              anchorX="left"
              anchorY="top"
              maxWidth={2.5}
              lineHeight={1.5}
            >
              {artifact.summary}
            </Text>

            {/* 3D Plot Viewer (Right Side) */}
            {artifact.plots.length > 0 && (
              <PlotViewer 
                plots={artifact.plots} 
                activeIndex={activePlotIndex} 
                onSelect={setActivePlotIndex}
                isActive={isActive}
                isExpanded={expanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
                boardHeight={targetHeight}
              />
            )}
          </>
        )}
      </group>
    </group>
  );
}
