import { useMemo } from 'react';
import { useRoomStore } from '@/store/roomStore';
import * as THREE from 'three';

interface SnapGuidesProps {
  roomBounds: { width: number; length: number; height: number };
}

const SnapGuides = ({ roomBounds }: SnapGuidesProps) => {
  const snapSettings = useRoomStore((state) => state.snapSettings);

  const guideLines = useMemo(() => {
    if (!snapSettings.enabled || !snapSettings.presets) return null;

    const { width, length, height } = roomBounds;
    const wallOffset = 0.02;
    
    // Preset positions
    const bottom = 0.3;
    const middle = height / 2;
    const top = height - 0.3;
    const positions = [bottom, middle, top];

    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: '#f59e0b', 
      transparent: true, 
      opacity: 0.5,
      depthTest: false,
    });

    const dashedLineMaterial = new THREE.LineDashedMaterial({
      color: '#f59e0b',
      transparent: true,
      opacity: 0.4,
      dashSize: 0.1,
      gapSize: 0.05,
      depthTest: false,
    });

    const lines: JSX.Element[] = [];

    positions.forEach((yPos, idx) => {
      const isMiddle = idx === 1;
      const material = isMiddle ? dashedLineMaterial : lineMaterial;

      // North wall (z = -length/2)
      const northPoints = [
        new THREE.Vector3(-width / 2, yPos, -length / 2 + wallOffset),
        new THREE.Vector3(width / 2, yPos, -length / 2 + wallOffset),
      ];
      const northGeom = new THREE.BufferGeometry().setFromPoints(northPoints);
      
      // South wall (z = length/2)
      const southPoints = [
        new THREE.Vector3(-width / 2, yPos, length / 2 - wallOffset),
        new THREE.Vector3(width / 2, yPos, length / 2 - wallOffset),
      ];
      const southGeom = new THREE.BufferGeometry().setFromPoints(southPoints);

      // West wall (x = -width/2)
      const westPoints = [
        new THREE.Vector3(-width / 2 + wallOffset, yPos, -length / 2),
        new THREE.Vector3(-width / 2 + wallOffset, yPos, length / 2),
      ];
      const westGeom = new THREE.BufferGeometry().setFromPoints(westPoints);

      // East wall (x = width/2)
      const eastPoints = [
        new THREE.Vector3(width / 2 - wallOffset, yPos, -length / 2),
        new THREE.Vector3(width / 2 - wallOffset, yPos, length / 2),
      ];
      const eastGeom = new THREE.BufferGeometry().setFromPoints(eastPoints);

      lines.push(
        <primitive key={`north-${idx}`} object={new THREE.Line(northGeom, material.clone())} />,
        <primitive key={`south-${idx}`} object={new THREE.Line(southGeom, material.clone())} />,
        <primitive key={`west-${idx}`} object={new THREE.Line(westGeom, material.clone())} />,
        <primitive key={`east-${idx}`} object={new THREE.Line(eastGeom, material.clone())} />
      );
    });

    return lines;
  }, [snapSettings.enabled, snapSettings.presets, roomBounds]);

  if (!guideLines) return null;

  return <group>{guideLines}</group>;
};

export default SnapGuides;