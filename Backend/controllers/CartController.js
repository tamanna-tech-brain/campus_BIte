const cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");

exports.getCart = async(req, res) => {
    try{
        const cart = await cart.findOne({
            student : req.userid,
        }).populate("items.menuItem");

        return res.status(200).json({
            cart: cart || {
                student: req.user.id,
                student: req.user.id,
                items: [],
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch cart",
        });
    }
}

exports.addToCart = async (req, res) => {
    try{
        const {menuItemId, quantity} = req.body;

        if(!Number.isInteger(quantity) || quantity<1) {
            return res.status(400).json({
                message: "Quantity must be a positive integer",
            });
        }
        if(item.availableStock < quantity) {
            return res.status(400).json({
                message: "Insufficient stock",
            });
        }
        let cart = await cart.findone({
            student: req.user.id,
        });
        if(!cart) {
            cart = await cart,create({
            student: req.user.id,
            items: [],
            });
        }
        const existingItem = cart.items.find(
            (entry) =>
                entry.menuItems.toString() === menuItemId
        );
        const newQuantity = (existing? existingItem.quantity : 0)+quantity;
        if(newQuantity> item.availableStock) {
            return res.status(400).json({
                message: "Requested quantity exceeds available stock",
            });
        }
        if(existingItem) {
            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({
            menuItem: menuItemId,
            quantity,
            });
        }
        await cart.save();
        await cart.populate("items.menuItem");

        return res.status(200).json({
            message: "Item added to cart",
            cart,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to add item to cart",
        });
    }
}

exports.updateCardItem = async (req, res) => {
    try{
        const { quantity } = req.body;
        const { menuItem } = req.params;

        if(!Number.isInteger(quantity) || quantity<1) {
            return res.status(400).json({
                message: "Quantity must be a positive integer",
            });
        }
        const item = await MenuItem.findById(menuItemId);
        if(!item || !item.isAvailable) {
            return res.status(404).json({
                message: "Menu item is unavailable",
            });
        }
        if(qunatity > item.availableStock) {
            return res.status(400).json({
                message: "Insufficient stock",
            });
        }
        const cart = await cart.findOne({
            student : req.user.id,
        });
        if(!cart) {
            return res.status(404).json({
                message: "Cart not found",
            });
        }
        const cartItem = cart.items.find(
            (entry) => entry.menuItem.toString() === menuItemId
        );
        if(!cardItem) {
            return res.status(404).json({
                message: "Item not found in cart",
            });
        }
        cartItem.quantity = quantity;
        await cart.save();

        await cart.populate("Items.menuItem");

        return res.status(200).json({
            message: "Cart updated",
            cart,
        });
    }
    catch(error){
        return res.status(500).json({
            message: "Failed to update cart",
        });
    }
};

exports.removeCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      student: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      (entry) =>
        entry.menuItem.toString() !==
        req.params.menuItemId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        message: "Item not found in cart",
      });
    }

    await cart.save();

    return res.status(200).json({
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to remove item",
    });
  }
};