import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useRoomStore, FurnitureItem, convertToMeters } from '@/store/roomStore';
import * as THREE from 'three';

interface FurnitureObjectProps {
  item: FurnitureItem;
  isSelected: boolean;
  onSelect: () => void;
  roomBounds: { width: number; length: number; height: number };
}

// Realistic furniture components
const BedModel = ({ color }: { color: string }) => {
  return (
    <group>
      {/* Mattress */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.6, 0.25, 2.0]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Bed frame */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[1.7, 0.2, 2.1]} />
        <meshStandardMaterial color="#3d2817" roughness={0.7} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, 0.6, -0.95]} castShadow>
        <boxGeometry args={[1.7, 0.8, 0.08]} />
        <meshStandardMaterial color="#3d2817" roughness={0.7} />
      </mesh>
      {/* Pillows */}
      <mesh position={[-0.4, 0.45, -0.7]} castShadow>
        <boxGeometry args={[0.5, 0.15, 0.4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0.4, 0.45, -0.7]} castShadow>
        <boxGeometry args={[0.5, 0.15, 0.4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      {/* Legs */}
      {[[-0.75, 0, -0.95], [0.75, 0, -0.95], [-0.75, 0, 0.95], [0.75, 0, 0.95]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
          <meshStandardMaterial color="#2a1a0a" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

const SofaModel = ({ color }: { color: string }) => {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[2.0, 0.4, 0.85]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.55, -0.35]} castShadow>
        <boxGeometry args={[2.0, 0.5, 0.15]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.95, 0.4, 0]} castShadow>
        <boxGeometry args={[0.12, 0.4, 0.85]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.95, 0.4, 0]} castShadow>
        <boxGeometry args={[0.12, 0.4, 0.85]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* Cushions */}
      <mesh position={[-0.5, 0.45, 0.05]} castShadow>
        <boxGeometry args={[0.8, 0.12, 0.65]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.5, 0.45, 0.05]} castShadow>
        <boxGeometry args={[0.8, 0.12, 0.65]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Legs */}
      {[[-0.85, 0, 0.3], [0.85, 0, 0.3], [-0.85, 0, -0.3], [0.85, 0, -0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
};

const TableModel = ({ color }: { color: string }) => {
  return (
    <group>
      {/* Tabletop */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.2, 0.04, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Legs */}
      {[[-0.55, 0.35, -0.35], [0.55, 0.35, -0.35], [-0.55, 0.35, 0.35], [0.55, 0.35, 0.35]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.06, 0.7, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
};

const ChairModel = ({ color }: { color: string }) => {
  return (
    <group>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.45, 0.05, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.75, -0.2]} castShadow>
        <boxGeometry args={[0.42, 0.55, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Legs */}
      {[[-0.18, 0.22, -0.18], [0.18, 0.22, -0.18], [-0.18, 0.22, 0.18], [0.18, 0.22, 0.18]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
};

const WardrobeModel = ({ color }: { color: string }) => {
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[1.5, 2.0, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Door line */}
      <mesh position={[0, 1, 0.301]} castShadow>
        <boxGeometry args={[0.02, 1.9, 0.01]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Handles */}
      <mesh position={[-0.1, 1, 0.32]} castShadow>
        <boxGeometry args={[0.03, 0.15, 0.02]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.1, 1, 0.32]} castShadow>
        <boxGeometry args={[0.03, 0.15, 0.02]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[1.52, 0.1, 0.62]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
};

const DecorModel = ({ color }: { color: string }) => {
  return (
    <group>
      {/* Pot */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.3, 16]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      {/* Plant */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.55, 0.05]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[-0.08, 0.5, -0.05]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
};

const PaintingModel = ({ color }: { color: string }) => {
  return (
    <group>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
        <meshStandardMaterial color="#4a3728" roughness={0.6} />
      </mesh>
      {/* Canvas */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.7, 0.5, 0.01]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Inner border */}
      <mesh position={[0, 0, 0.026]}>
        <boxGeometry args={[0.72, 0.52, 0.005]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
      </mesh>
    </group>
  );
};

const FanModel = ({ color }: { color: string }) => {
  return (
    <group>
      {/* Motor housing */}
      <mesh position={[0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.2, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Mounting rod */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Ceiling mount */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Blades */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI * 2) / 5) * 0.4,
            -0.15,
            Math.sin((i * Math.PI * 2) / 5) * 0.4,
          ]}
          rotation={[0, -(i * Math.PI * 2) / 5, 0.1]}
          castShadow
        >
          <boxGeometry args={[0.5, 0.02, 0.12]} />
          <meshStandardMaterial color="#3d2817" roughness={0.6} />
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
  const [hovered, setHovered] = useState(false);

  const FurnitureModel = FURNITURE_MODELS[item.type];

  // Get position and rotation for wall-mounted or ceiling items
  const getItemTransform = () => {
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
  };

  const transform = getItemTransform();

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect();
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

    const margin = 0.3;
    const halfWidth = roomBounds.width / 2 - margin;
    const halfLength = roomBounds.length / 2 - margin;

    if (item.type === 'painting' && item.wall) {
      // Drag along the wall
      const paintingHeight = 1.5; // Default eye level
      if (item.wall === 'north' || item.wall === 'south') {
        const newX = Math.max(-halfWidth, Math.min(halfWidth, point.x));
        updateFurniture(item.id, {
          position: [newX, paintingHeight, item.position[2]],
        });
      } else {
        const newZ = Math.max(-halfLength, Math.min(halfLength, point.z));
        updateFurniture(item.id, {
          position: [item.position[0], paintingHeight, newZ],
        });
      }
    } else if (item.type === 'fan') {
      // Drag along ceiling
      const newX = Math.max(-halfWidth, Math.min(halfWidth, point.x));
      const newZ = Math.max(-halfLength, Math.min(halfLength, point.z));
      updateFurniture(item.id, {
        position: [newX, item.position[1], newZ],
      });
    } else {
      // Regular floor furniture
      const newX = Math.max(-halfWidth, Math.min(halfWidth, point.x));
      const newZ = Math.max(-halfLength, Math.min(halfLength, point.z));
      updateFurniture(item.id, {
        position: [newX, 0, newZ],
      });
    }
  };

  // Hover effect
  useFrame(() => {
    if (!groupRef.current) return;
    const targetScale = hovered || isSelected ? 1.02 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  // Selection indicator position based on item type
  const getSelectionIndicator = () => {
    if (item.type === 'painting') {
      return (
        <mesh position={[0, 0, 0.08]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
        </mesh>
      );
    }
    if (item.type === 'fan') {
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
        </mesh>
      );
    }
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.8, 0.9, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
      </mesh>
    );
  };

  return (
    <group 
      ref={groupRef}
      position={transform.position} 
      rotation={transform.rotation}
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
      <FurnitureModel color={item.color} />
      
      {/* Selection indicator */}
      {isSelected && getSelectionIndicator()}
    </group>
  );
};

export default FurnitureObject;
