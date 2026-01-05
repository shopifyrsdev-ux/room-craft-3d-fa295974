import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileArchive, Download, Loader2, X, FileText, Image, Binary } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface UploadedFile {
  file: File;
  type: 'gltf' | 'bin' | 'texture';
}

const GltfToGlbConverter = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [converting, setConverting] = useState(false);
  const [glbBlob, setGlbBlob] = useState<Blob | null>(null);
  const [glbName, setGlbName] = useState('');
  const [open, setOpen] = useState(false);

  const getFileType = (file: File): 'gltf' | 'bin' | 'texture' => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'gltf') return 'gltf';
    if (ext === 'bin') return 'bin';
    return 'texture';
  };

  const handleFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      file,
      type: getFileType(file),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setGlbBlob(null);
    e.target.value = '';
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setGlbBlob(null);
  };

  const convertToGlb = async () => {
    const gltfFile = files.find((f) => f.type === 'gltf');
    if (!gltfFile) {
      toast.error('Please add a .gltf file');
      return;
    }

    setConverting(true);

    try {
      // Read GLTF JSON
      const gltfText = await gltfFile.file.text();
      const gltf = JSON.parse(gltfText);

      // Create a map of file names to their data
      const fileMap = new Map<string, ArrayBuffer>();
      
      for (const uploadedFile of files) {
        if (uploadedFile.type !== 'gltf') {
          const buffer = await uploadedFile.file.arrayBuffer();
          fileMap.set(uploadedFile.file.name, buffer);
        }
      }

      // Process buffers
      const bufferDatas: ArrayBuffer[] = [];
      let totalBufferLength = 0;

      if (gltf.buffers) {
        for (const buffer of gltf.buffers) {
          if (buffer.uri) {
            const bufferData = fileMap.get(buffer.uri);
            if (!bufferData) {
              throw new Error(`Missing buffer file: ${buffer.uri}`);
            }
            bufferDatas.push(bufferData);
            totalBufferLength += bufferData.byteLength;
          }
        }
      }

      // Process images - embed as base64 or buffer views
      if (gltf.images) {
        for (let i = 0; i < gltf.images.length; i++) {
          const image = gltf.images[i];
          if (image.uri && !image.uri.startsWith('data:')) {
            const imageData = fileMap.get(image.uri);
            if (imageData) {
              // Convert to base64 data URI
              const base64 = arrayBufferToBase64(imageData);
              const mimeType = getMimeType(image.uri);
              image.uri = `data:${mimeType};base64,${base64}`;
            } else {
              console.warn(`Missing image file: ${image.uri}`);
            }
          }
        }
      }

      // Combine all buffer data
      const combinedBuffer = new Uint8Array(totalBufferLength);
      let offset = 0;
      for (const bufferData of bufferDatas) {
        combinedBuffer.set(new Uint8Array(bufferData), offset);
        offset += bufferData.byteLength;
      }

      // Update GLTF to reference single buffer
      if (gltf.buffers && gltf.buffers.length > 0) {
        gltf.buffers = [{ byteLength: totalBufferLength }];
      }

      // Convert GLTF JSON to binary
      const gltfJsonString = JSON.stringify(gltf);
      const gltfJsonBuffer = new TextEncoder().encode(gltfJsonString);
      
      // Pad JSON to 4-byte alignment
      const jsonPadding = (4 - (gltfJsonBuffer.byteLength % 4)) % 4;
      const paddedJsonLength = gltfJsonBuffer.byteLength + jsonPadding;
      
      // Pad binary to 4-byte alignment
      const binPadding = (4 - (combinedBuffer.byteLength % 4)) % 4;
      const paddedBinLength = combinedBuffer.byteLength + binPadding;

      // GLB structure
      const headerLength = 12;
      const jsonChunkHeaderLength = 8;
      const binChunkHeaderLength = totalBufferLength > 0 ? 8 : 0;
      
      const totalLength = headerLength + 
                          jsonChunkHeaderLength + paddedJsonLength + 
                          (totalBufferLength > 0 ? binChunkHeaderLength + paddedBinLength : 0);

      const glbBuffer = new ArrayBuffer(totalLength);
      const dataView = new DataView(glbBuffer);
      const uint8View = new Uint8Array(glbBuffer);

      let writeOffset = 0;

      // GLB Header
      dataView.setUint32(writeOffset, 0x46546C67, true); // magic "glTF"
      writeOffset += 4;
      dataView.setUint32(writeOffset, 2, true); // version
      writeOffset += 4;
      dataView.setUint32(writeOffset, totalLength, true); // total length
      writeOffset += 4;

      // JSON Chunk Header
      dataView.setUint32(writeOffset, paddedJsonLength, true); // chunk length
      writeOffset += 4;
      dataView.setUint32(writeOffset, 0x4E4F534A, true); // chunk type "JSON"
      writeOffset += 4;

      // JSON Chunk Data
      uint8View.set(gltfJsonBuffer, writeOffset);
      writeOffset += gltfJsonBuffer.byteLength;
      // Add padding (spaces for JSON)
      for (let i = 0; i < jsonPadding; i++) {
        uint8View[writeOffset++] = 0x20;
      }

      // Binary Chunk (if exists)
      if (totalBufferLength > 0) {
        // Binary Chunk Header
        dataView.setUint32(writeOffset, paddedBinLength, true); // chunk length
        writeOffset += 4;
        dataView.setUint32(writeOffset, 0x004E4942, true); // chunk type "BIN\0"
        writeOffset += 4;

        // Binary Chunk Data
        uint8View.set(combinedBuffer, writeOffset);
        writeOffset += combinedBuffer.byteLength;
        // Add padding (zeros for BIN)
        for (let i = 0; i < binPadding; i++) {
          uint8View[writeOffset++] = 0x00;
        }
      }

      const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
      const baseName = gltfFile.file.name.replace(/\.gltf$/i, '');
      
      setGlbBlob(blob);
      setGlbName(baseName);
      toast.success('Conversion successful!');
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setConverting(false);
    }
  };

  const downloadGlb = () => {
    if (!glbBlob) return;
    const url = URL.createObjectURL(glbBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${glbName}.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetConverter = () => {
    setFiles([]);
    setGlbBlob(null);
    setGlbName('');
  };

  const gltfCount = files.filter((f) => f.type === 'gltf').length;
  const binCount = files.filter((f) => f.type === 'bin').length;
  const textureCount = files.filter((f) => f.type === 'texture').length;

  const getFileIcon = (type: 'gltf' | 'bin' | 'texture') => {
    switch (type) {
      case 'gltf':
        return <FileText className="w-3 h-3" />;
      case 'bin':
        return <Binary className="w-3 h-3" />;
      case 'texture':
        return <Image className="w-3 h-3" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7">
          <FileArchive className="w-3 h-3 mr-2" />
          Convert GLTF to GLB
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">GLTF to GLB Converter</DialogTitle>
          <DialogDescription className="text-xs">
            Add your .gltf file along with its .bin and texture files, then convert to a single .glb file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* File input */}
          <div className="space-y-2">
            <Label className="text-xs">Add Files</Label>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <span>
                  <FileArchive className="w-4 h-4 mr-2" />
                  Select Files (.gltf, .bin, textures)
                </span>
              </Button>
              <input
                type="file"
                multiple
                accept=".gltf,.bin,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleFilesSelect}
              />
            </label>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Files ({gltfCount} gltf, {binCount} bin, {textureCount} textures)
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={resetConverter}
                >
                  Clear all
                </Button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-secondary/30 rounded-lg">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-1.5 bg-background/50 rounded"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getFileIcon(f.type)}
                      <span className="truncate">{f.file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => removeFile(i)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Convert button */}
          <Button
            onClick={convertToGlb}
            disabled={gltfCount === 0 || converting}
            className="w-full"
            size="sm"
          >
            {converting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              'Convert to GLB'
            )}
          </Button>

          {/* Download result */}
          {glbBlob && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                ✓ Conversion complete: {glbName}.glb ({(glbBlob.size / 1024).toFixed(1)} KB)
              </p>
              <Button onClick={downloadGlb} variant="outline" size="sm" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download GLB
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

export default GltfToGlbConverter;
