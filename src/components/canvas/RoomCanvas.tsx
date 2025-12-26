import { useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment } from '@react-three/drei';
import { useRoomStore, convertToMeters } from '@/store/roomStore';
import Room from './Room';
import FurnitureObject from './FurnitureObject';
import * as THREE from 'three';

const Scene = () => {
  const { dimensions, furniture, showGrid, cameraLocked, selectFurniture, selectedFurnitureId } = useRoomStore();
  
  if (!dimensions) return null;

  // Convert dimensions to meters for consistent 3D rendering
  const width = convertToMeters(dimensions.width, dimensions.unit);
  const length = convertToMeters(dimensions.length, dimensions.unit);
  const height = convertToMeters(dimensions.height, dimensions.unit);

  // Camera positioned for interior view
  const cameraDistance = Math.max(width, length) * 1.2;

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[cameraDistance * 0.7, height * 1.5, cameraDistance * 0.9]}
        fov={45}
        near={0.1}
        far={1000}
      />
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={Math.max(width, length) * 4}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minPolarAngle={0.1}
        target={[0, height * 0.3, 0]}
        enabled={!cameraLocked}
      />

      {/* Soft ambient lighting */}
      <ambientLight intensity={0.5} color="#fff5eb" />
      
      {/* Main sun light from above-front */}
      <directionalLight
        position={[width * 0.5, height * 2.5, length * 1.5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-width * 1.5}
        shadow-camera-right={width * 1.5}
        shadow-camera-top={length * 1.5}
        shadow-camera-bottom={-length * 1.5}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light from back */}
      <directionalLight
        position={[-width, height, -length]}
        intensity={0.4}
        color="#e0e8ff"
      />

      {/* Soft hemisphere light for ambient */}
      <hemisphereLight
        args={['#87CEEB', '#3d2817', 0.3]}
      />

      {/* Room structure */}
      <Room width={width} length={length} height={height} />

      {/* Interactive floor plane for dragging */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.005, 0]}
        visible={false}
        name="dragPlane"
      >
        <planeGeometry args={[width * 2, length * 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Furniture items */}
      {furniture.map((item) => (
        <FurnitureObject
          key={item.id}
          item={item}
          isSelected={selectedFurnitureId === item.id}
          onSelect={() => selectFurniture(item.id)}
          roomBounds={{ width, length, height }}
        />
      ))}

      {/* Grid helper */}
      {showGrid && (
        <Grid
          position={[0, 0.003, 0]}
          args={[width, length]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#3a3a3a"
          sectionSize={1}
          sectionThickness={1.2}
          sectionColor="#4a4a4a"
          fadeDistance={Math.max(width, length) * 1.5}
          fadeStrength={1}
          followCamera={false}
        />
      )}
    </>
  );
};

const RoomCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1a1f2e 0%, #0f1218 100%)' }}
    >
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onPointerMissed={() => useRoomStore.getState().selectFurniture(null)}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default RoomCanvas;
