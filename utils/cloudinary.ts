// utils/cloudinary.ts
export const uploadToCloudinary = async (imageUri: string) => {
  // Pulling securely from your .env file
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME; 
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary environment variables are missing.");
    return null;
  }

  const data = new FormData();
  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'urbis_upload.jpg',
  } as any);
  data.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: data,
    });
    
    const result = await response.json();
    return result.secure_url; 
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};