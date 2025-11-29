const { VNPay } = require("vnpay");

const vnpay = new VNPay({
    // Thông tin cấu hình bắt buộc
    tmnCode: process.env.vnp_TmnCode,
    secureSecret: process.env.vnp_HashSecret,
    vnpayHost: process.env.vnpayHost,

    // Cấu hình tùy chọn
    testMode: true,
    hashAlgorithm: 'SHA512',
    enableLog: true,
});
module.exports = vnpay;