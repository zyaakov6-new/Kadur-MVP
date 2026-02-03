import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';

export const useImageUpload = () => {
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                return result.assets[0];
            }
            return null;
        } catch (error) {
            console.error('Error picking image:', error);
            return null;
        }
    };

    const uploadImage = async (base64Image: string, userId: string) => {
        try {
            setUploading(true);
            const filePath = `${userId}/${new Date().getTime()}.jpg`;
            const contentType = 'image/jpeg';

            const { error } = await supabase.storage
                .from('avatars')
                .upload(filePath, decode(base64Image), {
                    contentType,
                    upsert: true,
                });

            if (error) throw error;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    return {
        pickImage,
        uploadImage,
        uploading,
    };
};
