const MenuItem = require("../models/MenuItem");

exports.getMenu = async (req, res) => {
    try {
        const { category, search } = req.query;
        const filter = { isAvailable: true };

        if (category && category !== "All") {
            filter.category = category;
        }

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const items = await MenuItem.find(filter)
            .select("-__v")
            .sort({ category: 1, name: 1 });

        return res.status(200).json({
            count: items.length,
            items,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch menu items",
            error: error.message,
        });
    }
};

exports.getAllMenuItems = async (req, res) => {
    try {
        const items = await MenuItem.find()
            .select("-__v")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: items.length,
            items,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch all menu items",
            error: error.message,
        });
    }
};

exports.getMenuItemById = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id).select("-__v");
        if (!item) {
            return res.status(404).json({
                message: "Menu item not found",
            });
        }
        return res.status(200).json({ item });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch menu item",
            error: error.message,
        });
    }
};

exports.createMenuItem = async (req, res) => {
    try {
        const { name, description, category, price, imageUrl, totalStock, stockDate } = req.body;

        if (!name || !category || price == null || totalStock == null) {
            return res.status(400).json({
                message: "Required menu fields are missing",
            });
        }

        if (!Number.isFinite(price) || price < 0 || !Number.isInteger(totalStock) || totalStock < 0) {
            return res.status(400).json({
                message: "Invalid price or stock values",
            });
        }

        const item = await MenuItem.create({
            name: name.trim(),
            description: description ? description.trim() : "",
            category: category.trim(),
            price,
            imageUrl: imageUrl || "",
            totalStock,
            availableStock: totalStock,
            stockDate: stockDate || new Date().toISOString().slice(0, 10),
            updatedBy: req.user.id,
        });

        return res.status(201).json({
            message: "Menu item created successfully",
            item,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "A menu item with this name already exists",
            });
        }
        return res.status(500).json({
            message: "Failed to create menu item",
            error: error.message,
        });
    }
};

exports.updateStock = async (req, res) => {
    try {
        const { totalStock } = req.body;
        if (!Number.isInteger(totalStock) || totalStock < 0) {
            return res.status(400).json({
                message: "Stock must be a non-negative integer",
            });
        }

        const item = await MenuItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                message: "Menu item not found",
            });
        }

        const reservedOrSold = Math.max(0, item.totalStock - item.availableStock);
        if (totalStock < reservedOrSold) {
            return res.status(400).json({
                message: "Stock cannot be less than currently reserved/sold portions",
            });
        }

        item.totalStock = totalStock;
        item.availableStock = totalStock - reservedOrSold;
        item.updatedBy = req.user.id;

        await item.save();

        return res.status(200).json({
            message: "Stock updated successfully",
            item,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update stock",
            error: error.message,
        });
    }
};

exports.updateAvailability = async (req, res) => {
    try {
        const { isAvailable } = req.body;
        if (typeof isAvailable !== "boolean") {
            return res.status(400).json({
                message: "isAvailable must be true or false",
            });
        }

        const item = await MenuItem.findByIdAndUpdate(
            req.params.id,
            {
                isAvailable,
                updatedBy: req.user.id,
            },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({
                message: "Menu item not found",
            });
        }

        return res.status(200).json({
            message: "Availability updated successfully",
            item,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update availability",
            error: error.message,
        });
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({
                message: "Menu item not found",
            });
        }
        return res.status(200).json({
            message: "Menu item deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete menu item",
            error: error.message,
        });
    }
};