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

// Snapshot for undo/redo
interface HistorySnapshot {
  dimensions: RoomDimensions | null;
  openings: Opening[];
  furniture: FurnitureItem[];
  wallColors: WallColors;
  wallTextures: WallTextures;
  floorColor: string;
  ceilingColor: string;
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
  
  // Undo/Redo
  history: HistorySnapshot[];
  historyIndex: number;
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
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

const MAX_HISTORY = 50;

const createSnapshot = (state: RoomState): HistorySnapshot => ({
  dimensions: state.dimensions ? { ...state.dimensions } : null,
  openings: JSON.parse(JSON.stringify(state.openings)),
  furniture: JSON.parse(JSON.stringify(state.furniture)),
  wallColors: { ...state.wallColors },
  wallTextures: { ...state.wallTextures },
  floorColor: state.floorColor,
  ceilingColor: state.ceilingColor,
});

export const useRoomStore = create<RoomState>()(
  persist(
    (set, get) => ({
      dimensions: null,
      setDimensions: (dimensions) => {
        get().saveToHistory();
        set({ dimensions });
      },
      
      openings: [],
      addOpening: (opening) => {
        get().saveToHistory();
        set((state) => ({
          openings: [...state.openings, opening],
        }));
      },
      updateOpening: (id, updates) => {
        get().saveToHistory();
        set((state) => ({
          openings: state.openings.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        }));
      },
      removeOpening: (id) => {
        get().saveToHistory();
        set((state) => ({
          openings: state.openings.filter((o) => o.id !== id),
        }));
      },
      
      furniture: [],
      addFurniture: (item) => {
        get().saveToHistory();
        set((state) => ({
          furniture: [...state.furniture, { ...item, id: crypto.randomUUID() }],
        }));
      },
      updateFurniture: (id, updates) => {
        // Don't save to history for position updates (too frequent during drag)
        set((state) => ({
          furniture: state.furniture.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },
      removeFurniture: (id) => {
        get().saveToHistory();
        set((state) => ({
          furniture: state.furniture.filter((item) => item.id !== id),
          selectedFurnitureId: state.selectedFurnitureId === id ? null : state.selectedFurnitureId,
        }));
      },
      selectedFurnitureId: null,
      selectFurniture: (id) => set({ selectedFurnitureId: id }),
      
      wallColors: defaultWallColors,
      setWallColor: (wall, color) => {
        get().saveToHistory();
        set((state) => ({
          wallColors: { ...state.wallColors, [wall]: color },
        }));
      },
      wallTextures: defaultWallTextures,
      setWallTexture: (wall, texture) => {
        get().saveToHistory();
        set((state) => ({
          wallTextures: { ...state.wallTextures, [wall]: texture },
        }));
      },
      floorColor: '#8b7355',
      setFloorColor: (floorColor) => {
        get().saveToHistory();
        set({ floorColor });
      },
      ceilingColor: '#ffffff',
      setCeilingColor: (ceilingColor) => {
        get().saveToHistory();
        set({ ceilingColor });
      },
      
      showGrid: true,
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      cameraLocked: false,
      toggleCameraLock: () => set((state) => ({ cameraLocked: !state.cameraLocked })),
      
      // Reset keeps dimensions but clears everything else
      resetRoom: () => {
        get().saveToHistory();
        set((state) => ({
          openings: [],
          furniture: [],
          selectedFurnitureId: null,
          wallColors: defaultWallColors,
          wallTextures: defaultWallTextures,
          floorColor: '#8b7355',
          ceilingColor: '#ffffff',
        }));
      },
      
      loadDesign: (data) => {
        get().saveToHistory();
        set({
          dimensions: data.dimensions,
          openings: data.openings,
          furniture: data.furniture,
          wallColors: data.wallColors,
          wallTextures: data.wallTextures,
          floorColor: data.floorColor,
          ceilingColor: data.ceilingColor,
          selectedFurnitureId: null,
        });
      },

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
      
      // Undo/Redo implementation
      history: [],
      historyIndex: -1,
      
      saveToHistory: () => {
        const state = get();
        const snapshot = createSnapshot(state);
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(snapshot);
        
        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },
      
      undo: () => {
        const state = get();
        if (state.historyIndex < 0) return;
        
        const snapshot = state.history[state.historyIndex];
        set({
          dimensions: snapshot.dimensions,
          openings: snapshot.openings,
          furniture: snapshot.furniture,
          wallColors: snapshot.wallColors,
          wallTextures: snapshot.wallTextures,
          floorColor: snapshot.floorColor,
          ceilingColor: snapshot.ceilingColor,
          historyIndex: state.historyIndex - 1,
          selectedFurnitureId: null,
        });
      },
      
      redo: () => {
        const state = get();
        if (state.historyIndex >= state.history.length - 1) return;
        
        const nextIndex = state.historyIndex + 1;
        const snapshot = state.history[nextIndex];
        
        // For redo, we need to look at the NEXT state after snapshot
        // Since snapshot represents state BEFORE the action, redo should apply the action
        // But our history stores pre-action states, so redo goes to index+1 and applies that post state
        if (nextIndex + 1 < state.history.length) {
          const nextSnapshot = state.history[nextIndex + 1];
          set({
            dimensions: nextSnapshot.dimensions,
            openings: nextSnapshot.openings,
            furniture: nextSnapshot.furniture,
            wallColors: nextSnapshot.wallColors,
            wallTextures: nextSnapshot.wallTextures,
            floorColor: nextSnapshot.floorColor,
            ceilingColor: nextSnapshot.ceilingColor,
            historyIndex: nextIndex + 1,
            selectedFurnitureId: null,
          });
        }
      },
      
      canUndo: () => get().historyIndex >= 0,
      canRedo: () => get().historyIndex < get().history.length - 2,
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
