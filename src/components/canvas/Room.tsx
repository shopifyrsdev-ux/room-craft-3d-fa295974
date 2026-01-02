import { useMemo } from 'react';
import { useRoomStore, Opening, WallTexture } from '@/store/roomStore';
import DraggableOpening from './DraggableOpening';
import AttachedRoom from './AttachedRoom';
import * as THREE from 'three';
import { createWallTexture } from '@/lib/wallTextures';

interface RoomProps {
  width: number;
  length: number;
  height: number;
}

// Create wall shape with cutouts for doors/windows
const createWallWithOpenings = (
  wallWidth: number,
  wallHeight: number,
  wallOpenings: Opening[]
): THREE.Shape => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(wallWidth, 0);
  shape.lineTo(wallWidth, wallHeight);
  shape.lineTo(0, wallHeight);
  shape.lineTo(0, 0);

  wallOpenings.forEach((opening) => {
    const centerX = opening.position * wallWidth;
    const halfWidth = opening.width / 2;
    const left = Math.max(0.05, centerX - halfWidth);
    const right = Math.min(wallWidth - 0.05, centerX + halfWidth);
    const bottom = opening.elevation;
    const top = Math.min(wallHeight - 0.05, opening.elevation + opening.height);

    const hole = new THREE.Path();
    hole.moveTo(left, bottom);
    hole.lineTo(right, bottom);
    hole.lineTo(right, top);
    hole.lineTo(left, top);
    hole.lineTo(left, bottom);
    shape.holes.push(hole);
  });

  return shape;
};

const Room = ({ width, length, height }: RoomProps) => {
  const { wallColors, wallTextures, floorColor, openings, attachedRooms } = useRoomStore();

  const wallThickness = 0.08;

  // Generate door openings for attached rooms
  const attachedRoomOpenings = useMemo(() => {
    return attachedRooms.map((room) => {
      const doorWidth = Math.min(0.9, room.length * 0.6);
      const doorHeight = Math.min(2.1, room.height - 0.1);
      
      return {
        id: `attached-${room.type}`,
        type: 'door' as const,
        wall: room.wall,
        position: 0.5, // Center of wall
        width: doorWidth,
        height: doorHeight,
        elevation: 0,
      };
    });
  }, [attachedRooms]);

  // Combine regular openings with attached room door openings
  const allOpenings = useMemo(() => [...openings, ...attachedRoomOpenings], [openings, attachedRoomOpenings]);

  // Group openings by wall
  const openingsByWall = useMemo(() => ({
    north: allOpenings.filter((o) => o.wall === 'north'),
    south: allOpenings.filter((o) => o.wall === 'south'),
    east: allOpenings.filter((o) => o.wall === 'east'),
    west: allOpenings.filter((o) => o.wall === 'west'),
  }), [allOpenings]);

  // Create wall geometries with cutouts
  const walls = useMemo(() => {
    const configs = [
      {
        name: 'north' as const,
        wallWidth: width,
        position: [0, height / 2, -length / 2 - wallThickness / 2] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        openings: openingsByWall.north,
        opacity: 1,
      },
      {
        name: 'south' as const,
        wallWidth: width,
        position: [0, height / 2, length / 2 + wallThickness / 2] as [number, number, number],
        rotation: [0, Math.PI, 0] as [number, number, number],
        openings: openingsByWall.south,
        opacity: 0.15,
      },
      {
        name: 'west' as const,
        wallWidth: length,
        position: [-width / 2 - wallThickness / 2, height / 2, 0] as [number, number, number],
        rotation: [0, Math.PI / 2, 0] as [number, number, number],
        openings: openingsByWall.west,
        opacity: 1,
      },
      {
        name: 'east' as const,
        wallWidth: length,
        position: [width / 2 + wallThickness / 2, height / 2, 0] as [number, number, number],
        rotation: [0, -Math.PI / 2, 0] as [number, number, number],
        openings: openingsByWall.east,
        opacity: 0.3,
      },
    ];

    return configs.map((config) => {
      const shape = createWallWithOpenings(config.wallWidth, height, config.openings);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: wallThickness,
        bevelEnabled: false,
      });
      geometry.translate(-config.wallWidth / 2, -height / 2, -wallThickness / 2);

      return { ...config, geometry };
    });
  }, [width, length, height, openingsByWall]);

  // Create texture materials for each wall
  const wallMaterials = useMemo(() => {
    const materials: Record<string, THREE.MeshStandardMaterial> = {};
    
    walls.forEach((wall) => {
      const texture = createWallTexture(wallTextures[wall.name], wallColors[wall.name]);
      
      materials[wall.name] = new THREE.MeshStandardMaterial({
        color: wallColors[wall.name],
        roughness: 0.9,
        transparent: wall.opacity < 1,
        opacity: wall.opacity,
        side: THREE.DoubleSide,
        map: texture,
      });
    });
    
    return materials;
  }, [walls, wallColors, wallTextures]);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow name="floor">
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Floor base */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[width + wallThickness * 2, 0.1, length + wallThickness * 2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* Walls with cutouts and textures */}
      {walls.map((wall) => (
        <mesh
          key={wall.name}
          geometry={wall.geometry}
          position={wall.position}
          rotation={wall.rotation}
          receiveShadow
          castShadow={wall.opacity === 1}
          material={wallMaterials[wall.name]}
        />
      ))}

      {/* Draggable door/window frames */}
      {openings.map((opening) => (
        <DraggableOpening
          key={opening.id}
          opening={opening}
          roomWidth={width}
          roomLength={length}
          roomHeight={height}
        />
      ))}

      {/* Ceiling edges */}
      <mesh position={[0, height, -length / 2]}>
        <boxGeometry args={[width, 0.05, 0.05]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[-width / 2, height, 0]}>
        <boxGeometry args={[0.05, 0.05, length]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[width / 2, height, 0]}>
        <boxGeometry args={[0.05, 0.05, length]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Baseboard */}
      <mesh position={[0, 0.05, -length / 2 + 0.02]}>
        <boxGeometry args={[width, 0.1, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-width / 2 + 0.02, 0.05, 0]}>
        <boxGeometry args={[0.04, 0.1, length]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Attached rooms (bathroom/kitchen) */}
      {attachedRooms.map((room) => (
        <AttachedRoom
          key={room.type}
          room={room}
          mainRoomWidth={width}
          mainRoomLength={length}
          mainRoomHeight={height}
        />
      ))}
    </group>
  );
};

export default Room;
