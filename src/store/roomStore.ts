import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Unit = 'meters' | 'feet';

export interface DesignData {
  dimensions: RoomDimensions | null;
  openings: Opening[];
  furniture: FurnitureItem[];
  wallColors: WallColors;
  wallTextures: WallTextures;
  floorColor: string;
  ceilingColor: string;
}

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

export interface FurnitureDimensions {
  width: number;  // x-axis
  height: number; // y-axis
  depth: number;  // z-axis
}

// Default dimensions for each furniture type (in meters)
export const DEFAULT_FURNITURE_DIMENSIONS: Record<string, FurnitureDimensions> = {
  bed: { width: 1.6, height: 1.0, depth: 2.0 },
  sofa: { width: 2.0, height: 0.8, depth: 0.85 },
  table: { width: 1.2, height: 0.75, depth: 0.8 },
  chair: { width: 0.45, height: 1.0, depth: 0.45 },
  wardrobe: { width: 1.5, height: 2.0, depth: 0.6 },
  decor: { width: 0.3, height: 0.6, depth: 0.3 },
  painting: { width: 0.8, height: 0.6, depth: 0.05 },
  fan: { width: 1.0, height: 0.5, depth: 1.0 },
};

export interface FurnitureItem {
  id: string;
  type: 'bed' | 'sofa' | 'table' | 'chair' | 'wardrobe' | 'decor' | 'painting' | 'fan';
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  wall?: 'north' | 'south' | 'east' | 'west'; // For wall-mounted items like paintings
  useCustomDimensions?: boolean;
  customDimensions?: FurnitureDimensions;
}

export type WallTexture = 'none' | 'brick' | 'wood' | 'wallpaper-stripe' | 'wallpaper-damask' | 'concrete';

export interface WallColors {
  north: string;
  south: string;
  east: string;
  west: string;
}

export interface WallTextures {
  north: WallTexture;
  south: WallTexture;
  east: WallTexture;
  west: WallTexture;
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
  wallTextures: WallTextures;
  setWallTexture: (wall: keyof WallTextures, texture: WallTexture) => void;
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
  loadDesign: (data: DesignData) => void;
  getDesignData: () => DesignData;
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

const defaultWallTextures: WallTextures = {
  north: 'none',
  south: 'none',
  east: 'none',
  west: 'none',
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
      wallTextures: defaultWallTextures,
      setWallTexture: (wall, texture) => set((state) => ({
        wallTextures: { ...state.wallTextures, [wall]: texture },
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
        wallTextures: defaultWallTextures,
        floorColor: '#8b7355',
        ceilingColor: '#ffffff',
        showGrid: true,
        cameraLocked: false,
      }),
      
      loadDesign: (data) => set({
        dimensions: data.dimensions,
        openings: data.openings,
        furniture: data.furniture,
        wallColors: data.wallColors,
        wallTextures: data.wallTextures,
        floorColor: data.floorColor,
        ceilingColor: data.ceilingColor,
        selectedFurnitureId: null,
      }),

      getDesignData: () => {
        const state = get();
        return {
          dimensions: state.dimensions,
          openings: state.openings,
          furniture: state.furniture,
          wallColors: state.wallColors,
          wallTextures: state.wallTextures,
          floorColor: state.floorColor,
          ceilingColor: state.ceilingColor,
        };
      },
      
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
        wallTextures: state.wallTextures,
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
