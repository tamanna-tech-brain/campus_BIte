
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const Order = require("../models/Order");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (file) => {
    const resourceType = file.mimetype.startsWith("video/")
        ? "video"
        : "image";

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "campusbite/complaints",
                resource_type: resourceType,
                unique_filename: true,
                overwrite: false,
            },
            (error, result) => {
                if (error) return reject(error);

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    resourceType,
                    format: result.format,
                    bytes: result.bytes,
                });
            }
        );

        stream.end(file.buffer);
    });
};

const deleteCloudinaryAsset = async (asset) => {
    try {
        await cloudinary.uploader.destroy(asset.publicId, {
            resource_type: asset.resourceType,
            invalidate: true,
        });
    } catch (error) {
        console.error("Cloudinary cleanup failed:", error.message);
    }
};

const cleanupAssets = async (assets) => {
    await Promise.all(assets.map(deleteCloudinaryAsset));
};

// Student: submit complaint and optional evidence
exports.createComplaint = async (req, res, next) => {
    const uploadedAssets = [];

    try {
        const { category, description, orderId } = req.body;

        if (orderId) {
            if (!mongoose.isValidObjectId(orderId)) {
                return res.status(400).json({
                    message: "Invalid order ID",
                });
            }

            const order = await Order.findOne({
                _id: orderId,
                student: req.user.id,
            });

            if (!order) {
                return res.status(404).json({
                    message: "Order not found for this student",
                });
            }
        }

        const files = req.files || [];

        // Upload the evidence to Cloudinary.
        for (const file of files) {
            const asset = await uploadToCloudinary(file);
            uploadedAssets.push(asset);
        }

        const complaint = await Complaint.create({
            student: req.user.id,
            order: orderId || null,
            category,
            description,
            attachments: uploadedAssets,
            status: "open",
            statusHistory: [
                {
                    status: "open",
                    changedBy: req.user.id,
                    note: "Complaint submitted",
                },
            ],
        });

        return res.status(201).json({
            message: "Complaint submitted successfully",
            complaint,
        });
    } catch (error) {
        // Avoid orphaned cloud files if saving the complaint fails.
        await cleanupAssets(uploadedAssets);
        next(error);
    }
};

// Student: get their own complaints
exports.getMyComplaints = async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);

        const [complaints, total] = await Promise.all([
            Complaint.find({ student: req.user.id })
                .populate("order", "orderNumber status")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),

            Complaint.countDocuments({ student: req.user.id }),
        ]);

        return res.status(200).json({
            complaints,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

// Student owner, staff, or admin: view one complaint
exports.getComplaintById = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate("student", "name email")
            .populate("order", "orderNumber status totalAmount")
            .populate("assignedTo", "name email")
            .populate("statusHistory.changedBy", "name role");

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        const isStaff =
            ["staff", "admin"].includes(req.user.role);

        const isOwner =
            complaint.student._id.toString() === req.user.id;

        if (!isStaff && !isOwner) {
            return res.status(403).json({
                message: "You cannot view this complaint",
            });
        }

        return res.status(200).json({ complaint });
    } catch (error) {
        next(error);
    }
};

// Staff/admin: list complaints, optionally filter by status
exports.getAllComplaints = async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);
        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const [complaints, total] = await Promise.all([
            Complaint.find(filter)
                .populate("student", "name email")
                .populate("order", "orderNumber status")
                .populate("assignedTo", "name email")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),

            Complaint.countDocuments(filter),
        ]);

        return res.status(200).json({
            complaints,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

// Staff/admin: update complaint status
exports.updateComplaintStatus = async (req, res, next) => {
    try {
        const { status, resolutionNote = "" } = req.body;

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        const allowedTransitions = {
            open: ["in_review"],
            in_review: ["resolved", "rejected"],
            resolved: [],
            rejected: [],
        };

        if (!allowedTransitions[complaint.status].includes(status)) {
            return res.status(400).json({
                message: `Cannot change complaint from ${complaint.status} to ${status}`,
            });
        }

        if (
            ["resolved", "rejected"].includes(status) &&
            !resolutionNote.trim()
        ) {
            return res.status(400).json({
                message: "A resolution note is required",
            });
        }

        complaint.status = status;
        complaint.resolutionNote = resolutionNote;
        complaint.assignedTo =
            complaint.assignedTo || req.user.id;

        if (status === "resolved" || status === "rejected") {
            complaint.resolvedAt = new Date();
        }

        complaint.statusHistory.push({
            status,
            changedBy: req.user.id,
            note: resolutionNote || `Status changed to ${status}`,
            changedAt: new Date(),
        });

        await complaint.save();

        return res.status(200).json({
            message: "Complaint status updated",
            complaint,
        });
    } catch (error) {
        next(error);
    }
};
