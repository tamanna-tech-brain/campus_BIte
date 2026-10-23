const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/ComplaintController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/Validate");
const upload = require("../middleware/UploadMiddleware");

const {
    createComplaintSchema,
    complaintIdSchema,
    updateComplaintStatusSchema,
    complaintQuerySchema,
} = require("../validators/complaintValidator");

router.use(protect);

// Students submit complaints, optionally with evidence.
router.post(
    "/",
    authorize("student"),
    upload.array("evidence", 4),
    validate(createComplaintSchema, "body"),
    complaintController.createComplaint
);

// Student view their complaints
router.get(
    "/my",
    authorize("student"),
    validate(complaintQuerySchema, "query"),
    complaintController.getMyComplaints
);

// Staff/admin complaint queue
router.get(
    "/",
    authorize("staff", "admin"),
    validate(complaintQuerySchema, "query"),
    complaintController.getAllComplaints
);

// View one complaint
router.get(
    "/:id",
    validate(complaintIdSchema, "params"),
    complaintController.getComplaintById
);

// Staff/admin update status
router.patch(
    "/:id/status",
    authorize("staff", "admin"),
    validate(complaintIdSchema, "params"),
    validate(updateComplaintStatusSchema, "body"),
    complaintController.updateComplaintStatus
);

module.exports = router;
