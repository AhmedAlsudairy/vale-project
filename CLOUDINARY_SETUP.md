# Cloudinary Setup Guide for LRS Thermography

## Steps to Configure Cloudinary:

### 1. Create a Cloudinary Account
- Go to https://cloudinary.com and sign up for a free account
- Navigate to your dashboard to get your credentials

### 2. Update Environment Variables
Edit your `.env.local` file with your Cloudinary credentials:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key_here  
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 3. Create Upload Preset
1. In your Cloudinary dashboard, go to Settings → Upload
2. Click "Upload presets" → "Add upload preset"
3. Set the preset name to: `lrs_thermography`
4. Set Upload mode to "Unsigned" 
5. Set Folder to: `lrs-thermography`
6. Enable the following transformations (optional):
   - Auto format: On
   - Auto quality: On
   - Max file size: 5MB
7. Save the preset

### 4. Optional: Configure Auto-transformations
In the upload preset settings, you can set automatic transformations like:
- Auto-resize images to reasonable dimensions
- Auto-compress for web optimization
- Auto-format conversion (WebP when supported)

### 5. Test Upload
After configuration, you should be able to:
- Upload multiple images in the LRS thermography form
- See uploaded images in a gallery format
- Set any uploaded image as preview
- Remove unwanted images

## Features Available:
- ✅ Multiple image upload
- ✅ Image gallery view
- ✅ Set preview image
- ✅ Remove images
- ✅ Auto-optimization via Cloudinary
- ✅ Secure upload with presets
- ✅ Fallback to legacy preset images

## Troubleshooting:
- If uploads fail, check your environment variables
- Make sure the upload preset is set to "Unsigned"
- Check browser console for any CORS errors
- Verify your Cloudinary account limits
