
const multer = require("multer");

const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/webm",
]);

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024,
        files: 4,
        fields: 5,
        parts: 9,
    },
    fileFilter: (req, file, cb) => {
        if (!allowedTypes.has(file.mimetype)) {
            return cb(
                new Error(
                    "Only JPEG, PNG, WebP images and MP4, MOV, WebM videos are allowed."
                )
            );
        }

        cb(null, true);
    },
});

module.exports = upload;
