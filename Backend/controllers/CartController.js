const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");

exports.getCart = async (req, res) => {
    try {
        let cartDoc = await Cart.findOne({
            student: req.user.id,
        }).populate("items.menuItem");

        if (!cartDoc) {
            cartDoc = await Cart.create({
                student: req.user.id,
                items: [],
            });
        }

        return res.status(200).json({
            cart: cartDoc,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch cart",
            error: error.message,
        });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { menuItemId, quantity } = req.body;

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be a positive integer",
            });
        }

        const item = await MenuItem.findById(menuItemId);
        if (!item || !item.isAvailable) {
            return res.status(404).json({
                message: "Menu item is unavailable or does not exist",
            });
        }

        if (item.availableStock < quantity) {
            return res.status(400).json({
                message: `Insufficient stock. Only ${item.availableStock} available`,
            });
        }

        let cartDoc = await Cart.findOne({
            student: req.user.id,
        });

        if (!cartDoc) {
            cartDoc = await Cart.create({
                student: req.user.id,
                items: [],
            });
        }

        const existingItemIndex = cartDoc.items.findIndex(
            (entry) => entry.menuItem.toString() === menuItemId
        );

        const currentQuantity = existingItemIndex > -1 ? cartDoc.items[existingItemIndex].quantity : 0;
        const newQuantity = currentQuantity + quantity;

        if (newQuantity > item.availableStock) {
            return res.status(400).json({
                message: `Requested total quantity (${newQuantity}) exceeds available stock (${item.availableStock})`,
            });
        }

        if (existingItemIndex > -1) {
            cartDoc.items[existingItemIndex].quantity = newQuantity;
        } else {
            cartDoc.items.push({
                menuItem: menuItemId,
                quantity,
            });
        }

        await cartDoc.save();
        await cartDoc.populate("items.menuItem");

        return res.status(200).json({
            message: "Item added to cart",
            cart: cartDoc,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to add item to cart",
            error: error.message,
        });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { menuItemId } = req.params;

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be a positive integer",
            });
        }

        const item = await MenuItem.findById(menuItemId);
        if (!item || !item.isAvailable) {
            return res.status(404).json({
                message: "Menu item is unavailable",
            });
        }

        if (quantity > item.availableStock) {
            return res.status(400).json({
                message: `Insufficient stock. Only ${item.availableStock} available`,
            });
        }

        const cartDoc = await Cart.findOne({
            student: req.user.id,
        });

        if (!cartDoc) {
            return res.status(404).json({
                message: "Cart not found",
            });
        }

        const cartItem = cartDoc.items.find(
            (entry) => entry.menuItem.toString() === menuItemId
        );

        if (!cartItem) {
            return res.status(404).json({
                message: "Item not found in cart",
            });
        }

        cartItem.quantity = quantity;
        await cartDoc.save();
        await cartDoc.populate("items.menuItem");

        return res.status(200).json({
            message: "Cart updated successfully",
            cart: cartDoc,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update cart",
            error: error.message,
        });
    }
};

exports.removeCartItem = async (req, res) => {
    try {
        const cartDoc = await Cart.findOne({
            student: req.user.id,
        });

        if (!cartDoc) {
            return res.status(404).json({
                message: "Cart not found",
            });
        }

        const initialLength = cartDoc.items.length;

        cartDoc.items = cartDoc.items.filter(
            (entry) => entry.menuItem.toString() !== req.params.menuItemId
        );

        if (cartDoc.items.length === initialLength) {
            return res.status(404).json({
                message: "Item not found in cart",
            });
        }

        await cartDoc.save();
        await cartDoc.populate("items.menuItem");

        return res.status(200).json({
            message: "Item removed from cart",
            cart: cartDoc,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to remove item",
            error: error.message,
        });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const cartDoc = await Cart.findOne({
            student: req.user.id,
        });

        if (cartDoc) {
            cartDoc.items = [];
            await cartDoc.save();
        }

        return res.status(200).json({
            message: "Cart cleared successfully",
            cart: cartDoc || { student: req.user.id, items: [] },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to clear cart",
            error: error.message,
        });
    }
};