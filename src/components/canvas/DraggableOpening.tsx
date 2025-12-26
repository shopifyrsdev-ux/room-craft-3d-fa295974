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

    let newPosition: number;
    const halfWidth = opening.width / 2;
    const minMargin = 0.1;

    if (wallInfo.dragAxis === 'x') {
      // Clamp x position within wall bounds
      const minX = -roomWidth / 2 + halfWidth + minMargin;
      const maxX = roomWidth / 2 - halfWidth - minMargin;
      const clampedX = Math.max(minX, Math.min(maxX, point.x));
      newPosition = (clampedX / roomWidth) + 0.5;
    } else {
      // Clamp z position within wall bounds
      const minZ = -roomLength / 2 + halfWidth + minMargin;
      const maxZ = roomLength / 2 - halfWidth - minMargin;
      const clampedZ = Math.max(minZ, Math.min(maxZ, point.z));
      newPosition = (clampedZ / roomLength) + 0.5;
    }

    updateOpening(opening.id, { position: newPosition });
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
