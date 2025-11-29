const Cart = require("../../models/cart.model");
const User = require("../../models/user.model");

module.exports.requireAuth = async (req, res, next) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        const user = await User.findOne({
            token: token,
            deleted: false
        }).select("-password");

        if (!user) {
            res.json({
                code: 400,
                message: 'Token không hợp lệ'
            });
            return;
        }

        let cart = await Cart.findOne({
            user_id: user._id
        });
        
        // Tự động tạo cart nếu chưa có
        if (!cart) {
            cart = new Cart({
                user_id: user._id,
                tours: [],
                hotels: []
            });
            await cart.save();
        }
        
        req.user = user;
        req.cart = cart;
        next();
    } else {
        res.json({
            code: 400,
            message: 'Vui lòng gửi kèm token'
        });
    }
}

// Middleware cho phép cả guest và user đã đăng nhập
module.exports.optionalAuth = async (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const user = await User.findOne({
                token: token,
                deleted: false
            }).select("-password");

            if (user) {
                req.user = user;
            }
        } catch (error) {
            console.error("Optional auth error:", error);
        }
    }
    next();
}