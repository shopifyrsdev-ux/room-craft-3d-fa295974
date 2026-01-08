import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore, DesignData } from '@/store/roomStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Grid3X3, 
  Undo2, 
  Redo2, 
  RotateCcw, 
  Save,
  FolderOpen,
  Box,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  User,
  Magnet,
} from 'lucide-react';
import { toast } from 'sonner';
import SaveDesignDialog from '@/components/dialogs/SaveDesignDialog';
import LoadDesignDialog from '@/components/dialogs/LoadDesignDialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface ToolbarProps {
  onExit: () => void;
}

const Toolbar = ({ onExit }: ToolbarProps) => {
  const { 
    showGrid, 
    toggleGrid, 
    cameraLocked,
    toggleCameraLock,
    resetRoom,
    furniture,
    dimensions,
    getDesignData,
    loadDesign,
    undo,
    redo,
    canUndo,
    canRedo,
    snapSettings,
    setSnapEnabled,
    setSnapGridSize,
    setSnapPresets,
  } = useRoomStore();

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (name: string) => {
    if (!user) {
      toast.error('Please sign in to save designs');
      return;
    }

    setSaving(true);
    const designData = getDesignData();

    const { error } = await supabase
      .from('room_designs')
      .insert([{
        user_id: user.id,
        name,
        design_data: JSON.parse(JSON.stringify(designData)),
      }]);

    if (error) {
      toast.error('Failed to save design');
    } else {
      toast.success('Design saved!');
      setSaveDialogOpen(false);
    }
    setSaving(false);
  };

  const handleLoad = (data: unknown) => {
    loadDesign(data as DesignData);
  };

  const handleReset = () => {
    if (furniture.length > 0) {
      if (confirm('Are you sure you want to reset? All furniture will be removed.')) {
        resetRoom();
        toast.info('Room reset to defaults');
      }
    } else {
      resetRoom();
      toast.info('Room reset to defaults');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
  };

  return (
    <>
      <div className="glass-panel px-4 py-2 flex items-center gap-2">
        {/* Logo / Exit */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onExit}
          className="gap-2 mr-4"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Box className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">RoomForge</span>
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Grid Toggle */}
        <Button
          variant={showGrid ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleGrid}
          className="gap-2"
        >
          <Grid3X3 className="w-4 h-4" />
          Grid
        </Button>

        {/* Camera Lock Toggle */}
        <Button
          variant={cameraLocked ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleCameraLock}
          className="gap-2"
          title={cameraLocked ? 'Unlock camera to rotate/pan view' : 'Lock camera to drag furniture'}
        >
          {cameraLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {cameraLocked ? 'Unlock' : 'Lock'}
        </Button>

        {/* Snap Toggle */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={snapSettings.enabled ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2"
              title="Snap settings for wall-mounted items"
            >
              <Magnet className="w-4 h-4" />
              Snap
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="snap-enabled" className="text-sm font-medium">Enable Snapping</Label>
                <Switch
                  id="snap-enabled"
                  checked={snapSettings.enabled}
                  onCheckedChange={setSnapEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="snap-presets" className="text-sm">Preset Points</Label>
                  <Switch
                    id="snap-presets"
                    checked={snapSettings.presets}
                    onCheckedChange={setSnapPresets}
                    disabled={!snapSettings.enabled}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Snap to top, middle, bottom of wall</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Grid Size</Label>
                  <span className="text-xs text-muted-foreground">{snapSettings.gridSize}m</span>
                </div>
                <Slider
                  value={[snapSettings.gridSize]}
                  onValueChange={([value]) => setSnapGridSize(value)}
                  min={0.1}
                  max={0.5}
                  step={0.05}
                  disabled={!snapSettings.enabled}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-border" />

        {/* Undo/Redo */}
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={!canUndo()} 
          onClick={undo}
          className="h-8 w-8"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={!canRedo()} 
          onClick={redo}
          className="h-8 w-8"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Reset */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>

        <div className="flex-1" />

        {/* Room Info */}
        {dimensions && (
          <div className="text-xs text-muted-foreground mr-4">
            {dimensions.width} × {dimensions.length} × {dimensions.height} {dimensions.unit}
          </div>
        )}

        {/* Auth & Save/Load */}
        {user ? (
          <>
            {/* Load */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoadDialogOpen(true)}
              className="gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Load
            </Button>

            {/* Save */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              className="gap-2 btn-glow"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/auth')}
            className="gap-2 btn-glow"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Save
          </Button>
        )}
      </div>

      <SaveDesignDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSave}
        loading={saving}
      />

      <LoadDesignDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        onLoad={handleLoad}
      />
    </>
  );
};

export default Toolbar;
