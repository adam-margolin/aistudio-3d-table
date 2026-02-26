import { useRef, useMemo, useState, useEffect } from 'react';
import { RoundedBox, Text, Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { InteractionStrategy } from '../App';
import { Theme } from '../themes';

interface SpreadsheetProps {
  position?: [number, number, number];
  interactionStrategy?: InteractionStrategy;
  onRunAlgorithm?: (type: string) => void;
  isProcessing?: boolean;
  theme: Theme;
  tableX: number;
  tableY: number;
  tableWidth: number;
  tableHeight: number;
}

export function Spreadsheet({ position = [-6, 0, 0], interactionStrategy = 'ui-overlay', onRunAlgorithm, isProcessing, theme, tableX, tableY, tableWidth, tableHeight }: SpreadsheetProps) {
  const containerRef = useRef<THREE.Group>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  // Dragging state
  const [dragOffset, setDragOffset] = useState<[number, number, number]>([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const dragStartPoint = useRef(new THREE.Vector3());
  const initialDragOffset = useRef<[number, number, number]>([0, 0, 0]);

  const { viewport } = useThree();

  // Dimensions constrained by application layout engine
  const containerWidth = tableWidth;
  const containerHeight = tableHeight;
  const containerDepth = 0.1;
  const topMargin = 0.5; // Re-introduced explicit bound for the window header and buttons

  // Layout Engine Assignments
  const targetX = tableX;
  const targetY = tableY;

  // Mode state
  const [mode, setMode] = useState<'resize' | 'clip'>('resize');
  const [clipWidth, setClipWidth] = useState<number | null>(null);
  const [clipHeight, setClipHeight] = useState<number | null>(null);

  const currentWidth = mode === 'clip' && clipWidth !== null ? clipWidth : containerWidth;
  const currentHeight = mode === 'clip' && clipHeight !== null ? clipHeight : containerHeight;

  // Grid dimensions
  const [cols, setCols] = useState(41); // generate enough to bleed off edge and get visually clipped
  const [rows, setRows] = useState(121);
  const cellWidth = 0.25;
  const cellHeight = 0.08;
  const cellDepth = 0.02;
  const gap = 0.01;

  // Calculate container dimensions dynamically if in resize mode
  const totalWidth = cols * cellWidth + (cols - 1) * gap;
  const totalHeight = rows * cellHeight + (rows - 1) * gap;

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringResize, setIsHoveringResize] = useState(false);
  const resizeStartPoint = useRef(new THREE.Vector3());
  const initialResizeCols = useRef(cols);
  const initialResizeRows = useRef(rows);
  const initialResizeDragOffset = useRef<[number, number, number]>([0, 0, 0]);
  const initialClipWidth = useRef<number>(0);
  const initialClipHeight = useRef<number>(0);

  // Effects and Interaction Handlers
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
    } else if (isHoveringHandle) {
      document.body.style.cursor = 'grab';
    } else if (isResizing || isHoveringResize) {
      document.body.style.cursor = 'nwse-resize';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [isDragging, isHoveringHandle, isResizing, isHoveringResize]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);

    const worldPos = new THREE.Vector3();
    if (containerRef.current) {
      containerRef.current.getWorldPosition(worldPos);
    }
    dragPlane.current.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 0, 1),
      worldPos
    );

    e.ray.intersectPlane(dragPlane.current, dragStartPoint.current);
    initialDragOffset.current = [...dragOffset];
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();

    const intersectPoint = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersectPoint);

    const dx = intersectPoint.x - dragStartPoint.current.x;
    const dy = intersectPoint.y - dragStartPoint.current.y;

    setDragOffset([
      initialDragOffset.current[0] + dx,
      initialDragOffset.current[1] + dy,
      initialDragOffset.current[2]
    ]);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const handleResizePointerDown = (e: any) => {
    e.stopPropagation();
    setIsResizing(true);
    e.target.setPointerCapture(e.pointerId);

    const worldPos = new THREE.Vector3();
    if (containerRef.current) {
      containerRef.current.getWorldPosition(worldPos);
    }
    dragPlane.current.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 0, 1),
      worldPos
    );

    e.ray.intersectPlane(dragPlane.current, resizeStartPoint.current);
    initialResizeCols.current = cols;
    initialResizeRows.current = rows;
    initialResizeDragOffset.current = [...dragOffset];
    initialClipWidth.current = currentWidth;
    initialClipHeight.current = currentHeight;
  };

  const handleResizePointerMove = (e: any) => {
    if (!isResizing) return;
    e.stopPropagation();

    const intersectPoint = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersectPoint);

    const dx = intersectPoint.x - resizeStartPoint.current.x;
    const dy = intersectPoint.y - resizeStartPoint.current.y;

    if (mode === 'resize') {
      const dCols = Math.round(dx / (cellWidth + gap));
      const dRows = Math.round(-dy / (cellHeight + gap));

      const newCols = Math.max(2, initialResizeCols.current + dCols);
      const newRows = Math.max(2, initialResizeRows.current + dRows);

      if (newCols !== cols || newRows !== rows) {
        setCols(newCols);
        setRows(newRows);

        const deltaW = (newCols - initialResizeCols.current) * (cellWidth + gap);
        const deltaH = (newRows - initialResizeRows.current) * (cellHeight + gap);

        setDragOffset([
          initialResizeDragOffset.current[0] + deltaW / 2,
          initialResizeDragOffset.current[1] - deltaH / 2,
          initialResizeDragOffset.current[2]
        ]);
      }
    } else {
      const newClipWidth = Math.max(cellWidth + gap, initialClipWidth.current + dx);
      const newClipHeight = Math.max(cellHeight + gap, initialClipHeight.current - dy);

      if (newClipWidth !== clipWidth || newClipHeight !== clipHeight) {
        setClipWidth(newClipWidth);
        setClipHeight(newClipHeight);

        const deltaW = newClipWidth - initialClipWidth.current;
        const deltaH = newClipHeight - initialClipHeight.current;

        setDragOffset([
          initialResizeDragOffset.current[0] + deltaW / 2,
          initialResizeDragOffset.current[1] - deltaH / 2,
          initialResizeDragOffset.current[2]
        ]);
      }
    }
  };

  const handleResizePointerUp = (e: any) => {
    e.stopPropagation();
    setIsResizing(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  // Generate data once so it doesn't change on resize
  const cellData = useMemo(() => {
    const data: Record<string, string> = {};
    for (let r = 1; r < 200; r++) {
      for (let c = 1; c < 100; c++) {
        data[`${r}-${c}`] = (Math.random() * 10000).toFixed(2);
      }
    }
    return data;
  }, []);

  // Generate cells
  const cells = useMemo(() => {
    const items = [];
    const startX = -currentWidth / 2 + cellWidth / 2;
    const startY = currentHeight / 2 - cellHeight / 2 - topMargin / 2;

    const rightBound = currentWidth / 2;
    const bottomBound = -currentHeight / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * (cellWidth + gap);
        const y = startY - r * (cellHeight + gap);

        // Clip cells outside the container bounds
        const cellRight = x + cellWidth / 2;
        const cellBottom = y - cellHeight / 2;
        if (cellRight > rightBound + 0.001 || cellBottom < bottomBound - 0.001) {
          continue;
        }

        const isHeaderRow = r === 0;
        const isHeaderCol = c === 0;
        const isHeader = isHeaderRow || isHeaderCol;

        // Determine color based on row and whether it's a header
        let color = theme.dataCellEven;
        if (isHeader) {
          color = theme.headerCell;
        } else if (r % 2 === 0) {
          color = theme.dataCellEven;
        } else {
          color = theme.dataCellOdd;
        }

        // Determine text and alignment
        let text = '';
        let align: 'left' | 'center' | 'right' = 'right';

        if (isHeaderRow && isHeaderCol) {
          text = '';
        } else if (isHeaderRow) {
          text = String.fromCharCode(64 + c); // A, B, C... (Note: will go beyond Z for c > 26, but fine for 20)
          align = 'center';
        } else if (isHeaderCol) {
          text = `${r}`;
          align = 'center';
        } else {
          // Numeric data
          text = cellData[`${r}-${c}`] || '0.00';
        }

        const z = containerDepth / 2 + cellDepth / 2;

        let textX = 0;
        if ((align as string) === 'left') textX = -cellWidth / 2 + 0.02;
        if (align === 'right') textX = cellWidth / 2 - 0.02;

        items.push({
          id: `${r}-${c}`,
          position: [x, y, z] as [number, number, number],
          color,
          text,
          isHeader,
          align,
          textX,
        });
      }
    }
    return items;
  }, [cols, rows, cellWidth, cellHeight, cellDepth, gap, currentWidth, currentHeight, containerDepth, cellData, topMargin, theme]);

  // Handle global click to close context menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) setContextMenu(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const handleContextMenu = (e: any) => {
    if (interactionStrategy !== 'contextual-menu' || isProcessing) return;

    e.stopPropagation();
    // Stop the browser's default context menu
    if (e.nativeEvent && e.nativeEvent.preventDefault) {
      e.nativeEvent.preventDefault();
    }

    // Position the menu relative to the click point on the spreadsheet
    setContextMenu({
      x: e.point.x,
      y: e.point.y
    });
  };

  const handleRun = (type: string) => {
    setContextMenu(null);
    if (onRunAlgorithm) {
      onRunAlgorithm(type);
    }
  };

  return (
    <group
      position={[targetX + dragOffset[0], targetY + dragOffset[1], 0]}
      ref={containerRef}
      onContextMenu={handleContextMenu}
    >

      {/* Top Header Row (Drag indicator + Controls) */}
      <group position={[0, containerHeight / 2 - topMargin / 2, containerDepth / 2 + 0.05]}>
        {/* Toggle Mode Container */}
        <group position={[-currentWidth / 2 + 1, 0, 0]}>
          <RoundedBox
            args={[2, 0.3, 0.05]}
            radius={0.1}
            castShadow
          >
            <meshStandardMaterial color={theme.uiBackground} roughness={0.5} transparent opacity={0.8} />
          </RoundedBox>

          {/* Resize Button Area */}
          <group position={[-0.4, 0, 0.01]}>
            <RoundedBox
              args={[0.8, 0.2, 0.02]}
              radius={0.05}
              onClick={(e) => {
                e.stopPropagation();
                setMode('resize');
                setClipWidth(null);
                setClipHeight(null);
              }}
              onPointerOver={() => document.body.style.cursor = 'pointer'}
              onPointerOut={() => document.body.style.cursor = 'auto'}
            >
              <meshStandardMaterial color={mode === 'resize' ? theme.accent : "transparent"} opacity={mode === 'resize' ? 1 : 0} transparent />
            </RoundedBox>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.12}
              color={mode === 'resize' ? "#ffffff" : theme.uiText}
              anchorX="center"
              anchorY="middle"
            >
              RESIZE
            </Text>
          </group>

          {/* Clip Button Area */}
          <group position={[0.4, 0, 0.01]}>
            <RoundedBox
              args={[0.8, 0.2, 0.02]}
              radius={0.05}
              onClick={(e) => {
                e.stopPropagation();
                setMode('clip');
                setClipWidth(currentWidth);
                setClipHeight(currentHeight);
              }}
              onPointerOver={() => document.body.style.cursor = 'pointer'}
              onPointerOut={() => document.body.style.cursor = 'auto'}
            >
              <meshStandardMaterial color={mode === 'clip' ? theme.accent : "transparent"} opacity={mode === 'clip' ? 1 : 0} transparent />
            </RoundedBox>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.12}
              color={mode === 'clip' ? "#ffffff" : theme.uiText}
              anchorX="center"
              anchorY="middle"
            >
              CLIP
            </Text>
          </group>
        </group>

        {/* Drag Indicator */}
        <group position={[currentWidth / 2 - 1, 0, 0]}>
          <RoundedBox
            args={[1.5, 0.2, 0.02]}
            radius={0.05}
          >
            <meshStandardMaterial color={isDragging ? theme.accent : theme.uiBorder} transparent opacity={isDragging ? 0.8 : 0.5} />
          </RoundedBox>
        </group>
      </group>

      {/* Drag Handle Hit Area */}
      <mesh
        position={[0, containerHeight / 2 - topMargin / 2, containerDepth / 2 + 0.01]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={() => setIsHoveringHandle(true)}
        onPointerOut={() => setIsHoveringHandle(false)}
      >
        <planeGeometry args={[currentWidth, topMargin]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Main Container */}
      <RoundedBox
        args={[currentWidth, containerHeight, containerDepth]}
        radius={0.02}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={theme.container}
          metalness={0.1}
          roughness={0.4}
          transmission={0.9}
          thickness={0.5}
          ior={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transparent={true}
          opacity={1}
        />
      </RoundedBox>

      {/* Resize Handle */}
      <mesh
        position={[currentWidth / 2 - 0.02, -containerHeight / 2 + 0.02, containerDepth / 2 + 0.01]}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerOver={() => setIsHoveringResize(true)}
        onPointerOut={() => setIsHoveringResize(false)}
      >
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshStandardMaterial color={isResizing ? theme.accent : theme.uiBorder} />
      </mesh>

      {/* Cells */}
      {cells.map((cell) => (
        <group key={cell.id} position={cell.position}>
          <RoundedBox
            args={[cellWidth, cellHeight, cellDepth]}
            radius={0.01}
            smoothness={2}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={cell.color}
              metalness={0.2}
              roughness={0.8}
            />
          </RoundedBox>

          {/* Cell Text */}
          {cell.text && (
            <Text
              position={[cell.textX, 0, cellDepth / 2 + 0.005]}
              fontSize={0.035}
              color={cell.isHeader ? theme.textHeader : theme.textData}
              anchorX={cell.align}
              anchorY="middle"
            >
              {cell.text}
            </Text>
          )}
        </group>
      ))}

      {/* Processing Indicator */}
      {isProcessing && (
        <Html position={[0, 0, containerDepth / 2 + 0.1]} transform center zIndexRange={[100, 0]}>
          <div
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border shadow-2xl backdrop-blur-md"
            style={{ backgroundColor: theme.uiBackground, borderColor: theme.uiBorder, boxShadow: `0 25px 50px -12px ${theme.accent}33` }}
          >
            <div
              className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: theme.accent, borderTopColor: 'transparent' }}
            ></div>
            <p className="font-medium text-sm" style={{ color: theme.uiText }}>Processing Data...</p>
          </div>
        </Html>
      )}

      {/* Contextual Menu */}
      {contextMenu && !isProcessing && (
        <Html
          position={[
            contextMenu.x - targetX - dragOffset[0],
            contextMenu.y - targetY - dragOffset[1],
            containerDepth / 2 + 0.1
          ]}
          zIndexRange={[100, 0]}
        >
          <div
            className="backdrop-blur-md border rounded-lg shadow-2xl p-2 w-56 flex flex-col gap-1 pointer-events-auto"
            style={{ backgroundColor: theme.uiBackground, borderColor: theme.uiBorder }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <div className="px-3 py-1.5 border-b mb-1" style={{ borderColor: theme.uiBorder }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textHeader }}>Run Algorithm</span>
            </div>
            <button
              onClick={() => handleRun('Descriptive Stats')}
              className="text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2"
              style={{ color: theme.uiText }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.accent; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.uiText; }}
            >
              <span>📊</span> Descriptive Statistics
            </button>
            <button
              onClick={() => handleRun('Linear Regression')}
              className="text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2"
              style={{ color: theme.uiText }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.accent; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.uiText; }}
            >
              <span>📈</span> Linear Regression
            </button>
            <button
              onClick={() => handleRun('Clustering')}
              className="text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2"
              style={{ color: theme.uiText }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.accent; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.uiText; }}
            >
              <span>🎯</span> Clustering
            </button>
            <button
              onClick={() => handleRun('Time Series')}
              className="text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2"
              style={{ color: theme.uiText }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.accent; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.uiText; }}
            >
              <span>📉</span> Time Series
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}
