// Script migration để cập nhật các voucher hiện có với trường minOrderAmount
const mongoose = require('mongoose');
require('dotenv').config();

const database = require('./config/database');
const Voucher = require('./api/v1/models/voucher.model');

async function updateVouchers() {
    try {
        // Kết nối database
        database.connect();

        console.log("=== BẮT ĐẦU CẬP NHẬT VOUCHERS ===");

        // Đếm số voucher hiện tại
        const totalVouchers = await Voucher.countDocuments({});
        console.log(`Tổng số vouchers trong database: ${totalVouchers}`);

        // Cập nhật tất cả voucher không có minOrderAmount hoặc minOrderAmount là undefined
        const result = await Voucher.updateMany(
            { 
                $or: [
                    { minOrderAmount: { $exists: false } },
                    { minOrderAmount: null },
                    { minOrderAmount: undefined }
                ]
            },
            { 
                $set: { minOrderAmount: 0 } 
            }
        );

        console.log(`Đã cập nhật ${result.modifiedCount} vouchers với minOrderAmount = 0`);

        // Hiển thị danh sách voucher sau khi cập nhật
        const vouchers = await Voucher.find({}).select('code title minOrderAmount quantity discount startDate endDate');
        console.log("\n=== DANH SÁCH VOUCHERS SAU KHI CẬP NHẬT ===");
        vouchers.forEach((voucher, index) => {
            console.log(`\n${index + 1}. Voucher: ${voucher.title}`);
            console.log(`   - Mã: ${voucher.code}`);
            console.log(`   - Giảm giá: ${voucher.discount}%`);
            console.log(`   - Số lượng: ${voucher.quantity}`);
            console.log(`   - Giá trị đơn hàng tối thiểu: ${voucher.minOrderAmount || 0} VNĐ`);
            console.log(`   - Ngày bắt đầu: ${voucher.startDate}`);
            console.log(`   - Ngày hết hạn: ${voucher.endDate}`);
        });

        console.log("\n=== HOÀN THÀNH CẬP NHẬT ===");
        
        process.exit(0);
    } catch (error) {
        console.error("Lỗi khi cập nhật vouchers:", error);
        process.exit(1);
    }
}

updateVouchers();
