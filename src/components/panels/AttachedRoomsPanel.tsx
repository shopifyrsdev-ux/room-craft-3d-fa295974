import { useRoomStore, AttachedRoom, AttachableWall, convertToMeters } from '@/store/roomStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bath, ChefHat, Trash2 } from 'lucide-react';

const WALL_OPTIONS: { value: AttachableWall; label: string }[] = [
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
];

const AttachedRoomsPanel = () => {
  const { 
    dimensions, 
    attachedRooms, 
    addAttachedRoom, 
    updateAttachedRoom, 
    removeAttachedRoom 
  } = useRoomStore();

  const hasBathroom = attachedRooms.some(r => r.type === 'bathroom');
  const hasKitchen = attachedRooms.some(r => r.type === 'kitchen');
  const bathroom = attachedRooms.find(r => r.type === 'bathroom');
  const kitchen = attachedRooms.find(r => r.type === 'kitchen');

  const roomHeight = dimensions 
    ? convertToMeters(dimensions.height, dimensions.unit) 
    : 2.5;

  const handleToggleBathroom = (checked: boolean) => {
    if (checked) {
      // Find an available wall
      const usedWalls = attachedRooms.map(r => r.wall);
      const availableWall = WALL_OPTIONS.find(w => !usedWalls.includes(w.value))?.value || 'east';
      
      addAttachedRoom({
        type: 'bathroom',
        wall: availableWall,
        width: 2.5,
        length: 2,
        height: roomHeight,
      });
    } else {
      removeAttachedRoom('bathroom');
    }
  };

  const handleToggleKitchen = (checked: boolean) => {
    if (checked) {
      const usedWalls = attachedRooms.map(r => r.wall);
      const availableWall = WALL_OPTIONS.find(w => !usedWalls.includes(w.value))?.value || 'west';
      
      addAttachedRoom({
        type: 'kitchen',
        wall: availableWall,
        width: 3,
        length: 2.5,
        height: roomHeight,
      });
    } else {
      removeAttachedRoom('kitchen');
    }
  };

  const getAvailableWalls = (currentRoom: 'bathroom' | 'kitchen') => {
    const otherRoom = attachedRooms.find(r => r.type !== currentRoom);
    if (!otherRoom) return WALL_OPTIONS;
    return WALL_OPTIONS.filter(w => w.value !== otherRoom.wall);
  };

  const renderRoomConfig = (room: AttachedRoom, type: 'bathroom' | 'kitchen') => (
    <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-primary/10">
      <div className="flex items-center gap-2">
        {type === 'bathroom' ? (
          <Bath className="w-4 h-4 text-primary" />
        ) : (
          <ChefHat className="w-4 h-4 text-primary" />
        )}
        <span className="font-medium text-sm capitalize">{type}</span>
      </div>
      
      <div className="space-y-2">
        <div>
          <Label className="text-xs text-muted-foreground">Attach to Wall</Label>
          <Select
            value={room.wall}
            onValueChange={(value: AttachableWall) => updateAttachedRoom(type, { wall: value })}
          >
            <SelectTrigger className="h-8 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getAvailableWalls(type).map((wall) => (
                <SelectItem key={wall.value} value={wall.value}>
                  {wall.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Width (m)</Label>
            <Input
              type="number"
              step="0.5"
              min="1.5"
              max="6"
              value={room.width}
              onChange={(e) => updateAttachedRoom(type, { 
                width: Math.max(1.5, Math.min(6, parseFloat(e.target.value) || 2)) 
              })}
              className="h-8 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Length (m)</Label>
            <Input
              type="number"
              step="0.5"
              min="1.5"
              max="6"
              value={room.length}
              onChange={(e) => updateAttachedRoom(type, { 
                length: Math.max(1.5, Math.min(6, parseFloat(e.target.value) || 2)) 
              })}
              className="h-8 mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Attached Rooms</h3>
      
      {/* Bathroom toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-transparent hover:border-primary/20 transition-colors">
        <div className="flex items-center gap-2">
          <Bath className="w-4 h-4" />
          <span className="text-sm">Bathroom</span>
        </div>
        <Switch
          checked={hasBathroom}
          onCheckedChange={handleToggleBathroom}
        />
      </div>
      
      {bathroom && renderRoomConfig(bathroom, 'bathroom')}

      {/* Kitchen toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-transparent hover:border-primary/20 transition-colors">
        <div className="flex items-center gap-2">
          <ChefHat className="w-4 h-4" />
          <span className="text-sm">Kitchen</span>
        </div>
        <Switch
          checked={hasKitchen}
          onCheckedChange={handleToggleKitchen}
        />
      </div>
      
      {kitchen && renderRoomConfig(kitchen, 'kitchen')}

      {attachedRooms.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Toggle to add a bathroom or kitchen attached to your main room.
        </p>
      )}
    </div>
  );
};

export default AttachedRoomsPanel;