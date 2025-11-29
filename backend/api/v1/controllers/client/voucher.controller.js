const Voucher = require("../../models/voucher.model");

// [GET] /api/v1/vouchers/check/:code?orderAmount=xxx
module.exports.checkVoucher = async (req, res) => {
    try {
        const { code } = req.params;
        const { orderAmount } = req.query;

        // Decode URL encoding và trim khoảng trắng
        const decodedCode = decodeURIComponent(code).trim().toUpperCase();
        
        console.log("Checking voucher with code:", decodedCode);

        const voucher = await Voucher.findOne({
            code: decodedCode,
            deleted: false
        });

        if (!voucher) {
            console.log("Voucher not found in database with code:", decodedCode);
            return res.status(404).json({
                code: 404,
                message: "Mã giảm giá không tồn tại hoặc không hợp lệ!"
            });
        }

        // Kiểm tra thời gian bắt đầu
        const now = new Date();
        if (voucher.startDate && new Date(voucher.startDate) > now) {
            return res.status(400).json({
                code: 400,
                message: "Voucher chưa đến thời gian sử dụng!"
            });
        }

        if (new Date(voucher.endDate) < now) {
            return res.status(400).json({
                code: 400,
                message: "Voucher đã hết hạn!"
            });
        }

        if (voucher.quantity <= 0) {
            return res.status(400).json({
                code: 400,
                message: "Voucher đã hết số lượng!"
            });
        }

        // Kiểm tra giá trị đơn hàng tối thiểu
        if (orderAmount && voucher.minOrderAmount > 0) {
            const totalAmount = parseFloat(orderAmount);
            if (isNaN(totalAmount) || totalAmount < voucher.minOrderAmount) {
                return res.status(400).json({
                    code: 400,
                    message: `Đơn hàng phải có giá trị tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')} VNĐ để áp dụng voucher này!`,
                    minOrderAmount: voucher.minOrderAmount
                });
            }
        }

        res.status(200).json({
            code: 200,
            message: "Voucher hợp lệ",
            data: voucher
        });
    } catch (error) {
        console.error("Lỗi khi kiểm tra voucher:", error);
        res.status(500).json({
            code: 500,
            message: "Lỗi hệ thống!"
        });
    }
};

// [GET] /api/v1/vouchers
module.exports.getAllVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find({
            deleted: false,
            endDate: { $gte: new Date() },
            quantity: { $gt: 0 }
        }).select("-deleted -deletedAt -expireAt -__v");

        res.json({
            code: 200,
            data: vouchers
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách voucher:", error);
        res.json({
            code: 500,
            message: "Lỗi hệ thống!"
        });
    }
};
