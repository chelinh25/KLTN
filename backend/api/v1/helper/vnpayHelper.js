const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');

/**
 * Build VNPay payment URL with secure hash
 */
function buildPaymentUrl(params) {
    const vnpUrl = process.env.vnpayHost + '/paymentv2/vpcpay.html';
    const tmnCode = process.env.vnp_TmnCode;
    const secretKey = process.env.vnp_HashSecret;
    
    // Tạo ngày giờ theo định dạng yyyyMMddHHmmss
    const createDate = moment().format('YYYYMMDDHHmmss');
    
    // Các tham số VNPay
    let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: params.vnp_Locale || 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: params.vnp_TxnRef,
        vnp_OrderInfo: params.vnp_OrderInfo,
        vnp_OrderType: params.vnp_OrderType || 'other',
        vnp_Amount: params.vnp_Amount, // Đã nhân 100
        vnp_ReturnUrl: params.vnp_ReturnUrl,
        vnp_IpAddr: params.vnp_IpAddr || '127.0.0.1',
        vnp_CreateDate: createDate,
    };

    // Sắp xếp các tham số theo thứ tự alphabet
    vnp_Params = sortObject(vnp_Params);

    // Tạo chuỗi dữ liệu để hash (không encode URL)
    const signData = new URLSearchParams(vnp_Params).toString();
    
    // Tạo secure hash bằng HMAC SHA512
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    // Thêm vnp_SecureHash vào params
    vnp_Params['vnp_SecureHash'] = signed;

    // Tạo URL cuối cùng
    const paymentUrl = vnpUrl + '?' + new URLSearchParams(vnp_Params).toString();
    
    console.log('=== VNPAY PAYMENT URL GENERATION ===');
    console.log('Params before hash:', vnp_Params);
    console.log('Sign data:', signData);
    console.log('Secure hash:', signed);
    console.log('Final payment URL:', paymentUrl);
    
    return paymentUrl;
}

/**
 * Verify VNPay return URL
 */
function verifyReturnUrl(vnp_Params) {
    const secureHash = vnp_Params['vnp_SecureHash'];
    const secretKey = process.env.vnp_HashSecret;

    // Xóa các trường không tham gia vào việc hash
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp lại params
    vnp_Params = sortObject(vnp_Params);

    // Tạo chuỗi dữ liệu để hash
    const signData = new URLSearchParams(vnp_Params).toString();
    
    // Tạo secure hash
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('=== VNPAY VERIFY RETURN URL ===');
    console.log('Received hash:', secureHash);
    console.log('Computed hash:', signed);
    console.log('Is verified:', secureHash === signed);

    // Kiểm tra chữ ký
    const isVerified = secureHash === signed;
    
    // Kiểm tra transaction status
    const isSuccess = vnp_Params['vnp_ResponseCode'] === '00';

    return {
        isVerified,
        isSuccess,
        ...vnp_Params,
        vnp_SecureHash: secureHash
    };
}

/**
 * Sort object by key
 */
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
        sorted[key] = obj[key];
    });
    return sorted;
}

module.exports = {
    buildPaymentUrl,
    verifyReturnUrl
};
