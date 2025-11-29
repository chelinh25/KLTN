const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user_id: String,
    orderCode: String,
    userInfor: {
        fullName: String,
        phone: String,
        email: String,
        note: String
    },
    status: {
        type: String,
        default: "pending"
    },
    tours: [
        {
            tour_id: String,
            price: Number,
            discount: Number,
            timeStarts: [
                {
                    timeDepart: Date,
                    stock: Number,
                }
            ]
        }
    ],
    hotels: [
        {
            hotel_id: String,
            rooms: [
                {
                    room_id: String,
                    price: Number,
                    quantity: Number,
                    checkIn: Date,
                    checkOut: Date
                }
            ],

        }
    ],
    voucherCode: String,
    discountAmount: {
        type: Number,
        default: 0
    },
    totalPrice: Number,
    updateBy: [
        {
            account_id: String,
            updatedAt: Date
        }
    ],
    paymentInfo: Object,
    inforCancel: {
        numberAccount: String,
        bankName: String
    }
}, {
    timestamps: true
});
const Order = mongoose.model("Order", orderSchema, "orders");

module.exports = Order;