import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


// Returns response object
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image"
        })
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath) // Removes the locally saved file as the upload operation failed
        return null 
    }
}

const deleteOnCloudinary = async (oldCloudinaryPublicID) => {
    try {
        const response = await cloudinary.uploader.destroy(oldCloudinaryPublicID, { resource_type: "image" })
        return response
    } catch (error) {
        console.log(error)
        return null
    }
}

const getCloudinaryPublicId = (url) => {
    // Remove the base URL and file extension to get the public ID
    const parts = url.split("/");
    const publicIdWithExtension = parts.slice(-1)[0]; // Get the last part with the extension
    const publicId = publicIdWithExtension.split(".")[0]; // Remove the extension
    return publicId;
}


export {uploadOnCloudinary, deleteOnCloudinary, getCloudinaryPublicId}


















/*
Workflow
Node js has no native support for file handeling of multer is used as a middleware.
Multer uploads data on local server and then this data is uploaded to cloudibary
*/