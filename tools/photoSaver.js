import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import imageType from "image-type"; // Security check for image buffer

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"];

/**
 * Saves a Base64-encoded image safely.
 * @param {string} base64String - Base64-encoded image string
 * @returns {Promise<string>} - The saved filename
 */
const savePhoto = async (base64String) => {
    return new Promise((resolve, reject) => {
        try {
            // Ensure public/imgs/ exists
            const uploadDir = path.join(process.cwd(), "public", "imgs");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Validate Base64 format
            const matches = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
            if (!matches) {
                return reject(new Error("Invalid Base64 format"));
            }

            const mimeType = matches[1];
            if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
                return reject(new Error("Unsupported file type"));
            }

            // Decode Base64 to Buffer
            const buffer = Buffer.from(matches[2], "base64");

            // Security check: Ensure buffer is an actual image
            const detectedType = imageType(buffer);
            if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
                return reject(new Error("Invalid or corrupted image file"));
            }

            // File size limit
            if (buffer.length > MAX_FILE_SIZE) {
                return reject(new Error("File too large (Max: 5MB)"));
            }

            // Generate secure file name
            const fileName = `${uuidv4()}.${detectedType.ext}`;
            const filePath = path.join(uploadDir, fileName);

            // Save file
            fs.writeFile(filePath, buffer, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve(fileName);
            });
        } catch (error) {
            reject(error);
        }
    });
};

export default savePhoto;
