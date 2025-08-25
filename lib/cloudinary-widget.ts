// Cloudinary widget utilities
export const initCloudinaryWidget = (cloudName: string, uploadPreset: string) => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is already loaded
    if (typeof window !== 'undefined' && (window as any).cloudinary) {
      console.log('🔧 DEBUG - Cloudinary SDK already loaded')
      resolve((window as any).cloudinary)
      return
    }

    // Load Cloudinary script dynamically
    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.async = true
    
    script.onload = () => {
      console.log('🔧 DEBUG - Cloudinary script loaded successfully')
      if ((window as any).cloudinary) {
        resolve((window as any).cloudinary)
      } else {
        reject(new Error('Cloudinary SDK not available after loading script'))
      }
    }
    
    script.onerror = () => {
      console.error('🔧 DEBUG - Failed to load Cloudinary script')
      reject(new Error('Failed to load Cloudinary script'))
    }
    
    document.head.appendChild(script)
  })
}

export const createManualUploadWidget = (
  cloudName: string, 
  uploadPreset: string, 
  onSuccess: (result: any) => void, 
  onError: (error: any) => void
) => {
  return {
    open: async () => {
      try {
        const cloudinary = await initCloudinaryWidget(cloudName, uploadPreset)
        
        const widget = (cloudinary as any).createUploadWidget(
          {
            cloudName: cloudName,
            uploadPreset: uploadPreset,
            multiple: true,
            maxFiles: 10,
            resourceType: "image",
            clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
            maxFileSize: 5000000, // 5MB
            sources: ["local", "camera"],
          },
          (error: any, result: any) => {
            if (error) {
              console.error('🔧 DEBUG - Upload widget error:', error)
              onError(error)
            } else if (result.event === 'success') {
              console.log('🔧 DEBUG - Upload widget success:', result)
              onSuccess(result)
            }
          }
        )
        
        widget.open()
      } catch (error) {
        console.error('🔧 DEBUG - Failed to create upload widget:', error)
        onError(error)
      }
    }
  }
}
