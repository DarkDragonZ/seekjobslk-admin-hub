import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function useSupabase() {
    const [uploading, setUploading] = useState(false);

    const uploadFile = async (file: File, folder = 'images'): Promise<string | null> => {
        setUploading(true);
        try {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${folder}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('company-logos')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('company-logos')
                .getPublicUrl(filePath);

            if (!urlData?.publicUrl) throw new Error('Missing public URL');

            return urlData.publicUrl;
        } catch (error) {
            console.error('Supabase upload error:', error);
            toast({ title: 'Upload failed', description: 'Could not upload file', variant: 'destructive' });
            return null;
        } finally {
            setUploading(false);
        }
    };

    return { uploading, uploadFile };
}
