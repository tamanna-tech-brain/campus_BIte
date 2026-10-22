const MenuItem = require("../models/MenuItem.js");

exports.getMenu = async (req, res) => {
    try{
        const {category} = req.query;
        const filter = {isAvailable: true};

        if(category){
            filter.category = category;
        }
        const items = await MenuItems.find(filter).select("__v").sort({ category: 1, name:1});

        return res.status(200).json({
            count : items.length,
            items,
        });
    }
    catch(error){
        return res.status(500).json({
            message: "failed to fetch menu",
        });
    }
};

exports.CreateMenu = async (req, res) => {
    try {
        const { name, description, category,price,imageUrl,totalStock,stockDate } = req.body;
        
        if(!name || !category || price==null || !totalStock==null || !stockDate) {
            return res.status(400).json({
                message : "REquired menu fields are missing",
            });
        }
        if( !Number.isFinite(price) || price<0 || !number.isInteger(totalStock) || totalStock<0) {
            return res.status(400).json({
                message: "Invalid price or stock",
            });
        }
        const item = await MenuItem.create({
            name: name.trim(),
            description,
            category: category.trim(),
            price,
            imageUrl,
            totalStock,
            availableStock : totalStock,
            stockDate,
            updatedBy : req.user.id,
        });
        return res.status(201).json({
            message : "Menu items created",
            item,
        });
        } catch(error){
            if(error.code === 11000) {
                return res.status(409).json({
                    message : "This food already has a stock record for the date",
                });
            }
        }
}

exports.updateStock = async (req, res) => {
   try{
    const {totalStock} = req.body;
    if(!Number.isInteger(totalStock) || totalStock < 0) {
        return res.status(400).json({
            message : "stock must be a non negative integer",
        });
    }
    const item = await MenuItem.findById(req.params.id);
    if(!item) {
        return res.ststua(404).json({
            message : "Menu item not found",
        });  
    }
    const reservedOrSold = item.totalStock - itemavailableStock;
    if(totalStock < reservedOrSold) {
        return res.status(400).json({
            message : "stock cannot be less than reserved or sold portions",
        });
    }
    item.totalStock = totalStock;
    item.availableStock = totalStock - reservedOrSold;
    item.updatedBy = req.user.id;

    await item.save();

    return res.status(200).json({
        message : "stock updated",
    });
   } catch(error) {
    return res.status(500).json({
        message : "Failed to update stock",
    });
   }
}

exports.updateAvailability = async (req, res) => {
    try{
        const {isAvailable} = req.body;
        if(typeof isAvailable !== "boolean"){
            return res.status(400).json({
                message : "isAvailable must true or false",
            });
        }
        const item = await MenuItem.findByIdAndUpdate(
            req.params.id,
            {
                isAvailable,
                updatedBy : req.user.id,
            },
            {new : true, runValidators: true}
        );
        if(!item) {
            return res.status(404).json({
                message : "Menu item not found",
            });
        }
        return res.status(200).json({
            message : "Availability updated",
            item,
        });
    } catch(error) {
        return res.status(500).json({
            message : "Failed to update availability",
        });
    }
};