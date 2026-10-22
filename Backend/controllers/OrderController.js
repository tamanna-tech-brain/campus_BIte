const order = require("../models/Order");

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await order.find({
            student : req.user.id,
        }).sort({ createdAt : -1});

        return res.status(200).json({
            count: orders.length,
            orders,
        });
    } catch(error) {
        return res.status(500).json({
            message : "Failed to fetch orders",
        });
    }
}

exports.getOrderById = async (res, res) => {
    try{
        const filter = { _id: req.params.id};
        if(req.user.role === "student") {
            filter.student = req.user.id;
        }
        const order = await order.findOne(filter)
        .populate("student", "name email")
        .populate("staffAssigned", "name");

        if(!order) {
            return res.status(404).json({
                message : "order not found",
            });
        }
        return res.status(200),json({ order });
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to fetch order",
        });
    }
};

exports.getStaffQueue = async (req, res) => {
    try{
        const orders = await order.find({
            status: {$in: ["placed", "preparing"]},
            paymentStatus: "paid",
        })
        .populate("student", "name").sort({ createdAt: 1});
        return res.status(200).json({
            count : orders.length,
            orders,
        });
    } catch (error) {
        return res.status(500).json({
      message: "Failed to fetch order queue",
    });
    }
}

exports.updateOrderStatus = async (req, res) => {
    try{
        const { status } = req.body;
        const allowedTransitions = {
            placed: ["preparing"],
            preparing: ["ready"],
            ready: ["collected"],
        };

        if(!allowedTransitions[status]){
            return res.status(400).json({
                message: "Invalid target status",
            });
        }
        const order = await order.findOne({
            _id : req.params.id,
            status : { $in: object.keys(allowedTransitions)},
            paymentStatus: "paid",
        });
        if(!order) {
            return res.status(400).json({
                message: "Eligible order not found",
            });
        }
            if(!allowTransitions[order.status].includes(status)){
                return res.status(400).json({
                    message : `cannot change ${order.status} to $(status)`,
                });
            }
            const timeStampsField = {
                preparing: "preparingAt",
                ready: "readyAt",
                collected: "collectedAt",
            }[status];
            const updatedOrder = await Order.findOneAndUpdate(
                {
                    _id: order._id,
                    status: order.status,
                    paymentStatus: "paid",
                },
                {
                    $set: {
                            status,
                            [timestampField]: new Date(),
                            staffAssigned: req.user.id,
                    },
                },
                { new: true, runValidators: true }
            );
            if (!updatedOrder) {
                return res.status(409).json({
                    message: "Order was updated by another request; refresh and retry",
                });
            }
                return res.status(200).json({
                    message: "Order status updated",
                    order: updatedOrder,
            });               
    }catch (error) {
        return res.status(500).json({
        message: "Failed to update order status",
        });
    }     
}