import imageCompression from 'browser-image-compression';

export const ImageUtils = {
    /**
     * Compresses an image file and converts it to WebP format.
     * Maintains quality while reducing file size significantly.
     */
    async compressImage(file: File, maxWidthOrHeight = 1024): Promise<File> {
        const options = {
            maxSizeMB: 0.8, // Aim for under 800KB
            maxWidthOrHeight: maxWidthOrHeight,
            useWebWorker: true,
            fileType: 'image/webp', // Convert to WebP for better compression
        };

        try {
            console.log(`originalFile size: ${file.size / 1024 / 1024} MB`);
            const compressedFile = await imageCompression(file, options);
            console.log(`compressedFile size: ${compressedFile.size / 1024 / 1024} MB`);
            return compressedFile;
        } catch (error) {
            console.error('Image compression failed:', error);
            // If compression fails, return the original file as a fallback
            return file;
        }
    },

    /**
     * Converts a File object to a Base64 string for easier handling with current FirebaseService.
     */
    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    }
};
