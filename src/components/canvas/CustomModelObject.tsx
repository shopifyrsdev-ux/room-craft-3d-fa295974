import { useRef, useState, useMemo, useCallback, Suspense } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useRoomStore, CustomModelItem } from '@/store/roomStore';
import * as THREE from 'three';

interface CustomModelObjectProps {
  item: CustomModelItem;
  isSelected: boolean;
  onSelect: () => void;
  roomBounds: { width: number; length: number; height: number };
}

const LoadedModel = ({ url, color }: { url: string; color?: string }) => {
  const { scene } = useGLTF(url);
  
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    // Optional: Apply color tint to meshes
    if (color) {
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material.clone();
          if (material instanceof THREE.MeshStandardMaterial) {
            material.color.set(color);
          }
          child.material = material;
        }
      });
    }
    return clone;
  }, [scene, color]);

  return <primitive object={clonedScene} />;
};

const CustomModelObject = ({ item, isSelected, onSelect, roomBounds }: CustomModelObjectProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const updateCustomModel = useRoomStore((state) => state.updateCustomModel);
  const cameraLocked = useRoomStore((state) => state.cameraLocked);
  const snapSettings = useRoomStore((state) => state.snapSettings);
  const [isDragging, setIsDragging] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const throttleMs = 16;

  // Snap helper function
  const applySnap = useCallback((value: number, axis: 'horizontal' | 'vertical') => {
    if (!snapSettings.enabled) return value;

    // Preset snapping for vertical axis (top/middle/bottom)
    if (axis === 'vertical' && snapSettings.presets) {
      const bottom = 0.3;
      const middle = roomBounds.height / 2;
      const top = roomBounds.height - 0.3;
      const presets = [bottom, middle, top];
      const threshold = 0.15; // Snap threshold in meters

      for (const preset of presets) {
        if (Math.abs(value - preset) < threshold) {
          return preset;
        }
      }
    }

    // Grid snapping
    if (snapSettings.gridSize > 0) {
      return Math.round(value / snapSettings.gridSize) * snapSettings.gridSize;
    }

    return value;
  }, [snapSettings, roomBounds.height]);

  // Calculate position based on placement type
  const transform = useMemo(() => {
    if (item.placementType === 'wall' && item.wall) {
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
    if (item.placementType === 'ceiling') {
      return {
        position: [item.position[0], roomBounds.height - 0.3, item.position[2]] as [number, number, number],
        rotation: item.rotation,
      };
    }
    return {
      position: item.position,
      rotation: item.rotation,
    };
  }, [item.position, item.rotation, item.placementType, item.wall, roomBounds]);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect();
    if (!cameraLocked) return;

    // Capture pointer so we keep receiving move events even if the cursor leaves the model
    (e.target as unknown as { setPointerCapture?: (id: number) => void })
      .setPointerCapture?.(e.pointerId);

    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  }, [onSelect, cameraLocked]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    (e.target as unknown as { releasePointerCapture?: (id: number) => void })
      .releasePointerCapture?.(e.pointerId);

    setIsDragging(false);
    document.body.style.cursor = 'auto';
  }, []);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    
    const now = performance.now();
    if (now - lastUpdateRef.current < throttleMs) return;
    lastUpdateRef.current = now;
    
    e.stopPropagation();
    
    const point = e.point;
    if (!point) return;

    const margin = 0.3;
    const halfWidth = roomBounds.width / 2 - margin;
    const halfLength = roomBounds.length / 2 - margin;

    if (item.placementType === 'wall') {
      const distToNorth = Math.abs(point.z - (-roomBounds.length / 2));
      const distToSouth = Math.abs(point.z - (roomBounds.length / 2));
      const distToWest = Math.abs(point.x - (-roomBounds.width / 2));
      const distToEast = Math.abs(point.x - (roomBounds.width / 2));
      
      const minDist = Math.min(distToNorth, distToSouth, distToWest, distToEast);
      
      // Allow vertical movement within wall bounds (with margin from floor and ceiling)
      const minY = 0.2;
      const maxY = roomBounds.height - 0.2;
      const clampedY = Math.max(minY, Math.min(maxY, point.y));
      
      // Apply snap to vertical position
      const snappedY = applySnap(clampedY, 'vertical');
      
      let newWall: 'north' | 'south' | 'east' | 'west';
      let newPosition: [number, number, number];

      if (minDist === distToNorth) {
        newWall = 'north';
        const snappedX = applySnap(Math.max(-halfWidth, Math.min(halfWidth, point.x)), 'horizontal');
        newPosition = [snappedX, snappedY, 0];
      } else if (minDist === distToSouth) {
        newWall = 'south';
        const snappedX = applySnap(Math.max(-halfWidth, Math.min(halfWidth, point.x)), 'horizontal');
        newPosition = [snappedX, snappedY, 0];
      } else if (minDist === distToWest) {
        newWall = 'west';
        const snappedZ = applySnap(Math.max(-halfLength, Math.min(halfLength, point.z)), 'horizontal');
        newPosition = [0, snappedY, snappedZ];
      } else {
        newWall = 'east';
        const snappedZ = applySnap(Math.max(-halfLength, Math.min(halfLength, point.z)), 'horizontal');
        newPosition = [0, snappedY, snappedZ];
      }

      updateCustomModel(item.id, { position: newPosition, wall: newWall });
    } else if (item.placementType === 'ceiling') {
      updateCustomModel(item.id, {
        position: [
          Math.max(-halfWidth, Math.min(halfWidth, point.x)),
          item.position[1],
          Math.max(-halfLength, Math.min(halfLength, point.z))
        ],
      });
    } else {
      updateCustomModel(item.id, {
        position: [
          Math.max(-halfWidth, Math.min(halfWidth, point.x)),
          0,
          Math.max(-halfLength, Math.min(halfLength, point.z))
        ],
      });
    }
  }, [isDragging, item.id, item.placementType, item.position, roomBounds, updateCustomModel, applySnap]);

  const selectionMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.6 }), 
  []);

  const selectionIndicator = useMemo(() => {
    if (item.placementType === 'wall') {
      return (
        <mesh position={[0, 0, 0.08]} material={selectionMaterial}>
          <ringGeometry args={[0.5, 0.55, 32]} />
        </mesh>
      );
    }
    if (item.placementType === 'ceiling') {
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
  }, [item.placementType, selectionMaterial]);

  const baseScale = isSelected ? 1.02 : 1;
  const finalScale: [number, number, number] = [
    item.scale[0] * baseScale,
    item.scale[1] * baseScale,
    item.scale[2] * baseScale,
  ];

  return (
    <group 
      ref={groupRef}
      position={transform?.position} 
      rotation={transform?.rotation}
      scale={finalScale}
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
      <Suspense fallback={
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#888888" wireframe />
        </mesh>
      }>
        <LoadedModel url={item.modelUrl} />
      </Suspense>
      {isSelected && selectionIndicator}
    </group>
  );
};

export default CustomModelObject;