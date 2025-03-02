const cloudinary = require("../config/cloudinary");

// Upload an image to Cloudinary
const uploadImage = async (imagePath) => {
    try {
        const result = await cloudinary.uploader.upload(imagePath, { folder: "restaurants" });
        return result.secure_url;
    } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        throw new Error("Image upload failed");
    }
};

// Delete an image from Cloudinary
const deleteImage = async (imageUrl) => {
    try {
        if (!imageUrl) return;
        const publicId = extractPublicId(imageUrl);
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
    }
};

// Extract Cloudinary public ID from an image URL
const extractPublicId = (imageUrl) => {
    if (!imageUrl) return null;
    const parts = imageUrl.split("/");
    return parts[parts.length - 1].split(".")[0]; // Extract ID before file extension
};

module.exports = { uploadImage, deleteImage };
