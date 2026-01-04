-- Create storage bucket for custom 3D models
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-models', 'custom-models', true);

-- Create RLS policies for the custom-models bucket
CREATE POLICY "Users can upload their own models"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'custom-models' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own models"
ON storage.objects
FOR SELECT
USING (bucket_id = 'custom-models' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own models"
ON storage.objects
FOR DELETE
USING (bucket_id = 'custom-models' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track custom models metadata
CREATE TABLE public.custom_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  placement_type TEXT NOT NULL CHECK (placement_type IN ('floor', 'wall', 'ceiling')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_models ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own custom models"
ON public.custom_models
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom models"
ON public.custom_models
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom models"
ON public.custom_models
FOR DELETE
USING (auth.uid() = user_id);