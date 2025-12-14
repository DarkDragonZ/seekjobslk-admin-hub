import { useEffect, useRef, useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabase } from '@/hooks/useSupabase';
import { toast } from '@/hooks/use-toast';
import { Company } from '@/types';

interface CompanyFormProps {
    company?: Company | null;
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Company, 'id'>) => Promise<void>;
}

const MAX_IMAGE_DIMENSION = 500;

async function resizeAndConvertToWebp(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });

    const largestDimension = Math.max(image.width, image.height);
    const scale = largestDimension > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestDimension : 1;
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not supported');

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
            if (result) {
                resolve(result);
            } else {
                reject(new Error('Image conversion failed'));
            }
        }, 'image/webp', 0.9);
    });

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const convertedFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' });
    const previewUrl = URL.createObjectURL(blob);

    return { convertedFile, previewUrl };
}

export default function CompanyForm({ company, open, onClose, onSubmit }: CompanyFormProps) {
    const { uploadFile, uploading } = useSupabase();
    const [formData, setFormData] = useState({ name: '', location: '', website: '', logo_url: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Populate form when editing
    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name,
                location: company.location ?? '',
                website: company.website ?? '',
                logo_url: company.logo_url ?? '',
            });
            setPreviewUrl(company.logo_url ?? '');
        } else {
            setFormData({ name: '', location: '', website: '', logo_url: '' });
            setPreviewUrl('');
        }
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [company, open]);

    // Clean up blob URLs
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { convertedFile, previewUrl: newPreview } = await resizeAndConvertToWebp(file);

            if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);

            setSelectedFile(convertedFile);
            setPreviewUrl(newPreview);
            setFormData((prev) => ({ ...prev, logo_url: '' }));
        } catch (error) {
            console.error('Image processing failed:', error);
            toast({
                title: 'Image processing failed',
                description: 'Unable to prepare the image. Please try another file.',
                variant: 'destructive'
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
        setSelectedFile(null);
        setFormData({ ...formData, logo_url: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsSubmitting(true);
        try {
            let logoUrl = formData.logo_url;

            if (selectedFile) {
                const uploadedUrl = await uploadFile(selectedFile, 'company-logos');
                if (uploadedUrl) logoUrl = uploadedUrl;
            }

            await onSubmit({
                name: formData.name.trim(),
                location: formData.location.trim() || null,
                website: formData.website.trim() || null,
                logo_url: logoUrl || null,
            });


            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{company ? 'Edit Company' : 'Add New Company'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Company Name */}
                <div>
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Tech Solutions Ltd"
                        required
                    />
                </div>

                {/* Website */}
                <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                    />
                </div>

                {/* Location */}
                <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Colombo, Sri Lanka"
                    />
                </div>

                {/* Logo */}
                <div>
                    <Label>Company Logo</Label>
                    <div className="mt-2">
                        {previewUrl || formData.logo_url ? (
                            <div className="relative inline-block">
                                <img
                                    src={previewUrl || formData.logo_url}
                                    alt="Logo preview"
                                    className="w-24 h-24 rounded-xl object-cover border border-border"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-2 transition-colors"
                            >
                                <Upload className="w-6 h-6 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Upload</span>
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            PNG or JPG up to 2MB. Changes apply after saving.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || uploading}>
                        {isSubmitting || uploading ? 'Saving...' : company ? 'Update' : 'Create'}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
