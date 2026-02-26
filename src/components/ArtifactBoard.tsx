import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BarChart3, ScatterChart, Maximize2, Minimize2 } from 'lucide-react';
import { Artifact, PlotData } from '../types';
import { VisualizationStrategy } from '../App';
import { Theme } from '../themes';

interface ArtifactBoardProps {
  artifact: Artifact;
  isActive: boolean;
  inactiveIndex: number;
  onClick: () => void;
  strategy: VisualizationStrategy;
  theme: Theme;
}

// A simple 3D Bar Chart
function BarChart({ data, position, opacity = 1, theme }: { data: number[], position: [number, number, number], opacity?: number, theme: Theme }) {
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
              <meshStandardMaterial color={theme.accent} roughness={0.4} metalness={0.8} transparent opacity={opacity} />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}

// A simple 3D Scatter Plot
function ScatterPlot({ data, position, opacity = 1, theme }: { data: number[], position: [number, number, number], opacity?: number, theme: Theme }) {
  const maxVal = Math.max(...data, 1);
  const width = 2.5;
  const height = 2;
  const startX = -width / 2;

  return (
    <group position={position}>
      {/* Axes */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width + 0.2, 0.02, 0.02]} />
        <meshStandardMaterial color={theme.textHeader} transparent opacity={opacity} />
      </mesh>
      <mesh position={[startX, height / 2, 0]}>
        <boxGeometry args={[0.02, height + 0.2, 0.02]} />
        <meshStandardMaterial color={theme.textHeader} transparent opacity={opacity} />
      </mesh>

      {/* Points */}
      {data.map((val, i) => {
        const x = startX + (i / (data.length - 1)) * width;
        const y = (val / maxVal) * height;
        return (
          <mesh key={i} position={[x, y, 0]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color={theme.accent} roughness={0.2} metalness={0.5} transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
}

function PlotViewer({ plots, activeIndex, onSelect, isActive, isExpanded, onToggleExpand, boardWidth, boardHeight, theme }: { plots: PlotData[], activeIndex: number, onSelect: (idx: number) => void, isActive: boolean, isExpanded: boolean, onToggleExpand: () => void, boardWidth: number, boardHeight: number, theme: Theme }) {
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

  // Calculate panel dimensions
  const panelWidth = boardWidth - 0.2; // slight padding
  const panelHeight = boardHeight * 0.1;
  const panelY = -boardHeight / 2 + panelHeight / 2 + 0.1; // 0.1 padding from bottom

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
                  color={theme.textData}
                  anchorX="center"
                  anchorY="bottom"
                >
                  {plot.title}
                </Text>
                
                {plot.type === 'bar' ? (
                  <BarChart data={plot.data} position={[0, 0, 0]} theme={theme} />
                ) : (
                  <ScatterPlot data={plot.data} position={[0, 0, 0]} theme={theme} />
                )}
              </group>
            );
          })}

          {/* Pagination Controls in 3D Space */}
          {totalPages > 1 && (
            <group position={[-1.5, -3.5, 0.1]}>
              <RoundedBox args={[3, 0.6, 0.05]} radius={0.3} position={[0, 0, 0]}>
                <meshPhysicalMaterial color={theme.uiBackground} transparent opacity={0.9} roughness={0.2} metalness={0.8} />
              </RoundedBox>
              
              {/* Prev Button */}
              <group position={[-1, 0, 0.03]}>
                <RoundedBox 
                  args={[0.5, 0.5, 0.02]} 
                  radius={0.25}
                  onClick={(e) => { e.stopPropagation(); if (page > 0) setPage(page - 1); }}
                  onPointerOver={() => document.body.style.cursor = page > 0 ? 'pointer' : 'auto'}
                  onPointerOut={() => document.body.style.cursor = 'auto'}
                >
                  <meshStandardMaterial color={page === 0 ? theme.container : theme.uiBorder} />
                </RoundedBox>
                <Text position={[0, 0, 0.02]} fontSize={0.2} color={page === 0 ? theme.textHeader : theme.textData} anchorX="center" anchorY="middle">
                  ←
                </Text>
              </group>

              {/* Text */}
              <Text position={[0, 0, 0.03]} fontSize={0.15} color={theme.textData} anchorX="center" anchorY="middle">
                {`Page ${page + 1} of ${totalPages}`}
              </Text>

              {/* Next Button */}
              <group position={[1, 0, 0.03]}>
                <RoundedBox 
                  args={[0.5, 0.5, 0.02]} 
                  radius={0.25}
                  onClick={(e) => { e.stopPropagation(); if (page < totalPages - 1) setPage(page + 1); }}
                  onPointerOver={() => document.body.style.cursor = page < totalPages - 1 ? 'pointer' : 'auto'}
                  onPointerOut={() => document.body.style.cursor = 'auto'}
                >
                  <meshStandardMaterial color={page === totalPages - 1 ? theme.container : theme.uiBorder} />
                </RoundedBox>
                <Text position={[0, 0, 0.02]} fontSize={0.2} color={page === totalPages - 1 ? theme.textHeader : theme.textData} anchorX="center" anchorY="middle">
                  →
                </Text>
              </group>
            </group>
          )}
        </group>
      ) : (
        <group>
          <Text
            position={[0, 2.2, 0]}
            fontSize={0.2}
            color={theme.textData}
            anchorX="center"
            anchorY="bottom"
          >
            {activePlot.title}
          </Text>
          
          {activePlot.type === 'bar' ? (
            <BarChart data={activePlot.data} position={[0, 0, 0]} theme={theme} />
          ) : (
            <ScatterPlot data={activePlot.data} position={[0, 0, 0]} theme={theme} />
          )}
        </group>
      )}

      {/* Tabs / Buttons UI - Only show when the board is active */}
      {isActive && (
        <group position={[-viewerPosition[0], panelY - viewerPosition[1], 0.1]}>
          {/* Background */}
          <RoundedBox 
            args={[panelWidth, panelHeight, 0.05]} 
            radius={0.1} 
            position={[0, 0, 0]}
          >
            <meshPhysicalMaterial color={theme.uiBackground} transparent opacity={0.9} roughness={0.2} metalness={0.8} />
          </RoundedBox>

          {!isExpanded && plots.map((plot, i) => {
            const isPlotActive = i === activeIndex;
            const startX = -panelWidth / 2 + 0.5 + 0.1; // Align left with padding
            const xOffset = startX + i * 1.05;
            
            return (
              <group key={plot.id} position={[xOffset, 0, 0.03]}>
                <RoundedBox 
                  args={[1.0, panelHeight * 0.6, 0.02]} 
                  radius={0.05} 
                  onClick={(e) => { e.stopPropagation(); onSelect(i); }}
                  onPointerOver={() => document.body.style.cursor = 'pointer'}
                  onPointerOut={() => document.body.style.cursor = 'auto'}
                >
                  <meshStandardMaterial color={isPlotActive ? theme.accent : theme.container} />
                </RoundedBox>
                <Text
                  position={[0, 0, 0.02]}
                  fontSize={0.09}
                  color={isPlotActive ? "#ffffff" : theme.textData}
                  anchorX="center"
                  anchorY="middle"
                >
                  {plot.type === 'bar' ? '📊 ' : '📈 '}
                  {plot.title.length > 10 ? plot.title.substring(0, 10) + '...' : plot.title}
                </Text>
              </group>
            );
          })}

          {/* Expand/Collapse Button */}
          <group position={[panelWidth / 2 - 0.7, 0, 0.03]}>
            <RoundedBox 
              args={[1.2, panelHeight * 0.6, 0.02]} 
              radius={0.05}
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              onPointerOver={() => document.body.style.cursor = 'pointer'}
              onPointerOut={() => document.body.style.cursor = 'auto'}
            >
              <meshStandardMaterial color={theme.uiBorder} />
            </RoundedBox>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.09}
              color={theme.textData}
              anchorX="center"
              anchorY="middle"
            >
              {isExpanded ? '↙ Collapse' : '↗ Expand'}
            </Text>
          </group>
        </group>
      )}
    </group>
  );
}

export function ArtifactBoard({ artifact, isActive, inactiveIndex, onClick, strategy, theme }: ArtifactBoardProps) {
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
      // Group panels by category into distinct organized stacks forming a concave arc
      const title = artifact.title.toLowerCase();
      let categoryIndex = 0;
      if (title.includes('descriptive')) categoryIndex = 0;
      else if (title.includes('linear')) categoryIndex = 1;
      else if (title.includes('cluster')) categoryIndex = 2;
      else if (title.includes('time')) categoryIndex = 3;
      else categoryIndex = inactiveIndex % 4; // Fallback

      // 4 distinct columns spread across the top background, forming a concave arc
      const xPositions = [-9, -3, 3, 9];
      const zPositions = [-2, -4, -4, -2];
      const rotYPositions = [0.25, 0.08, -0.08, -0.25]; // Face towards center

      const baseX = xPositions[categoryIndex];
      const baseY = 6.5; // High above the main chart
      const baseZ = zPositions[categoryIndex];

      // Stack going upwards, rightwards, and backwards to ensure visibility
      const stackX = inactiveIndex * 0.15;
      const stackY = inactiveIndex * 0.15;
      const stackZ = inactiveIndex * -0.3;

      targetPosition.set(
        baseX + stackX,
        baseY + stackY,
        baseZ + stackZ
      );
      
      // Face towards the center
      targetRotation.set(0, rotYPositions[categoryIndex], 0);
      
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
          color={theme.container}
          metalness={0.1}
          roughness={0.4}
          transmission={0.9}
          thickness={0.5}
          ior={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transparent={true}
          opacity={0} // Keep opacity at 0 here, it is animated in useFrame
        />
      </RoundedBox>

      {/* Content Container */}
      <group position={[0, 0, 0.06]}>
        {artifact.status === 'pending' ? (
          <group position={[0, 0, 0]}>
            <Text
              position={[0, 0.5, 0]}
              fontSize={0.4}
              color={theme.accent}
              anchorX="center"
              anchorY="middle"
            >
              {artifact.title}
            </Text>
            {/* Progress Bar Background */}
            <mesh position={[0, -0.5, 0]}>
              <planeGeometry args={[4, 0.2]} />
              <meshBasicMaterial color={theme.container} />
            </mesh>
            {/* Progress Bar Fill */}
            <mesh position={[-2 + (4 * (artifact.progress || 0)) / 2, -0.5, 0.01]}>
              <planeGeometry args={[4 * (artifact.progress || 0), 0.2]} />
              <meshBasicMaterial color={theme.accent} />
            </mesh>
            <Text
              position={[0, -1, 0]}
              fontSize={0.2}
              color={theme.textHeader}
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
            color={hovered ? theme.textData : theme.textHeader}
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
              color={theme.textData}
              anchorX="left"
              anchorY="top"
            >
              {artifact.title}
            </Text>

            {/* Summary Text (Left Side) */}
            <Text
              position={[-targetWidth / 2 + 0.3, targetHeight / 2 - 1.1, 0]}
              fontSize={0.15}
              color={theme.textHeader}
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
                boardWidth={targetWidth}
                boardHeight={targetHeight}
                theme={theme}
              />
            )}
          </>
        )}
      </group>
    </group>
  );
}
