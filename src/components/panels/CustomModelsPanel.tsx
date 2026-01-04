import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Upload, Trash2, Box, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRoomStore, convertToMeters } from '@/store/roomStore';
import { toast } from 'sonner';

interface CustomModel {
  id: string;
  name: string;
  file_path: string;
  placement_type: 'floor' | 'wall' | 'ceiling';
}

const CustomModelsPanel = () => {
  const { user } = useAuth();
  const { addCustomModel, dimensions } = useRoomStore();
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [uploading, setUploading] = useState(false);
  const [modelName, setModelName] = useState('');
  const [placementType, setPlacementType] = useState<'floor' | 'wall' | 'ceiling'>('floor');
  const [loading, setLoading] = useState(true);

  // Fetch user's custom models
  useEffect(() => {
    if (!user) {
      setCustomModels([]);
      setLoading(false);
      return;
    }

    const fetchModels = async () => {
      const { data, error } = await supabase
        .from('custom_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching custom models:', error);
        toast.error('Failed to load custom models');
      } else {
        setCustomModels(data as CustomModel[]);
      }
      setLoading(false);
    };

    fetchModels();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validExtensions = ['.glb', '.gltf'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Only GLB/GLTF files are supported');
      return;
    }

    // Validate name
    const name = modelName.trim() || file.name.replace(/\.(glb|gltf)$/i, '');
    if (!name) {
      toast.error('Please enter a model name');
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('custom-models')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { data, error: dbError } = await supabase
        .from('custom_models')
        .insert({
          user_id: user.id,
          name,
          file_path: filePath,
          placement_type: placementType,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setCustomModels((prev) => [data as CustomModel, ...prev]);
      setModelName('');
      toast.success('Model uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload model');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteModel = async (model: CustomModel) => {
    if (!user) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('custom-models')
        .remove([model.file_path]);

      // Delete from database
      await supabase
        .from('custom_models')
        .delete()
        .eq('id', model.id);

      setCustomModels((prev) => prev.filter((m) => m.id !== model.id));
      toast.success('Model deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete model');
    }
  };

  const handleAddToRoom = async (model: CustomModel) => {
    if (!dimensions) {
      toast.error('Please set up room dimensions first');
      return;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('custom-models')
      .getPublicUrl(model.file_path);

    const height = convertToMeters(dimensions.height, dimensions.unit);

    // Position based on placement type
    let position: [number, number, number];
    let wall: 'north' | 'south' | 'east' | 'west' | undefined;

    switch (model.placement_type) {
      case 'ceiling':
        position = [0, height - 0.3, 0];
        break;
      case 'wall':
        position = [0, 1.5, 0];
        wall = 'north';
        break;
      default:
        position = [0, 0, 0];
    }

    addCustomModel({
      name: model.name,
      modelUrl: data.publicUrl,
      placementType: model.placement_type,
      position,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      wall,
    });

    toast.success(`${model.name} added to room`);
  };

  if (!user) {
    return (
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Custom Models</h3>
        <p className="text-xs text-muted-foreground">
          Sign in to upload and use custom 3D models (GLB/GLTF).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">Custom Models</h3>

      {/* Upload section */}
      <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="model-name" className="text-xs">Model Name</Label>
          <Input
            id="model-name"
            placeholder="Enter model name..."
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Placement Type</Label>
          <RadioGroup
            value={placementType}
            onValueChange={(v) => setPlacementType(v as 'floor' | 'wall' | 'ceiling')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="floor" id="floor" />
              <Label htmlFor="floor" className="text-xs cursor-pointer">Floor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wall" id="wall" />
              <Label htmlFor="wall" className="text-xs cursor-pointer">Wall</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ceiling" id="ceiling" />
              <Label htmlFor="ceiling" className="text-xs cursor-pointer">Ceiling</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="pt-2">
          <label className="cursor-pointer">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={uploading}
              asChild
            >
              <span>
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Upload GLB/GLTF'}
              </span>
            </Button>
            <input
              type="file"
              accept=".glb,.gltf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <Separator />

      {/* Models list */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Your Models</Label>
        
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : customModels.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No custom models uploaded yet.
          </p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {customModels.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <button
                  onClick={() => handleAddToRoom(model)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <Box className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{model.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {model.placement_type}
                    </p>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteModel(model)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomModelsPanel;