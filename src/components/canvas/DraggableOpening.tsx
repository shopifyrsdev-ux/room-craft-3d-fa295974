import { useState, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
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

  // Calculate wall dimensions and position based on wall type
  const getWallInfo = () => {
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
  };

  const wallInfo = getWallInfo();
  const frameColor = opening.type === 'door' ? '#5c4033' : '#4a5568';
  const frameThickness = 0.04;

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();

    const point = e.point;
    if (!point) return;

    // Determine which wall is closest based on drag position
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
      const clampedX = Math.max(minX, Math.min(maxX, point.x + halfWidth));
      newPosition = clampedX / roomWidth;
    } else if (minDist === distToSouth) {
      newWall = 'south';
      const minX = openingHalfWidth + minMargin;
      const maxX = roomWidth - openingHalfWidth - minMargin;
      const clampedX = Math.max(minX, Math.min(maxX, point.x + halfWidth));
      newPosition = clampedX / roomWidth;
    } else if (minDist === distToWest) {
      newWall = 'west';
      const minZ = openingHalfWidth + minMargin;
      const maxZ = roomLength - openingHalfWidth - minMargin;
      const clampedZ = Math.max(minZ, Math.min(maxZ, point.z + halfLength));
      newPosition = clampedZ / roomLength;
    } else {
      newWall = 'east';
      const minZ = openingHalfWidth + minMargin;
      const maxZ = roomLength - openingHalfWidth - minMargin;
      const clampedZ = Math.max(minZ, Math.min(maxZ, point.z + halfLength));
      newPosition = clampedZ / roomLength;
    }

    updateOpening(opening.id, { wall: newWall, position: newPosition });
  };

  // Hover effect
  useFrame(() => {
    if (!groupRef.current) return;
    const targetScale = hovered || isDragging ? 1.03 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <group
      ref={groupRef}
      position={wallInfo.position}
      rotation={wallInfo.rotation}
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
        setIsDragging(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Top frame */}
      <mesh position={[0, opening.height / 2 + frameThickness / 2, 0]} castShadow>
        <boxGeometry args={[opening.width + frameThickness * 2, frameThickness, 0.12]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      
      {/* Bottom frame (windows only) */}
      {opening.type === 'window' && (
        <mesh position={[0, -opening.height / 2 - frameThickness / 2, 0]} castShadow>
          <boxGeometry args={[opening.width + frameThickness * 2, frameThickness, 0.12]} />
          <meshStandardMaterial color={frameColor} />
        </mesh>
      )}
      
      {/* Left frame */}
      <mesh position={[-opening.width / 2 - frameThickness / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameThickness, opening.height, 0.12]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      
      {/* Right frame */}
      <mesh position={[opening.width / 2 + frameThickness / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameThickness, opening.height, 0.12]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      
      {/* Glass for windows */}
      {opening.type === 'window' && (
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[opening.width, opening.height]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Door panel */}
      {opening.type === 'door' && (
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[opening.width - 0.02, opening.height - 0.02, 0.04]} />
          <meshStandardMaterial color="#8b6914" roughness={0.7} />
        </mesh>
      )}

      {/* Drag indicator when hovered */}
      {(hovered || isDragging) && (
        <mesh position={[0, 0, 0.1]}>
          <ringGeometry args={[0.12, 0.15, 16]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};

export default DraggableOpening;
