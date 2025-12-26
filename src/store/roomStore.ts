import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Unit = 'meters' | 'feet';

export interface Opening {
  id: string;
  type: 'door' | 'window';
  wall: 'north' | 'south' | 'east' | 'west';
  position: number; // 0-1 along wall
  width: number;
  height: number;
  elevation: number; // height from floor (for windows)
}

export interface RoomDimensions {
  width: number;
  length: number;
  height: number;
  unit: Unit;
}

export interface FurnitureItem {
  id: string;
  type: 'bed' | 'sofa' | 'table' | 'chair' | 'wardrobe' | 'decor' | 'painting' | 'fan';
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  wall?: 'north' | 'south' | 'east' | 'west'; // For wall-mounted items like paintings
}

export interface WallColors {
  north: string;
  south: string;
  east: string;
  west: string;
}

export interface RoomState {
  // Room setup
  dimensions: RoomDimensions | null;
  setDimensions: (dimensions: RoomDimensions) => void;
  
  // Openings (doors/windows)
  openings: Opening[];
  addOpening: (opening: Opening) => void;
  updateOpening: (id: string, updates: Partial<Opening>) => void;
  removeOpening: (id: string) => void;
  
  // Furniture
  furniture: FurnitureItem[];
  addFurniture: (item: Omit<FurnitureItem, 'id'>) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  removeFurniture: (id: string) => void;
  selectedFurnitureId: string | null;
  selectFurniture: (id: string | null) => void;
  
  // Colors
  wallColors: WallColors;
  setWallColor: (wall: keyof WallColors, color: string) => void;
  floorColor: string;
  setFloorColor: (color: string) => void;
  ceilingColor: string;
  setCeilingColor: (color: string) => void;
  
  // UI state
  showGrid: boolean;
  toggleGrid: () => void;
  cameraLocked: boolean;
  toggleCameraLock: () => void;
  
  // Actions
  resetRoom: () => void;
  undo: () => void;
  redo: () => void;
  history: RoomState[];
  historyIndex: number;
}

const defaultWallColors: WallColors = {
  north: '#e8e4df',
  south: '#e8e4df',
  east: '#e8e4df',
  west: '#e8e4df',
};

export const useRoomStore = create<RoomState>()(
  persist(
    (set, get) => ({
      dimensions: null,
      setDimensions: (dimensions) => set({ dimensions }),
      
      openings: [],
      addOpening: (opening) => set((state) => ({
        openings: [...state.openings, opening],
      })),
      updateOpening: (id, updates) => set((state) => ({
        openings: state.openings.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      })),
      removeOpening: (id) => set((state) => ({
        openings: state.openings.filter((o) => o.id !== id),
      })),
      
      furniture: [],
      addFurniture: (item) => set((state) => ({
        furniture: [...state.furniture, { ...item, id: crypto.randomUUID() }],
      })),
      updateFurniture: (id, updates) => set((state) => ({
        furniture: state.furniture.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      })),
      removeFurniture: (id) => set((state) => ({
        furniture: state.furniture.filter((item) => item.id !== id),
        selectedFurnitureId: state.selectedFurnitureId === id ? null : state.selectedFurnitureId,
      })),
      selectedFurnitureId: null,
      selectFurniture: (id) => set({ selectedFurnitureId: id }),
      
      wallColors: defaultWallColors,
      setWallColor: (wall, color) => set((state) => ({
        wallColors: { ...state.wallColors, [wall]: color },
      })),
      floorColor: '#8b7355',
      setFloorColor: (floorColor) => set({ floorColor }),
      ceilingColor: '#ffffff',
      setCeilingColor: (ceilingColor) => set({ ceilingColor }),
      
      showGrid: true,
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      cameraLocked: false,
      toggleCameraLock: () => set((state) => ({ cameraLocked: !state.cameraLocked })),
      
      resetRoom: () => set({
        dimensions: null,
        openings: [],
        furniture: [],
        selectedFurnitureId: null,
        wallColors: defaultWallColors,
        floorColor: '#8b7355',
        ceilingColor: '#ffffff',
        showGrid: true,
        cameraLocked: false,
      }),
      
      // Placeholder for undo/redo - simplified for MVP
      undo: () => {},
      redo: () => {},
      history: [],
      historyIndex: -1,
    }),
    {
      name: 'room-designer-storage',
      partialize: (state) => ({
        dimensions: state.dimensions,
        openings: state.openings,
        furniture: state.furniture,
        wallColors: state.wallColors,
        floorColor: state.floorColor,
        ceilingColor: state.ceilingColor,
      }),
    }
  )
);

// Helper to convert between units
export const convertToMeters = (value: number, unit: Unit): number => {
  return unit === 'feet' ? value * 0.3048 : value;
};

export const convertFromMeters = (value: number, unit: Unit): number => {
  return unit === 'feet' ? value / 0.3048 : value;
};
