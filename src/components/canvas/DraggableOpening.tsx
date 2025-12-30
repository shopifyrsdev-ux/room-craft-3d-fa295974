import { useState, useRef, useMemo, useCallback } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useRoomStore, Opening } from '@/store/roomStore';
import * as THREE from 'three';

interface DraggableOpeningProps {
  opening: Opening;
  roomWidth: number;
  roomLength: number;
  roomHeight: number;
}

const DraggableOpening = ({ opening, roomWidth, roomLength, roomHeight }: DraggableOpeningProps) => {
  const updateOpening = useRoomStore((state) => state.updateOpening);
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const lastUpdateRef = useRef<number>(0);
  const throttleMs = 16;

  // Memoize wall info calculation
  const wallInfo = useMemo(() => {
    switch (opening.wall) {
      case 'north':
        return {
          wallWidth: roomWidth,
          position: [(opening.position - 0.5) * roomWidth, opening.elevation + opening.height / 2, -roomLength / 2] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          dragAxis: 'x' as const,
        };
      case 'south':
        return {
          wallWidth: roomWidth,
          position: [(opening.position - 0.5) * roomWidth, opening.elevation + opening.height / 2, roomLength / 2] as [number, number, number],
          rotation: [0, Math.PI, 0] as [number, number, number],
          dragAxis: 'x' as const,
        };
      case 'west':
        return {
          wallWidth: roomLength,
          position: [-roomWidth / 2, opening.elevation + opening.height / 2, (opening.position - 0.5) * roomLength] as [number, number, number],
          rotation: [0, Math.PI / 2, 0] as [number, number, number],
          dragAxis: 'z' as const,
        };
      case 'east':
        return {
          wallWidth: roomLength,
          position: [roomWidth / 2, opening.elevation + opening.height / 2, (opening.position - 0.5) * roomLength] as [number, number, number],
          rotation: [0, -Math.PI / 2, 0] as [number, number, number],
          dragAxis: 'z' as const,
        };
    }
  }, [opening.wall, opening.position, opening.elevation, opening.height, roomWidth, roomLength]);

  const frameColor = opening.type === 'door' ? '#5c4033' : '#4a5568';
  const frameThickness = 0.04;

  // Memoize materials
  const materials = useMemo(() => ({
    frame: new THREE.MeshStandardMaterial({ color: frameColor }),
    glass: new THREE.MeshStandardMaterial({ color: "#87ceeb", transparent: true, opacity: 0.25, side: THREE.DoubleSide }),
    door: new THREE.MeshStandardMaterial({ color: "#8b6914", roughness: 0.7 }),
    indicator: new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.8 }),
  }), [frameColor]);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'auto';
  }, []);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    
    // Throttle updates
    const now = performance.now();
    if (now - lastUpdateRef.current < throttleMs) return;
    lastUpdateRef.current = now;
    
    e.stopPropagation();

    const point = e.point;
    if (!point) return;

    const halfWidth = roomWidth / 2;
    const halfLength = roomLength / 2;
    
    const distToNorth = Math.abs(point.z - (-halfLength));
    const distToSouth = Math.abs(point.z - halfLength);
    const distToWest = Math.abs(point.x - (-halfWidth));
    const distToEast = Math.abs(point.x - halfWidth);
    
    const minDist = Math.min(distToNorth, distToSouth, distToWest, distToEast);
    
    let newWall: 'north' | 'south' | 'east' | 'west' = opening.wall;
    let newPosition: number;
    const openingHalfWidth = opening.width / 2;
    const minMargin = 0.1;

    if (minDist === distToNorth) {
      newWall = 'north';
      const minX = openingHalfWidth + minMargin;
      const maxX = roomWidth - openingHalfWidth - minMargin;
      newPosition = Math.max(minX, Math.min(maxX, point.x + halfWidth)) / roomWidth;
    } else if (minDist === distToSouth) {
      newWall = 'south';
      const minX = openingHalfWidth + minMargin;
      const maxX = roomWidth - openingHalfWidth - minMargin;
      newPosition = Math.max(minX, Math.min(maxX, point.x + halfWidth)) / roomWidth;
    } else if (minDist === distToWest) {
      newWall = 'west';
      const minZ = openingHalfWidth + minMargin;
      const maxZ = roomLength - openingHalfWidth - minMargin;
      newPosition = Math.max(minZ, Math.min(maxZ, point.z + halfLength)) / roomLength;
    } else {
      newWall = 'east';
      const minZ = openingHalfWidth + minMargin;
      const maxZ = roomLength - openingHalfWidth - minMargin;
      newPosition = Math.max(minZ, Math.min(maxZ, point.z + halfLength)) / roomLength;
    }

    updateOpening(opening.id, { wall: newWall, position: newPosition });
  }, [isDragging, opening.id, opening.wall, opening.width, roomWidth, roomLength, updateOpening, throttleMs]);

  const scale = (hovered || isDragging) ? 1.03 : 1;

  return (
    <group
      ref={groupRef}
      position={wallInfo.position}
      rotation={wallInfo.rotation}
      scale={[scale, scale, scale]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        setHovered(false);
        if (!isDragging) {
          document.body.style.cursor = 'auto';
        }
      }}
    >
      {/* Top frame */}
      <mesh position={[0, opening.height / 2 + frameThickness / 2, 0]} castShadow material={materials.frame}>
        <boxGeometry args={[opening.width + frameThickness * 2, frameThickness, 0.12]} />
      </mesh>
      
      {/* Bottom frame (windows only) */}
      {opening.type === 'window' && (
        <mesh position={[0, -opening.height / 2 - frameThickness / 2, 0]} castShadow material={materials.frame}>
          <boxGeometry args={[opening.width + frameThickness * 2, frameThickness, 0.12]} />
        </mesh>
      )}
      
      {/* Left frame */}
      <mesh position={[-opening.width / 2 - frameThickness / 2, 0, 0]} castShadow material={materials.frame}>
        <boxGeometry args={[frameThickness, opening.height, 0.12]} />
      </mesh>
      
      {/* Right frame */}
      <mesh position={[opening.width / 2 + frameThickness / 2, 0, 0]} castShadow material={materials.frame}>
        <boxGeometry args={[frameThickness, opening.height, 0.12]} />
      </mesh>
      
      {/* Glass for windows */}
      {opening.type === 'window' && (
        <mesh position={[0, 0, 0.01]} material={materials.glass}>
          <planeGeometry args={[opening.width, opening.height]} />
        </mesh>
      )}

      {/* Door panel */}
      {opening.type === 'door' && (
        <mesh position={[0, 0, 0.02]} material={materials.door}>
          <boxGeometry args={[opening.width - 0.02, opening.height - 0.02, 0.04]} />
        </mesh>
      )}

      {/* Drag indicator when hovered */}
      {(hovered || isDragging) && (
        <mesh position={[0, 0, 0.1]} material={materials.indicator}>
          <ringGeometry args={[0.12, 0.15, 16]} />
        </mesh>
      )}
    </group>
  );
};

export default DraggableOpening;