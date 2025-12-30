import { useRoomStore, FurnitureItem, WallColors, WallTextures, WallTexture, DEFAULT_FURNITURE_DIMENSIONS, FurnitureDimensions } from '@/store/roomStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, RotateCw } from 'lucide-react';
import { TEXTURE_OPTIONS } from '@/lib/wallTextures';

const PRESET_COLORS = [
  '#e8e4df', '#d4c4b0', '#b8a090', '#f5f5dc', '#e6d5b8',
  '#8b7355', '#654321', '#4a5568', '#2d3748', '#1a202c',
  '#ffffff', '#a0522d', '#deb887', '#d2691e', '#8b4513',
];

const PropertiesPanel = () => {
  const {
    selectedFurnitureId,
    furniture,
    updateFurniture,
    removeFurniture,
    selectFurniture,
    wallColors,
    setWallColor,
    wallTextures,
    setWallTexture,
    floorColor,
    setFloorColor,
  } = useRoomStore();

  const selectedItem = furniture.find((f) => f.id === selectedFurnitureId);

  const handleRotate = () => {
    if (!selectedItem) return;
    const newRotation: [number, number, number] = [
      selectedItem.rotation[0],
      selectedItem.rotation[1] + Math.PI / 4,
      selectedItem.rotation[2],
    ];
    updateFurniture(selectedItem.id, { rotation: newRotation });
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    removeFurniture(selectedItem.id);
  };

  const handleColorChange = (color: string) => {
    if (!selectedItem) return;
    updateFurniture(selectedItem.id, { color });
  };

  const handleToggleCustomDimensions = (checked: boolean) => {
    if (!selectedItem) return;
    const defaultDims = DEFAULT_FURNITURE_DIMENSIONS[selectedItem.type];
    updateFurniture(selectedItem.id, { 
      useCustomDimensions: checked,
      customDimensions: checked ? (selectedItem.customDimensions || defaultDims) : undefined
    });
  };

  const handleDimensionChange = (axis: keyof FurnitureDimensions, value: string) => {
    if (!selectedItem) return;
    const numValue = parseFloat(value) || 0.1;
    const defaultDims = DEFAULT_FURNITURE_DIMENSIONS[selectedItem.type];
    const currentDims = selectedItem.customDimensions || defaultDims;
    updateFurniture(selectedItem.id, {
      customDimensions: { ...currentDims, [axis]: Math.max(0.1, Math.min(10, numValue)) }
    });
  };

  const getDisplayDimensions = (): FurnitureDimensions | null => {
    if (!selectedItem) return null;
    if (selectedItem.useCustomDimensions && selectedItem.customDimensions) {
      return selectedItem.customDimensions;
    }
    return DEFAULT_FURNITURE_DIMENSIONS[selectedItem.type];
  };

  return (
    <div className="glass-panel p-4 w-72 h-full overflow-y-auto">
      <h2 className="font-display text-lg font-semibold mb-4 px-1">Properties</h2>

      {selectedItem ? (
        <div className="space-y-6">
          {/* Selected Item Info */}
          <div className="p-3 rounded-lg bg-secondary/50 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-medium">{selectedItem.name}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRotate}
                  className="h-8 w-8"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Custom Dimensions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Custom Dimensions</Label>
              <Switch
                checked={selectedItem.useCustomDimensions || false}
                onCheckedChange={handleToggleCustomDimensions}
              />
            </div>
            
            {(() => {
              const dims = getDisplayDimensions();
              if (!dims) return null;
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Width (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={dims.width}
                        onChange={(e) => handleDimensionChange('width', e.target.value)}
                        disabled={!selectedItem.useCustomDimensions}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Height (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={dims.height}
                        onChange={(e) => handleDimensionChange('height', e.target.value)}
                        disabled={!selectedItem.useCustomDimensions}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Depth (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={dims.depth}
                        onChange={(e) => handleDimensionChange('depth', e.target.value)}
                        disabled={!selectedItem.useCustomDimensions}
                        className="h-8"
                      />
                    </div>
                  </div>
                  {!selectedItem.useCustomDimensions && (
                    <p className="text-xs text-muted-foreground">Enable to customize</p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Object Color */}
          <div className="space-y-3">
            <Label className="text-sm">Object Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    selectedItem.color === color
                      ? 'border-primary scale-110'
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input
              type="color"
              value={selectedItem.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-10 w-full cursor-pointer"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Wall Colors & Textures */}
          <div className="space-y-3">
            <Label className="text-sm">Wall Appearance</Label>
            {(Object.keys(wallColors) as Array<keyof WallColors>).map((wall) => (
              <div key={wall} className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12 capitalize">
                    {wall}
                  </span>
                  <div className="flex gap-1 flex-1">
                    {PRESET_COLORS.slice(0, 5).map((color) => (
                      <button
                        key={color}
                        onClick={() => setWallColor(wall, color)}
                        className={`w-6 h-6 rounded-md border transition-all ${
                          wallColors[wall] === color
                            ? 'border-primary'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={wallColors[wall]}
                    onChange={(e) => setWallColor(wall, e.target.value)}
                    className="h-6 w-8 p-0 cursor-pointer"
                  />
                </div>
                <Select
                  value={wallTextures[wall]}
                  onValueChange={(value: WallTexture) => setWallTexture(wall, value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select texture" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEXTURE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Floor Color */}
          <div className="space-y-3">
            <Label className="text-sm">Floor Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.slice(5, 15).map((color) => (
                <button
                  key={color}
                  onClick={() => setFloorColor(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    floorColor === color
                      ? 'border-primary scale-110'
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input
              type="color"
              value={floorColor}
              onChange={(e) => setFloorColor(e.target.value)}
              className="h-10 w-full cursor-pointer"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Select a furniture item to edit its properties
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
