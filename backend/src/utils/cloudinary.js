import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a local file to Cloudinary and clean up the local temporary file
 * @param {string} localFilePath - Path of the file saved temporarily on local disk
 * @param {object} [options] - Optional Cloudinary upload options (e.g., folder, resource_type)
 * @returns {Promise<object|null>} - Cloudinary upload result object or null if failed
 */
export const uploadOnCloudinary = async (localFilePath, options = {}) => {
  try {
    if (!localFilePath) return null;

    // Check if the file actually exists before attempting upload
    if (!fs.existsSync(localFilePath)) {
      console.warn("File does not exist at path:", localFilePath);
      return null;
    }

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "skillbridge",
      ...options,
    });

    // File uploaded successfully, remove the local temporary file
    try {
      fs.unlinkSync(localFilePath);
    } catch (unlinkErr) {
      console.warn("Could not delete temporary file after upload:", unlinkErr.message);
    }

    return response;
  } catch (error) {
    // Clean up the local temporary file on failure
    if (localFilePath && fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkErr) {
        console.warn("Could not delete temporary file after error:", unlinkErr.message);
      }
    }
    console.error("Cloudinary upload error:", error.message || error);
    return null;
  }
};

/**
 * Delete an asset from Cloudinary by its public ID
 * @param {string} publicId - The Cloudinary public ID of the resource
 * @param {string} [resourceType="image"] - Resource type ("image", "raw", "video")
 * @returns {Promise<object|null>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return null;

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error.message || error);
    return null;
  }
};

export default uploadOnCloudinary;

