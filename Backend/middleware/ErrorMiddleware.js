
const multer = require("multer");

module.exports = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            message: "File upload failed",
            error: err.code,
        });
    }

    if (err.message?.includes("Only JPEG")) {
        return res.status(400).json({
            message: err.message,
        });
    }

    console.error(err);

    return res.status(err.status || 500).json({
        message:
            err.status && err.status < 500
                ? err.message
                : "Internal server error",
    });
};
