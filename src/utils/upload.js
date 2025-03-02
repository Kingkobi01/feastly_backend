const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require("streamifier");
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer (for handling file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Upload Image to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @returns {Promise<string>} - Uploaded image URL
 */
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "restaurants" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

module.exports = { upload, uploadToCloudinary };
