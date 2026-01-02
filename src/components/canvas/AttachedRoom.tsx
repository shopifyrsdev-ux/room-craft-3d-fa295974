import { useMemo } from 'react';
import * as THREE from 'three';
import { AttachedRoom as AttachedRoomType } from '@/store/roomStore';

interface AttachedRoomProps {
  room: AttachedRoomType;
  mainRoomWidth: number;
  mainRoomLength: number;
  mainRoomHeight: number;
}

// Bathroom fixtures
const ToiletModel = ({ position, rotation }: { position: [number, number, number]; rotation: number }) => {
  const materials = useMemo(() => ({
    white: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#c0c0c0', metalness: 0.8, roughness: 0.2 }),
  }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Bowl base */}
      <mesh position={[0, 0.2, 0]} castShadow material={materials.white}>
        <cylinderGeometry args={[0.18, 0.15, 0.4, 16]} />
      </mesh>
      {/* Bowl */}
      <mesh position={[0, 0.35, 0.05]} castShadow material={materials.white}>
        <boxGeometry args={[0.35, 0.1, 0.45]} />
      </mesh>
      {/* Tank */}
      <mesh position={[0, 0.55, -0.15]} castShadow material={materials.white}>
        <boxGeometry args={[0.35, 0.5, 0.15]} />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 0.42, 0.05]} castShadow material={materials.white}>
        <boxGeometry args={[0.33, 0.04, 0.4]} />
      </mesh>
      {/* Flush handle */}
      <mesh position={[0.18, 0.65, -0.1]} castShadow material={materials.chrome}>
        <boxGeometry args={[0.05, 0.03, 0.08]} />
      </mesh>
    </group>
  );
};

const SinkModel = ({ position, rotation, isKitchen = false }: { position: [number, number, number]; rotation: number; isKitchen?: boolean }) => {
  const materials = useMemo(() => ({
    white: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#c0c0c0', metalness: 0.8, roughness: 0.2 }),
    steel: new THREE.MeshStandardMaterial({ color: '#a8a8a8', metalness: 0.9, roughness: 0.3 }),
  }), []);

  const sinkWidth = isKitchen ? 0.6 : 0.45;
  const sinkDepth = isKitchen ? 0.5 : 0.35;
  const sinkMaterial = isKitchen ? materials.steel : materials.white;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Basin */}
      <mesh position={[0, 0.85, 0]} castShadow material={sinkMaterial}>
        <boxGeometry args={[sinkWidth, 0.08, sinkDepth]} />
      </mesh>
      {/* Basin interior (darker) */}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[sinkWidth - 0.05, 0.12, sinkDepth - 0.05]} />
        <meshStandardMaterial color={isKitchen ? '#888888' : '#f0f0f0'} />
      </mesh>
      {/* Faucet base */}
      <mesh position={[0, 0.95, -sinkDepth/2 + 0.05]} castShadow material={materials.chrome}>
        <cylinderGeometry args={[0.02, 0.03, 0.1, 8]} />
      </mesh>
      {/* Faucet spout */}
      <mesh position={[0, 1.02, -sinkDepth/2 + 0.12]} castShadow rotation={[Math.PI/4, 0, 0]} material={materials.chrome}>
        <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
      </mesh>
      {/* Pedestal/Cabinet */}
      {!isKitchen ? (
        <mesh position={[0, 0.4, 0]} castShadow material={materials.white}>
          <cylinderGeometry args={[0.08, 0.1, 0.8, 16]} />
        </mesh>
      ) : (
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[sinkWidth, 0.8, sinkDepth]} />
          <meshStandardMaterial color="#5a4a3a" />
        </mesh>
      )}
    </group>
  );
};

const ShowerModel = ({ position, rotation }: { position: [number, number, number]; rotation: number }) => {
  const materials = useMemo(() => ({
    glass: new THREE.MeshStandardMaterial({ color: '#e0f0ff', transparent: true, opacity: 0.3, roughness: 0 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#c0c0c0', metalness: 0.8, roughness: 0.2 }),
    tile: new THREE.MeshStandardMaterial({ color: '#d0e0e8', roughness: 0.6 }),
  }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base/tray */}
      <mesh position={[0, 0.03, 0]} castShadow material={materials.tile}>
        <boxGeometry args={[0.9, 0.06, 0.9]} />
      </mesh>
      {/* Glass walls */}
      <mesh position={[0.44, 1, 0]} castShadow material={materials.glass}>
        <boxGeometry args={[0.02, 2, 0.88]} />
      </mesh>
      <mesh position={[0, 1, 0.44]} castShadow material={materials.glass}>
        <boxGeometry args={[0.88, 2, 0.02]} />
      </mesh>
      {/* Chrome frame */}
      <mesh position={[0.44, 2, 0]} material={materials.chrome}>
        <boxGeometry args={[0.03, 0.03, 0.9]} />
      </mesh>
      <mesh position={[0, 2, 0.44]} material={materials.chrome}>
        <boxGeometry args={[0.9, 0.03, 0.03]} />
      </mesh>
      {/* Shower head */}
      <mesh position={[-0.3, 2, -0.3]} castShadow material={materials.chrome}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
      </mesh>
      <mesh position={[-0.3, 2.1, -0.35]} castShadow rotation={[0.3, 0, 0]} material={materials.chrome}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
      </mesh>
    </group>
  );
};

// Kitchen fixtures
const StoveModel = ({ position, rotation }: { position: [number, number, number]; rotation: number }) => {
  const materials = useMemo(() => ({
    steel: new THREE.MeshStandardMaterial({ color: '#d0d0d0', metalness: 0.7, roughness: 0.3 }),
    black: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.5 }),
    burner: new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.5 }),
  }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Stove body */}
      <mesh position={[0, 0.45, 0]} castShadow material={materials.steel}>
        <boxGeometry args={[0.7, 0.9, 0.6]} />
      </mesh>
      {/* Cooktop */}
      <mesh position={[0, 0.91, 0]} castShadow material={materials.black}>
        <boxGeometry args={[0.7, 0.02, 0.6]} />
      </mesh>
      {/* Burners */}
      {[[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.93, z]} castShadow material={materials.burner}>
          <cylinderGeometry args={[0.08, 0.1, 0.02, 16]} />
        </mesh>
      ))}
      {/* Oven door */}
      <mesh position={[0, 0.35, 0.29]} castShadow material={materials.black}>
        <boxGeometry args={[0.55, 0.5, 0.02]} />
      </mesh>
      {/* Oven handle */}
      <mesh position={[0, 0.62, 0.32]} castShadow material={materials.steel}>
        <boxGeometry args={[0.4, 0.03, 0.03]} />
      </mesh>
      {/* Knobs */}
      {[-0.25, -0.08, 0.08, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 0.8, 0.31]} castShadow material={materials.black}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 8]} />
        </mesh>
      ))}
    </group>
  );
};

const RefrigeratorModel = ({ position, rotation }: { position: [number, number, number]; rotation: number }) => {
  const materials = useMemo(() => ({
    steel: new THREE.MeshStandardMaterial({ color: '#c8c8c8', metalness: 0.6, roughness: 0.3 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#a0a0a0', metalness: 0.8, roughness: 0.2 }),
  }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main body */}
      <mesh position={[0, 1, 0]} castShadow material={materials.steel}>
        <boxGeometry args={[0.8, 2, 0.7]} />
      </mesh>
      {/* Freezer section line */}
      <mesh position={[0, 1.7, 0.351]}>
        <boxGeometry args={[0.76, 0.02, 0.01]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
      {/* Main door line */}
      <mesh position={[0, 0.8, 0.351]}>
        <boxGeometry args={[0.76, 0.02, 0.01]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
      {/* Handles */}
      <mesh position={[0.32, 1.5, 0.38]} castShadow material={materials.chrome}>
        <boxGeometry args={[0.03, 0.25, 0.03]} />
      </mesh>
      <mesh position={[0.32, 0.6, 0.38]} castShadow material={materials.chrome}>
        <boxGeometry args={[0.03, 0.25, 0.03]} />
      </mesh>
    </group>
  );
};

const CounterModel = ({ position, rotation, width = 1.5 }: { position: [number, number, number]; rotation: number; width?: number }) => {
  const materials = useMemo(() => ({
    counter: new THREE.MeshStandardMaterial({ color: '#e8dcc8', roughness: 0.4 }),
    cabinet: new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: 0.7 }),
  }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Counter top */}
      <mesh position={[0, 0.9, 0]} castShadow material={materials.counter}>
        <boxGeometry args={[width, 0.05, 0.6]} />
      </mesh>
      {/* Cabinet base */}
      <mesh position={[0, 0.4, 0]} castShadow material={materials.cabinet}>
        <boxGeometry args={[width - 0.02, 0.8, 0.58]} />
      </mesh>
      {/* Cabinet doors */}
      {Array.from({ length: Math.floor(width / 0.5) }).map((_, i) => (
        <mesh key={i} position={[-width/2 + 0.25 + i * 0.5, 0.4, 0.291]} castShadow>
          <boxGeometry args={[0.45, 0.7, 0.01]} />
          <meshStandardMaterial color="#6a5a4a" />
        </mesh>
      ))}
    </group>
  );
};

// Door frame between rooms
const DoorFrame = ({ width, height }: { width: number; height: number }) => {
  const frameMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: 0.7 }), []);
  
  const frameDepth = 0.15;
  const frameThickness = 0.06;

  return (
    <group>
      {/* Left frame */}
      <mesh position={[-width/2 - frameThickness/2, height/2, 0]} castShadow material={frameMaterial}>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
      </mesh>
      {/* Right frame */}
      <mesh position={[width/2 + frameThickness/2, height/2, 0]} castShadow material={frameMaterial}>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
      </mesh>
      {/* Top frame */}
      <mesh position={[0, height + frameThickness/2, 0]} castShadow material={frameMaterial}>
        <boxGeometry args={[width + frameThickness * 2, frameThickness, frameDepth]} />
      </mesh>
      {/* Threshold */}
      <mesh position={[0, 0.015, 0]} castShadow>
        <boxGeometry args={[width, 0.03, frameDepth]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.6} />
      </mesh>
    </group>
  );
};

const AttachedRoom = ({ room, mainRoomWidth, mainRoomLength, mainRoomHeight }: AttachedRoomProps) => {
  const wallThickness = 0.08;
  const doorWidth = Math.min(0.9, room.length * 0.6); // Door is 60% of room length, max 0.9m
  const doorHeight = Math.min(2.1, room.height - 0.1); // Standard door height
  
  // Calculate position based on which wall it's attached to
  const { position, rotation, doorPosition } = useMemo(() => {
    let pos: [number, number, number] = [0, 0, 0];
    let doorPos: [number, number, number] = [0, 0, 0];
    let rot = 0;
    
    switch (room.wall) {
      case 'north':
        pos = [0, 0, -mainRoomLength / 2 - room.width / 2 - wallThickness];
        doorPos = [0, 0, -mainRoomLength / 2];
        rot = 0;
        break;
      case 'south':
        pos = [0, 0, mainRoomLength / 2 + room.width / 2 + wallThickness];
        doorPos = [0, 0, mainRoomLength / 2];
        rot = Math.PI;
        break;
      case 'east':
        pos = [mainRoomWidth / 2 + room.width / 2 + wallThickness, 0, 0];
        doorPos = [mainRoomWidth / 2, 0, 0];
        rot = -Math.PI / 2;
        break;
      case 'west':
        pos = [-mainRoomWidth / 2 - room.width / 2 - wallThickness, 0, 0];
        doorPos = [-mainRoomWidth / 2, 0, 0];
        rot = Math.PI / 2;
        break;
    }
    
    return { position: pos, rotation: rot, doorPosition: doorPos };
  }, [room.wall, room.width, mainRoomWidth, mainRoomLength]);

  const wallMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: room.type === 'bathroom' ? '#e8f0f5' : '#f5f0e8', 
      roughness: 0.8 
    }), [room.type]);

  const floorMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: room.type === 'bathroom' ? '#c0d0d8' : '#d8c8b0', 
      roughness: 0.6 
    }), [room.type]);

  // Create front wall with door opening
  const frontWallGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-room.length / 2, 0);
    shape.lineTo(room.length / 2, 0);
    shape.lineTo(room.length / 2, room.height);
    shape.lineTo(-room.length / 2, room.height);
    shape.lineTo(-room.length / 2, 0);

    // Create door hole in the center
    const hole = new THREE.Path();
    hole.moveTo(-doorWidth / 2, 0);
    hole.lineTo(doorWidth / 2, 0);
    hole.lineTo(doorWidth / 2, doorHeight);
    hole.lineTo(-doorWidth / 2, doorHeight);
    hole.lineTo(-doorWidth / 2, 0);
    shape.holes.push(hole);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: wallThickness,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -wallThickness / 2);
    
    return geometry;
  }, [room.length, room.height, doorWidth, doorHeight]);

  return (
    <>
      {/* Door frame at the connection point */}
      <group position={doorPosition} rotation={[0, rotation, 0]}>
        <DoorFrame width={doorWidth} height={doorHeight} />
      </group>

      <group position={position} rotation={[0, rotation, 0]}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[room.length, room.width]} />
          <primitive object={floorMaterial} />
        </mesh>

        {/* Front wall with door opening (faces main room) */}
        <mesh 
          geometry={frontWallGeometry}
          position={[0, 0, room.width / 2]} 
          receiveShadow 
          castShadow
          material={wallMaterial}
        />

        {/* Back wall (away from main room) */}
        <mesh position={[0, room.height / 2, -room.width / 2]} receiveShadow castShadow>
          <boxGeometry args={[room.length, room.height, wallThickness]} />
          <primitive object={wallMaterial} />
        </mesh>
        {/* Left wall */}
        <mesh position={[-room.length / 2, room.height / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, room.height, room.width]} />
          <primitive object={wallMaterial} />
        </mesh>
        {/* Right wall */}
        <mesh position={[room.length / 2, room.height / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, room.height, room.width]} />
          <primitive object={wallMaterial} />
        </mesh>

      {/* Room-specific fixtures */}
      {room.type === 'bathroom' ? (
        <>
          <ToiletModel 
            position={[-room.length / 2 + 0.35, 0, -room.width / 2 + 0.4]} 
            rotation={0} 
          />
          <SinkModel 
            position={[0, 0, -room.width / 2 + 0.25]} 
            rotation={0} 
          />
          <ShowerModel 
            position={[room.length / 2 - 0.55, 0, -room.width / 2 + 0.55]} 
            rotation={0} 
          />
        </>
      ) : (
        <>
          <RefrigeratorModel 
            position={[-room.length / 2 + 0.5, 0, -room.width / 2 + 0.4]} 
            rotation={0} 
          />
          <StoveModel 
            position={[0, 0, -room.width / 2 + 0.35]} 
            rotation={0} 
          />
          <CounterModel 
            position={[room.length / 2 - 0.8, 0, -room.width / 2 + 0.35]} 
            rotation={0}
            width={1.2}
          />
          <SinkModel 
            position={[room.length / 4, 0, -room.width / 2 + 0.3]} 
            rotation={0}
            isKitchen 
          />
        </>
      )}

        {/* Ceiling */}
        <mesh position={[0, room.height, 0]} receiveShadow>
          <boxGeometry args={[room.length, 0.05, room.width]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </>
  );
};

export default AttachedRoom;