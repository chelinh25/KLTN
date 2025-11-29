const bcrypt = require('bcrypt');
const saltRounds = 10;
const User = require("../../models/user.model");
const ForgotPassword = require("../../models/forgot-password.model");
const generateHelper = require("../../helper/generate");
const sendMailHelper = require("../../helper/sendMail");
const Cart = require('../../models/cart.model');
const Order = require('../../models/order.model');
const Hotel = require('../../models/hotel.model');
const Room = require('../../models/room.model');
const Tour = require('../../models/tour.model');
const tourHelper = require("../../helper/tours");

// [POST]/api/v1/users/register
module.exports.register = async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const existEmail = await User.findOne({
        email: req.body.email,
        deleted: false
    });

    if (existEmail) {
        res.json({
            code: 400,
            message: "Email đã tồn tại"
        })
    } else {
        const user = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            password: hashedPassword,
            token: generateHelper.generateRandomString(30),
            phone: req.body.phone,
            avatar: req.body.avatar
        });
        user.save();
        const token = user.token;
        res.cookie("token", token);
        res.json({
            code: 200,
            message: "Đăng ký thành công",
            token: token
        })
    }
};

// [POST]/api/v1/users/login
module.exports.login = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({
        email: email,
        deleted: false
    });

    if (!user) {
        res.json({
            code: 400,
            message: "Email không tồn tại"
        });
        return;
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        res.json({
            code: 400,
            message: "Sai mật khẩu!"
        });
        return;
    }
    let cart = await Cart.findOne({
        user_id: user._id
    });
    if (!cart) {
        cart = new Cart({
            user_id: user._id
        });
        await cart.save();
    }
    const token = user.token;
    res.cookie("cartId", cart._id);
    res.cookie("token", token);

    res.json({
        code: 200,
        message: "Đăng nhập thành công",
        token: token,
        cartId: cart._id
    });
};

// [POST]/api/v1/users/password/forgot
module.exports.forgotPassword = async (req, res) => {
    const email = req.body.email;
    const user = await User.findOne({
        email: email,
        deleted: false
    });

    if (!user) {
        res.json({
            code: 400,
            message: "Email không tồn tại"
        });
        return;
    }

    const otp = generateHelper.generateRandomNumber(6);

    const objForgotPassword = {
        email: email,
        otp: otp,
        expireAt: Date.now()
    };

    const forgotPassword = new ForgotPassword(objForgotPassword);
    await forgotPassword.save();

    // gửi otp qua email user
    const subject = "Mã OTP để lấy lại mật khẩu";
    const html = `
    Mã OTP để lấy lại mật khẩu của bạn là <b>${otp}</b>.
    Vui lòng không chia sẻ mã OTP này với bất kỳ ai.
    `;

    sendMailHelper.sendMail(email, subject, html);
    res.json({
        code: 200,
        message: "Đã gửi mã OTP qua email"
    });
};

// [POST]/api/v1/users/password/otp
module.exports.otpPassword = async (req, res) => {
    const email = req.body.email;
    const otp = req.body.otp;

    const result = await ForgotPassword.findOne({
        email: email,
        otp: otp
    });

    if (!result) {
        res.json({
            code: 400,
            message: "Mã OTP không đúng"
        });
        return;
    }

    const user = await User.findOne({
        email: email
    });

    const token = user.token;
    res.cookie("token", token);

    res.json({
        code: 200,
        message: "Xác thực thành công!",
        token: token
    });
};

// [POST]/api/v1/users/password/reset
module.exports.resetPassword = async (req, res) => {
    const token = req.body.token;
    const password = req.body.password;

    const user = await User.findOne({
        token: token
    });
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        res.json({
            code: 400,
            message: "Mật khẩu đã tồn tại"
        });
        return;
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await User.updateOne({
        token: token
    }, {
        password: hashedPassword
    });

    res.json({
        code: 200,
        message: "Đặt lại mật khẩu thành công"
    });
};

// [GET]/api/v1/users/detail
module.exports.detail = async (req, res) => {
    res.json({
        code: 200,
        message: "Thành công",
        infor: req.user
    });
};

// [GET]/api/v1/user/logout
module.exports.logout = async (req, res) => {
    res.clearCookie("token");
    res.clearCookie("cartId");
    res.json({
        code: 200,
        message: "Đăng xuất thành công"
    });
}

// [PATCH]/api/v1/users/edit
module.exports.edit = async (req, res) => {
    try {
        const userId = req.user._id;
        const data = await User.findOneAndUpdate({
            _id: userId
        }, req.body, {
            new: true
        });
        res.json({
            code: 200,
            message: "Cập nhật thông tin thành công",
            data: data
        });
    } catch (error) {
        res.json({
            code: 500,
            message: "Có lỗi xảy ra" + error.message,
        });
    }
};

// [PATCH]/api/v1/users/password/change
module.exports.changePass = async (req, res) => {
    try {
        const token = req.user.token;
        const password = req.body.password;
        const newPassword = req.body.newPassword;
        const confirmNewPassword = req.body.confirmNewPassword;


        const user = await User.findOne({
            token: token
        });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({
                code: 400,
                message: "Mật khẩu không đúng"
            });
        }
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await User.updateOne({
            token: token
        }, {
            password: hashedPassword
        });

        return res.json({
            code: 200,
            message: "Đặt lại mật khẩu thành công"
        });

    } catch (error) {
        return res.json({
            code: 500,
            message: "Có lỗi xảy ra" + error.message,
        });
    }
};

// [GET]/api/v1/user/orders
module.exports.orderUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const data = await Order.find({
            user_id: userId
        })
        res.json({
            code: 200,
            message: "Lấy danh sách order thành công!",
            data: data
        });
    } catch (error) {
        res.json({
            code: 500,
            message: "Có lỗi xảy ra" + error.message,
        });
    }
};

// [GET]/api/v1/user/ordersDetail/:id
module.exports.orderDetail = async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.id;
        const order = await Order.findOne({
            _id: orderId,
            user_id: userId
        });

        const tours = [];
        for (const item of order.tours) {
            const tourInfo = await Tour.findOne({
                _id: item.tour_id
            });
            tours.push({
                tourInfo: tourInfo,
                quantity: item.quantity,
                priceNew: tourHelper.priceNewTour(tourInfo)
            });
        }

        const hotels = [];
        for (const item of order.hotels) {
            const hotelInfo = await Hotel.findOne({
                _id: item.hotel_id
            });
            const rooms = [];
            for (const room of item.rooms) {
                const roomInfo = await Room.findOne({
                    _id: room.room_id
                });
                rooms.push({
                    roomInfo: roomInfo,
                    quantity: room.quantity,
                    price: room.price
                });
            }
            hotels.push({
                hotelInfo: hotelInfo,
                rooms: rooms
            });
        }

        res.json({
            code: 200,
            message: "Lấy thông tin đơn hàng thành công!",
            data: {
                order: order,
                tours: tours,
                hotels: hotels
            }
        });
    } catch (error) {
        res.json({
            code: 500,
            message: "Có lỗi xảy ra" + error.message,
        });
    }
};