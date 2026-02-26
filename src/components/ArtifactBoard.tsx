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
  boundaryWidth: number;
  boundaryHeight: number;
  boundaryX: number;
  boundaryY: number;
}

// A simple 3D Bar Chart
function BarChart({ data, position, width = 2.5, height = 2, opacity = 1, theme }: { data: number[], position: [number, number, number], width?: number, height?: number, opacity?: number, theme: Theme }) {
  const maxVal = Math.max(...data, 1);
  const barWidth = width / Math.max(data.length * 1.5, 1);
  const gap = barWidth * 0.5;
  const totalWidth = data.length * barWidth + (data.length - 1) * gap;
  const startX = -totalWidth / 2 + barWidth / 2;

  return (
    <group position={position}>
      {data.map((val, i) => {
        const barHeight = (val / maxVal) * height;
        return (
          <group key={i} position={[startX + i * (barWidth + gap), barHeight / 2 - height / 2, 0]}>
            <RoundedBox args={[barWidth, barHeight, barWidth]} radius={barWidth * 0.1} castShadow receiveShadow>
              <meshStandardMaterial color={theme.accent} roughness={0.4} metalness={0.8} transparent opacity={opacity} />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}

// A simple 3D Scatter Plot
function ScatterPlot({ data, position, width = 2.5, height = 2, opacity = 1, theme }: { data: number[], position: [number, number, number], width?: number, height?: number, opacity?: number, theme: Theme }) {
  const maxVal = Math.max(...data, 1);
  const startX = -width / 2;

  return (
    <group position={position}>
      {/* Axes */}
      <mesh position={[0, -height / 2, 0]}>
        <boxGeometry args={[width + 0.2, 0.02, 0.02]} />
        <meshStandardMaterial color={theme.textHeader} transparent opacity={opacity} />
      </mesh>
      <mesh position={[startX, 0, 0]}>
        <boxGeometry args={[0.02, height + 0.2, 0.02]} />
        <meshStandardMaterial color={theme.textHeader} transparent opacity={opacity} />
      </mesh>

      {/* Points */}
      {data.map((val, i) => {
        const x = startX + (i / Math.max(data.length - 1, 1)) * width;
        const y = (val / maxVal) * height - height / 2;
        return (
          <mesh key={i} position={[x, y, 0]} castShadow>
            <sphereGeometry args={[Math.min(0.08, width * 0.03), 16, 16]} />
            <meshStandardMaterial color={theme.accent} roughness={0.2} metalness={0.5} transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
}

function PlotViewer({ plots, activeIndex, onSelect, isActive, isExpanded, onToggleExpand, boundaryWidth, boundaryHeight, theme }: { plots: PlotData[], activeIndex: number, onSelect: (idx: number) => void, isActive: boolean, isExpanded: boolean, onToggleExpand: () => void, boundaryWidth: number, boundaryHeight: number, theme: Theme }) {
  const activePlot = plots[activeIndex];
  const [page, setPage] = useState(0);

  if (!activePlot) return null;

  // Calculate panel dimensions based on graphics boundary
  const panelWidth = boundaryWidth - 0.2; // slight padding
  const panelHeight = Math.min(boundaryHeight * 0.1, 0.9);
  const panelY = -boundaryHeight / 2 + panelHeight / 2 + 0.1; // 0.1 padding from bottom

  const summaryWidth = boundaryWidth * 0.28;
  const chartAreaWidth = boundaryWidth - summaryWidth - 0.4;
  const chartAreaHeight = boundaryHeight * 0.65;
  const chartCenterX = -boundaryWidth / 2 + summaryWidth + 0.3 + chartAreaWidth / 2;
  const chartCenterY = 0.5;

  const cols = 2;
  const rows = 2;
  const plotsPerPageExpanded = cols * rows;
  const plotsPerPageCollapsed = Math.max(1, Math.floor(panelWidth / 0.9));

  const isPaginating = isExpanded ? plots.length > plotsPerPageExpanded : plots.length > plotsPerPageCollapsed;
  const plotsPerPage = isExpanded ? plotsPerPageExpanded : plotsPerPageCollapsed;
  const totalPages = Math.ceil(plots.length / plotsPerPage);

  // Reset page when toggling expand to avoid out of bounds
  const handleToggleExpand = () => {
    setPage(0);
    onToggleExpand();
  };

  const currentPlots = isExpanded
    ? plots.slice(page * plotsPerPage, (page + 1) * plotsPerPage)
    : [activePlot];

  const viewerPosition = [chartCenterX, chartCenterY, 0.02];

  const cellWidth = chartAreaWidth / 2 - 0.4;
  const cellHeight = chartAreaHeight / 2 - 0.4;

  return (
    <group position={viewerPosition as [number, number, number]}>
      {/* Active Plot Display or Grid Display */}
      {isExpanded ? (
        <group position={[0, 0, 0]}>
          {currentPlots.map((plot, i) => {
            // Calculate grid position for 2x2
            const col = i % cols;
            const row = Math.floor(i / cols);
            const xOffset = col * (cellWidth + 0.4) - (cellWidth + 0.4) / 2;
            const yOffset = (cellHeight + 0.4) / 2 - row * (cellHeight + 0.4);

            // Add a slight curve to the gallery to make it feel more immersive
            const rotationY = -xOffset * 0.02;
            const zOffset = Math.abs(xOffset) * 0.1;

            return (
              <group key={plot.id} position={[xOffset, yOffset, zOffset]} rotation={[0, rotationY, 0]}>
                <RoundedBox args={[cellWidth, cellHeight, 0.05]} radius={0.1} position={[0, 0, -0.02]}>
                  <meshPhysicalMaterial color={theme.uiBackground} transparent opacity={0.6} roughness={0.2} metalness={0.8} />
                </RoundedBox>

                <Text
                  position={[0, cellHeight / 2 - 0.3, 0.02]}
                  fontSize={0.2}
                  color={theme.textData}
                  anchorX="center"
                  anchorY="bottom"
                >
                  {plot.title}
                </Text>

                <group position={[0, -0.1, 0.02]}>
                  {plot.type === 'bar' ? (
                    <BarChart data={plot.data} position={[0, 0, 0]} width={cellWidth * 0.8} height={cellHeight * 0.5} theme={theme} />
                  ) : (
                    <ScatterPlot data={plot.data} position={[0, 0, 0]} width={cellWidth * 0.8} height={cellHeight * 0.5} theme={theme} />
                  )}
                </group>
              </group>
            );
          })}
        </group>
      ) : (
        <group>
          <RoundedBox args={[chartAreaWidth, chartAreaHeight, 0.05]} radius={0.1} position={[0, 0, -0.02]}>
            <meshPhysicalMaterial color={theme.uiBackground} transparent opacity={0.6} roughness={0.2} metalness={0.8} />
          </RoundedBox>

          <Text
            position={[0, chartAreaHeight / 2 - 0.4, 0.02]}
            fontSize={0.25}
            color={theme.textData}
            anchorX="center"
            anchorY="bottom"
          >
            {activePlot.title}
          </Text>

          <group position={[0, -0.2, 0.02]}>
            {activePlot.type === 'bar' ? (
              <BarChart data={activePlot.data} position={[0, 0, 0]} width={chartAreaWidth * 0.8} height={chartAreaHeight * 0.6} theme={theme} />
            ) : (
              <ScatterPlot data={activePlot.data} position={[0, 0, 0]} width={chartAreaWidth * 0.8} height={chartAreaHeight * 0.6} theme={theme} />
            )}
          </group>
        </group>
      )}

      {/* Tabs / Buttons UI - Only show when the board is active */}
      {isActive && (
        <group position={[-viewerPosition[0], panelY - viewerPosition[1], 0.1]}>
          {/* Background */}
          <RoundedBox
            args={[panelWidth, isExpanded ? panelHeight : panelHeight * 2, 0.05]}
            radius={0.1}
            position={[0, isExpanded ? 0 : panelHeight / 2, 0]}
          >
            <meshPhysicalMaterial color={theme.uiBackground} transparent opacity={0.9} roughness={0.2} metalness={0.8} />
          </RoundedBox>

          {!isExpanded && (
            <group position={[0, panelHeight * 0.9, 0]}>
              {plots.slice(page * plotsPerPageCollapsed, (page + 1) * plotsPerPageCollapsed).map((plot, i) => {
                const globalIndex = page * plotsPerPageCollapsed + i;
                const isPlotActive = globalIndex === activeIndex;
                const startX = -panelWidth / 2 + 0.45; // Align left with padding
                const xOffset = startX + i * 0.9;

                const titleText = plot.title.replace(/ Analysis$/i, '');

                return (
                  <group key={plot.id} position={[xOffset, 0, 0.03]}>
                    <RoundedBox
                      args={[0.85, panelHeight * 0.45, 0.02]}
                      radius={0.05}
                      onClick={(e) => { e.stopPropagation(); onSelect(globalIndex); }}
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
                      {plot.type === 'bar' ? '📊' : '📈'}{' '}
                      {titleText.length > 12 ? titleText.substring(0, 12) + '...' : titleText}
                    </Text>
                  </group>
                );
              })}
            </group>
          )}

          {/* Footer Controls Row (Pagination + Expand/Collapse) */}
          <group position={[0, isExpanded ? 0 : panelHeight * 0.1, 0]}>
            {/* Pagination Controls */}
            {isPaginating && (
              <group position={[isExpanded ? 0 : -1, 0, 0.03]}>
                <RoundedBox args={[2.2, 0.4, 0.01]} radius={0.2} position={[0, 0, 0]}>
                  <meshPhysicalMaterial color={theme.uiBackground} transparent opacity={0.5} roughness={0.2} />
                </RoundedBox>

                {/* Prev Button */}
                <group position={[-0.8, 0, 0.01]}>
                  <RoundedBox
                    args={[0.3, 0.3, 0.02]}
                    radius={0.15}
                    onClick={(e) => { e.stopPropagation(); if (page > 0) setPage(page - 1); }}
                    onPointerOver={() => document.body.style.cursor = page > 0 ? 'pointer' : 'auto'}
                    onPointerOut={() => document.body.style.cursor = 'auto'}
                  >
                    <meshStandardMaterial color={page === 0 ? theme.container : theme.uiBorder} />
                  </RoundedBox>
                  <Text position={[0, 0, 0.02]} fontSize={0.15} color={page === 0 ? theme.textHeader : theme.textData} anchorX="center" anchorY="middle">
                    ←
                  </Text>
                </group>

                {/* Text */}
                <Text position={[0, 0, 0.02]} fontSize={0.12} color={theme.textData} anchorX="center" anchorY="middle">
                  {`Page ${page + 1} of ${totalPages}`}
                </Text>

                {/* Next Button */}
                <group position={[0.8, 0, 0.01]}>
                  <RoundedBox
                    args={[0.3, 0.3, 0.02]}
                    radius={0.15}
                    onClick={(e) => { e.stopPropagation(); if (page < totalPages - 1) setPage(page + 1); }}
                    onPointerOver={() => document.body.style.cursor = page < totalPages - 1 ? 'pointer' : 'auto'}
                    onPointerOut={() => document.body.style.cursor = 'auto'}
                  >
                    <meshStandardMaterial color={page === totalPages - 1 ? theme.container : theme.uiBorder} />
                  </RoundedBox>
                  <Text position={[0, 0, 0.02]} fontSize={0.15} color={page === totalPages - 1 ? theme.textHeader : theme.textData} anchorX="center" anchorY="middle">
                    →
                  </Text>
                </group>
              </group>
            )}

            {/* Expand/Collapse Button */}
            <group position={[panelWidth / 2 - 0.7, 0, 0.03]}>
              <RoundedBox
                args={[1.2, panelHeight * 0.6, 0.02]}
                radius={0.05}
                onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }}
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
        </group>
      )}
    </group>
  );
}

export function ArtifactBoard({ artifact, isActive, inactiveIndex, onClick, strategy, theme, boundaryWidth, boundaryHeight, boundaryX, boundaryY }: ArtifactBoardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const [activePlotIndex, setActivePlotIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // If inactive, force collapse
  const expanded = isActive && isExpanded;

  // Relative sizing based on boundary Box constraints natively
  const maxActiveWidth = boundaryWidth * 0.95;
  const maxActiveHeight = boundaryHeight * 0.95;

  let targetWidth = 7;
  let targetHeight = 5;

  if (isActive) {
    targetWidth = expanded ? maxActiveWidth : boundaryWidth * 0.8;
    targetHeight = expanded ? maxActiveHeight : boundaryHeight * 0.6;
  } else {
    if (strategy === 'background-tabs') {
      targetWidth = boundaryWidth * 0.8;
      targetHeight = boundaryHeight * 0.15;
    } else {
      targetWidth = boundaryWidth * 0.4;
      targetHeight = boundaryHeight * 0.3;
    }
  }

  // Active Center Stage position is perfectly centered in our allocated boundary box
  const activeY = boundaryY;
  const activeX = boundaryX;

  let targetPosition = new THREE.Vector3();
  let targetRotation = new THREE.Euler();
  let baseScale = 1;
  let targetOpacity = 1;

  if (isActive) {
    targetPosition.set(activeX, activeY, expanded ? 0.2 : 0);
    targetRotation.set(0, 0, 0);
    baseScale = 1;
    targetOpacity = 1;
  } else {
    if (strategy === 'spatial-sidebar') {
      const maxRows = 4;
      const col = Math.floor(inactiveIndex / maxRows);
      const row = inactiveIndex % maxRows;

      const baseX = boundaryX;
      const baseY = boundaryY + boundaryHeight / 2 - targetHeight / 2;
      const baseZ = -2.0;

      const xOffset = col * (targetWidth + 0.2);
      const yOffset = row * (targetHeight + 0.2);
      const zOffset = col * 0.5 + row * 0.1;

      targetPosition.set(baseX + xOffset, baseY - yOffset, baseZ - zOffset);
      targetRotation.set(0, -Math.PI / 6, 0);
      baseScale = 0.5;
      targetOpacity = hovered ? 0.9 : 0.5;
    } else if (strategy === 'background-tabs') {
      targetPosition.set(boundaryX, boundaryY + boundaryHeight / 2 - 0.5 - inactiveIndex * (targetHeight + 0.1), -0.5 - inactiveIndex * 0.01);
      targetRotation.set(0, 0, 0);
      baseScale = 0.7;
      targetOpacity = hovered ? 1 : 0.6;
    } else if (strategy === 'spatial-grouping') {
      const title = artifact.title.toLowerCase();
      let categoryIndex = 0;
      if (title.includes('descriptive')) categoryIndex = 0;
      else if (title.includes('linear')) categoryIndex = 1;
      else if (title.includes('cluster')) categoryIndex = 2;
      else if (title.includes('time')) categoryIndex = 3;
      else categoryIndex = inactiveIndex % 4;

      // Span 4 bins purely inside the boundary width limit
      const spanRange = boundaryWidth * 0.8;
      const startBinX = boundaryX - spanRange / 2;
      const stride = spanRange / 3;

      const xPositions = [startBinX, startBinX + stride, startBinX + stride * 2, startBinX + stride * 3];
      const zPositions = [-2, -4, -4, -2];
      const rotYPositions = [0.25, 0.08, -0.08, -0.25];

      const baseX = xPositions[categoryIndex];
      const baseY = boundaryY + boundaryHeight * 0.25;
      const baseZ = zPositions[categoryIndex];

      const stackX = inactiveIndex * 0.15;
      const stackY = inactiveIndex * 0.15;
      const stackZ = inactiveIndex * -0.3;

      targetPosition.set(baseX + stackX, baseY + stackY, baseZ + stackZ);
      targetRotation.set(0, rotYPositions[categoryIndex], 0);

      baseScale = 0.6;
      targetOpacity = hovered ? 1 : 0.6;
    } else if (strategy === 'immersive-gallery') {
      const isLeft = inactiveIndex % 2 === 0;
      const step = Math.floor(inactiveIndex / 2) + 1;
      const offset = isLeft ? -step : step;

      const xOffset = boundaryX + offset * (targetWidth + 0.5);
      const zOffset = -Math.abs(offset) * 1.5 - 1.0;
      const yOffset = boundaryY;

      targetPosition.set(xOffset, yOffset, zOffset);

      const rotY = Math.sign(offset) * 0.4;
      targetRotation.set(0, rotY, 0);

      baseScale = 0.6;
      targetOpacity = hovered ? 0.9 : 0.4;
    }
  }

  const targetScale = hovered && !isActive ? baseScale * 1.1 : baseScale;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.lerp(targetPosition, 6 * delta);
      const currentScale = groupRef.current.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 6 * delta);
      groupRef.current.scale.set(newScale, newScale, newScale);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.x, 6 * delta);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.y, 6 * delta);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotation.z, 6 * delta);
    }
    if (materialRef.current) {
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
          <group position={[0, 0, 0.03]}>
            <RoundedBox
              args={[targetWidth - 0.02, targetHeight - 0.02, 0.02]}
              radius={0.05}
              onPointerOver={() => document.body.style.cursor = 'pointer'}
              onPointerOut={() => document.body.style.cursor = 'auto'}
            >
              <meshStandardMaterial color={hovered ? theme.container : theme.uiBackground} opacity={0.8} transparent />
            </RoundedBox>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.25}
              color={hovered ? theme.textData : theme.textHeader}
              anchorX="center"
              anchorY="middle"
              maxWidth={targetWidth - 0.1}
            >
              {artifact.plots[0]?.type === 'bar' ? '📊' : '📈'} {artifact.title.replace(/ Analysis$/i, '')}
            </Text>
          </group>
        ) : (
          <>
            {/* Title / Header Mode */}
            <group position={[0, targetHeight / 2 - 0.35, 0.01]}>
              <RoundedBox args={[targetWidth - 0.2, 0.5, 0.02]} radius={0.05} position={[0, 0, 0]}>
                <meshPhysicalMaterial color={theme.uiBackground} transparent opacity={0.6} roughness={0.2} metalness={0.8} />
              </RoundedBox>
              <Text
                position={[-targetWidth / 2 + 0.3, 0, 0.02]}
                fontSize={0.22}
                color={theme.textData}
                anchorX="left"
                anchorY="middle"
              >
                {artifact.title}
              </Text>
            </group>

            {/* Summary Text (Left Side) - Responsive Size */}
            <group position={[-targetWidth / 2 + 0.1 + (targetWidth * 0.28) / 2, 0.5, 0.01]}>
              <RoundedBox args={[targetWidth * 0.28, targetHeight * 0.65, 0.04]} radius={0.1} position={[0, 0, 0]}>
                <meshPhysicalMaterial color={theme.uiBackground} transparent opacity={0.5} roughness={0.2} />
              </RoundedBox>
              <Text
                position={[-(targetWidth * 0.28) / 2 + 0.2, (targetHeight * 0.65) / 2 - 0.3, 0.03]}
                fontSize={0.14}
                color={theme.textHeader}
                anchorX="left"
                anchorY="top"
                maxWidth={targetWidth * 0.28 - 0.4}
                lineHeight={1.5}
              >
                {artifact.summary}
              </Text>
            </group>

            {/* 3D Plot Viewer (Right Side) */}
            {artifact.plots.length > 0 && (
              <PlotViewer
                plots={artifact.plots}
                activeIndex={activePlotIndex}
                onSelect={setActivePlotIndex}
                isActive={isActive}
                isExpanded={expanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
                boundaryWidth={targetWidth}
                boundaryHeight={targetHeight}
                theme={theme}
              />
            )}
          </>
        )}
      </group>
    </group>
  );
}
