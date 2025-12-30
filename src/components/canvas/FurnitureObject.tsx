import { useRef, useState, useMemo, useCallback } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useRoomStore, FurnitureItem } from '@/store/roomStore';
import * as THREE from 'three';

interface FurnitureObjectProps {
  item: FurnitureItem;
  isSelected: boolean;
  onSelect: () => void;
  roomBounds: { width: number; length: number; height: number };
}

// Realistic furniture components with memoized materials
const BedModel = ({ color }: { color: string }) => {
  const materials = useMemo(() => ({
    mattress: new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
    frame: new THREE.MeshStandardMaterial({ color: "#3d2817", roughness: 0.7 }),
    pillow: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 }),
    leg: new THREE.MeshStandardMaterial({ color: "#2a1a0a", roughness: 0.6 }),
  }), [color]);

  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow material={materials.mattress}>
        <boxGeometry args={[1.6, 0.25, 2.0]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow material={materials.frame}>
        <boxGeometry args={[1.7, 0.2, 2.1]} />
      </mesh>
      <mesh position={[0, 0.6, -0.95]} castShadow material={materials.frame}>
        <boxGeometry args={[1.7, 0.8, 0.08]} />
      </mesh>
      <mesh position={[-0.4, 0.45, -0.7]} castShadow material={materials.pillow}>
        <boxGeometry args={[0.5, 0.15, 0.4]} />
      </mesh>
      <mesh position={[0.4, 0.45, -0.7]} castShadow material={materials.pillow}>
        <boxGeometry args={[0.5, 0.15, 0.4]} />
      </mesh>
      {[[-0.75, 0, -0.95], [0.75, 0, -0.95], [-0.75, 0, 0.95], [0.75, 0, 0.95]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow material={materials.leg}>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        </mesh>
      ))}
    </group>
  );
};

const SofaModel = ({ color }: { color: string }) => {
  const materials = useMemo(() => ({
    fabric: new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
    cushion: new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
    leg: new THREE.MeshStandardMaterial({ color: "#1a1a1a", metalness: 0.3 }),
  }), [color]);

  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow material={materials.fabric}>
        <boxGeometry args={[2.0, 0.4, 0.85]} />
      </mesh>
      <mesh position={[0, 0.55, -0.35]} castShadow material={materials.fabric}>
        <boxGeometry args={[2.0, 0.5, 0.15]} />
      </mesh>
      <mesh position={[-0.95, 0.4, 0]} castShadow material={materials.fabric}>
        <boxGeometry args={[0.12, 0.4, 0.85]} />
      </mesh>
      <mesh position={[0.95, 0.4, 0]} castShadow material={materials.fabric}>
        <boxGeometry args={[0.12, 0.4, 0.85]} />
      </mesh>
      <mesh position={[-0.5, 0.45, 0.05]} castShadow material={materials.cushion}>
        <boxGeometry args={[0.8, 0.12, 0.65]} />
      </mesh>
      <mesh position={[0.5, 0.45, 0.05]} castShadow material={materials.cushion}>
        <boxGeometry args={[0.8, 0.12, 0.65]} />
      </mesh>
      {[[-0.85, 0, 0.3], [0.85, 0, 0.3], [-0.85, 0, -0.3], [0.85, 0, -0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow material={materials.leg}>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
        </mesh>
      ))}
    </group>
  );
};

const TableModel = ({ color }: { color: string }) => {
  const materials = useMemo(() => ({
    top: new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 }),
    leg: new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
  }), [color]);

  return (
    <group>
      <mesh position={[0, 0.72, 0]} castShadow material={materials.top}>
        <boxGeometry args={[1.2, 0.04, 0.8]} />
      </mesh>
      {[[-0.55, 0.35, -0.35], [0.55, 0.35, -0.35], [-0.55, 0.35, 0.35], [0.55, 0.35, 0.35]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow material={materials.leg}>
          <boxGeometry args={[0.06, 0.7, 0.06]} />
        </mesh>
      ))}
    </group>
  );
};

const ChairModel = ({ color }: { color: string }) => {
  const materials = useMemo(() => ({
    wood: new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    leg: new THREE.MeshStandardMaterial({ color: "#1a1a1a", metalness: 0.4 }),
  }), [color]);

  return (
    <group>
      <mesh position={[0, 0.45, 0]} castShadow material={materials.wood}>
        <boxGeometry args={[0.45, 0.05, 0.45]} />
      </mesh>
      <mesh position={[0, 0.75, -0.2]} castShadow material={materials.wood}>
        <boxGeometry args={[0.42, 0.55, 0.04]} />
      </mesh>
      {[[-0.18, 0.22, -0.18], [0.18, 0.22, -0.18], [-0.18, 0.22, 0.18], [0.18, 0.22, 0.18]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow material={materials.leg}>
          <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
        </mesh>
      ))}
    </group>
  );
};

const WardrobeModel = ({ color }: { color: string }) => {
  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
    line: new THREE.MeshStandardMaterial({ color: "#1a1a1a" }),
    handle: new THREE.MeshStandardMaterial({ color: "#888888", metalness: 0.8, roughness: 0.2 }),
  }), [color]);

  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow material={materials.body}>
        <boxGeometry args={[1.5, 2.0, 0.6]} />
      </mesh>
      <mesh position={[0, 1, 0.301]} castShadow material={materials.line}>
        <boxGeometry args={[0.02, 1.9, 0.01]} />
      </mesh>
      <mesh position={[-0.1, 1, 0.32]} castShadow material={materials.handle}>
        <boxGeometry args={[0.03, 0.15, 0.02]} />
      </mesh>
      <mesh position={[0.1, 1, 0.32]} castShadow material={materials.handle}>
        <boxGeometry args={[0.03, 0.15, 0.02]} />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow material={materials.line}>
        <boxGeometry args={[1.52, 0.1, 0.62]} />
      </mesh>
    </group>
  );
};

const DecorModel = ({ color }: { color: string }) => {
  const materials = useMemo(() => ({
    pot: new THREE.MeshStandardMaterial({ color: "#8b4513", roughness: 0.8 }),
    plant: new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
  }), [color]);

  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow material={materials.pot}>
        <cylinderGeometry args={[0.12, 0.1, 0.3, 16]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow material={materials.plant}>
        <sphereGeometry args={[0.18, 16, 16]} />
      </mesh>
      <mesh position={[0.1, 0.55, 0.05]} castShadow material={materials.plant}>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>
      <mesh position={[-0.08, 0.5, -0.05]} castShadow material={materials.plant}>
        <sphereGeometry args={[0.1, 16, 16]} />
      </mesh>
    </group>
  );
};

const PaintingModel = ({ color }: { color: string }) => {
  const materials = useMemo(() => ({
    frame: new THREE.MeshStandardMaterial({ color: "#4a3728", roughness: 0.6 }),
    canvas: new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
    border: new THREE.MeshStandardMaterial({ color: "#f5f5dc", roughness: 0.9 }),
  }), [color]);

  return (
    <group>
      <mesh castShadow material={materials.frame}>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
      </mesh>
      <mesh position={[0, 0, 0.03]} material={materials.canvas}>
        <boxGeometry args={[0.7, 0.5, 0.01]} />
      </mesh>
      <mesh position={[0, 0, 0.026]} material={materials.border}>
        <boxGeometry args={[0.72, 0.52, 0.005]} />
      </mesh>
    </group>
  );
};

const FanModel = ({ color }: { color: string }) => {
  const materials = useMemo(() => ({
    motor: new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 }),
    metal: new THREE.MeshStandardMaterial({ color: "#888888", metalness: 0.8, roughness: 0.2 }),
    blade: new THREE.MeshStandardMaterial({ color: "#3d2817", roughness: 0.6 }),
  }), [color]);

  const bladePositions = useMemo(() => 
    [0, 1, 2, 3, 4].map((i) => ({
      position: [
        Math.cos((i * Math.PI * 2) / 5) * 0.4,
        -0.15,
        Math.sin((i * Math.PI * 2) / 5) * 0.4,
      ] as [number, number, number],
      rotation: [0, -(i * Math.PI * 2) / 5, 0.1] as [number, number, number],
    })), []);

  return (
    <group>
      <mesh position={[0, -0.1, 0]} castShadow material={materials.motor}>
        <cylinderGeometry args={[0.12, 0.15, 0.2, 16]} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow material={materials.metal}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow material={materials.metal}>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
      </mesh>
      {bladePositions.map((blade, i) => (
        <mesh key={i} position={blade.position} rotation={blade.rotation} castShadow material={materials.blade}>
          <boxGeometry args={[0.5, 0.02, 0.12]} />
        </mesh>
      ))}
    </group>
  );
};

const FURNITURE_MODELS: Record<FurnitureItem['type'], React.FC<{ color: string }>> = {
  bed: BedModel,
  sofa: SofaModel,
  table: TableModel,
  chair: ChairModel,
  wardrobe: WardrobeModel,
  decor: DecorModel,
  painting: PaintingModel,
  fan: FanModel,
};

const FurnitureObject = ({ item, isSelected, onSelect, roomBounds }: FurnitureObjectProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const updateFurniture = useRoomStore((state) => state.updateFurniture);
  const [isDragging, setIsDragging] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const throttleMs = 16; // ~60fps throttle for drag updates

  const FurnitureModel = FURNITURE_MODELS[item.type];

  // Memoize transform calculation
  const transform = useMemo(() => {
    if (item.type === 'painting' && item.wall) {
      const wallOffset = 0.03;
      switch (item.wall) {
        case 'north':
          return {
            position: [item.position[0], item.position[1], -roomBounds.length / 2 + wallOffset] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
          };
        case 'south':
          return {
            position: [item.position[0], item.position[1], roomBounds.length / 2 - wallOffset] as [number, number, number],
            rotation: [0, Math.PI, 0] as [number, number, number],
          };
        case 'west':
          return {
            position: [-roomBounds.width / 2 + wallOffset, item.position[1], item.position[2]] as [number, number, number],
            rotation: [0, Math.PI / 2, 0] as [number, number, number],
          };
        case 'east':
          return {
            position: [roomBounds.width / 2 - wallOffset, item.position[1], item.position[2]] as [number, number, number],
            rotation: [0, -Math.PI / 2, 0] as [number, number, number],
          };
      }
    }
    if (item.type === 'fan') {
      return {
        position: [item.position[0], roomBounds.height - 0.4, item.position[2]] as [number, number, number],
        rotation: item.rotation,
      };
    }
    return {
      position: item.position,
      rotation: item.rotation,
    };
  }, [item.position, item.rotation, item.type, item.wall, roomBounds]);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  }, [onSelect]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'auto';
  }, []);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    
    // Throttle updates to prevent excessive re-renders
    const now = performance.now();
    if (now - lastUpdateRef.current < throttleMs) return;
    lastUpdateRef.current = now;
    
    e.stopPropagation();
    
    const point = e.point;
    if (!point) return;

    const margin = 0.3;
    const halfWidth = roomBounds.width / 2 - margin;
    const halfLength = roomBounds.length / 2 - margin;

    if (item.type === 'painting') {
      const distToNorth = Math.abs(point.z - (-roomBounds.length / 2));
      const distToSouth = Math.abs(point.z - (roomBounds.length / 2));
      const distToWest = Math.abs(point.x - (-roomBounds.width / 2));
      const distToEast = Math.abs(point.x - (roomBounds.width / 2));
      
      const minDist = Math.min(distToNorth, distToSouth, distToWest, distToEast);
      const paintingHeight = 1.5;
      
      let newWall: 'north' | 'south' | 'east' | 'west';
      let newPosition: [number, number, number];

      if (minDist === distToNorth) {
        newWall = 'north';
        newPosition = [Math.max(-halfWidth, Math.min(halfWidth, point.x)), paintingHeight, 0];
      } else if (minDist === distToSouth) {
        newWall = 'south';
        newPosition = [Math.max(-halfWidth, Math.min(halfWidth, point.x)), paintingHeight, 0];
      } else if (minDist === distToWest) {
        newWall = 'west';
        newPosition = [0, paintingHeight, Math.max(-halfLength, Math.min(halfLength, point.z))];
      } else {
        newWall = 'east';
        newPosition = [0, paintingHeight, Math.max(-halfLength, Math.min(halfLength, point.z))];
      }

      updateFurniture(item.id, { position: newPosition, wall: newWall });
    } else if (item.type === 'fan') {
      updateFurniture(item.id, {
        position: [
          Math.max(-halfWidth, Math.min(halfWidth, point.x)),
          item.position[1],
          Math.max(-halfLength, Math.min(halfLength, point.z))
        ],
      });
    } else {
      updateFurniture(item.id, {
        position: [
          Math.max(-halfWidth, Math.min(halfWidth, point.x)),
          0,
          Math.max(-halfLength, Math.min(halfLength, point.z))
        ],
      });
    }
  }, [isDragging, item.id, item.type, item.position, roomBounds, updateFurniture, throttleMs]);

  // Memoize selection indicator materials to prevent recreation
  const selectionMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.6 }), 
  []);

  const selectionIndicator = useMemo(() => {
    if (item.type === 'painting') {
      return (
        <mesh position={[0, 0, 0.08]} material={selectionMaterial}>
          <ringGeometry args={[0.5, 0.55, 32]} />
        </mesh>
      );
    }
    if (item.type === 'fan') {
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.3, 0]} material={selectionMaterial}>
          <ringGeometry args={[0.5, 0.55, 32]} />
        </mesh>
      );
    }
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={selectionMaterial}>
        <ringGeometry args={[0.8, 0.9, 32]} />
      </mesh>
    );
  }, [item.type, selectionMaterial]);

  // Scale for hover/selection effect - applied directly without useFrame
  const scale = isSelected ? 1.02 : 1;

  return (
    <group 
      ref={groupRef}
      position={transform?.position} 
      rotation={transform?.rotation}
      scale={[scale, scale, scale]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        if (!isDragging) {
          document.body.style.cursor = 'auto';
        }
      }}
    >
      <FurnitureModel color={item.color} />
      {isSelected && selectionIndicator}
    </group>
  );
};

export default FurnitureObject;
