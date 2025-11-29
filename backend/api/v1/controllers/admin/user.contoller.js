const User = require("../../models/user.model");
const paginationHelper = require("../../helper/pagination");
const bcrypt = require('bcrypt');
const generateHelper = require("../../helper/generate");

// [GET]/api/v1/admin/users
module.exports.index = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("user_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem danh sách user"
        });
    } else {
        let find = { deleted: false };

        // Search
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            find.$or = [
                { fullName: searchRegex }
            ];
        }

        if (req.query.status) {
            find.status = req.query.status;
        };

        // sort
        const sort = {};
        if (req.query.sortKey && req.query.sortValue) {
            sort[req.query.sortKey] = req.query.sortValue;
        }

        // pagination
        const countRecords = await User.countDocuments(find);
        let objPagination = paginationHelper(
            {
                currentPage: 1,
                limitItems: 10
            },
            req.query,
            countRecords
        );
        // end pagination

        const accounts = await User.find(find).sort(sort).limit(objPagination.limitItems).skip(objPagination.skip).select("-password");

        res.json({
            users: accounts,
            totalPage: objPagination.totalPage,
            totalRecords: countRecords
        });
    }
};

// [GET]/api/v1/admin/users/detail/:id
module.exports.detail = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("user_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem chi tiết user"
        });
    } else {
        const id = req.params.id;

        const data = await User.findOne({
            _id: id,
            deleted: false
        }).select("-password -token");

        return res.json({
            code: 200,
            message: "Lấy thông tin thành công!",
            data
        });
    }
};

// [PATCH]/api/v1/admin/users/changeStatus/:status/:id
module.exports.changeStatus = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("user_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền cập nhật trạng thái user"
        });
    } else {
        const status = req.params.status;
        const id = req.params.id;

        const data = await User.findOneAndUpdate(
            { _id: id, deleted: false },
            { status: status },
            { new: true }
        ).select("-password -token");

        return res.json({
            code: 200,
            message: "Cập nhật trạng thái thành công!",
            data
        });
    }
};

// [DELETE]/api/v1/admin/users/delete/:id
module.exports.delete = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("user_delete")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xóa user"
        });
    } else {
        const id = req.params.id;

        await User.deleteOne({
            _id: id
        });

        return res.json({
            code: 200,
            message: "xóa tài khoản thành công!",
        });
    }
};

// [POST]/api/v1/admin/users/create
module.exports.create = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("user_create")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền tạo user"
        });
    }

    const { fullName, email, password, confirmPassword, phone } = req.body;

    // Validate input
    if (!fullName) {
        return res.json({
            code: 400,
            message: "Vui lòng nhập họ tên!"
        });
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.json({
            code: 400,
            message: "Vui lòng nhập email hợp lệ!"
        });
    }

    if (!password) {
        return res.json({
            code: 400,
            message: "Vui lòng nhập mật khẩu!"
        });
    }

    if (password.length < 6) {
        return res.json({
            code: 400,
            message: "Mật khẩu phải có ít nhất 6 ký tự!"
        });
    }

    if (!confirmPassword) {
        return res.json({
            code: 400,
            message: "Vui lòng xác nhận mật khẩu!"
        });
    }

    if (password !== confirmPassword) {
        return res.json({
            code: 400,
            message: "Mật khẩu xác nhận không khớp!"
        });
    }

    if (!phone) {
        return res.json({
            code: 400,
            message: "Vui lòng nhập số điện thoại!"
        });
    }

    if (!/^\d{10,11}$/.test(phone)) {
        return res.json({
            code: 400,
            message: "Số điện thoại không hợp lệ!"
        });
    }

    try {
        // Check if email already exists
        const existingUser = await User.findOne({ email: email, deleted: false });
        if (existingUser) {
            return res.json({
                code: 400,
                message: "Email đã được sử dụng!"
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate token
        const token = generateHelper.generateRandomString(30);

        // Create new user
        const newUser = new User({
            fullName: fullName,
            email: email,
            password: hashedPassword,
            phone: phone,
            token: token,
            status: "active"
        });

        await newUser.save();

        return res.json({
            code: 200,
            message: "Tạo tài khoản người dùng thành công!",
            data: {
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                phone: newUser.phone,
                status: newUser.status
            }
        });
    } catch (error) {
        console.error("Create user error:", error);
        return res.json({
            code: 500,
            message: "Lỗi khi tạo tài khoản người dùng!"
        });
    }
};

// [PATCH]/api/v1/admin/users/edit/:id
module.exports.edit = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("user_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền chỉnh sửa user"
        });
    }

    const id = req.params.id;
    const { fullName, email, password, confirmPassword, phone } = req.body;

    // Validate input
    if (!fullName) {
        return res.json({
            code: 400,
            message: "Vui lòng nhập họ tên!"
        });
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.json({
            code: 400,
            message: "Vui lòng nhập email hợp lệ!"
        });
    }

    if (!phone) {
        return res.json({
            code: 400,
            message: "Vui lòng nhập số điện thoại!"
        });
    }

    if (!/^\d{10,11}$/.test(phone)) {
        return res.json({
            code: 400,
            message: "Số điện thoại không hợp lệ!"
        });
    }

    // If updating password, validate it
    if (password) {
        if (password.length < 6) {
            return res.json({
                code: 400,
                message: "Mật khẩu phải có ít nhất 6 ký tự!"
            });
        }

        if (!confirmPassword) {
            return res.json({
                code: 400,
                message: "Vui lòng xác nhận mật khẩu!"
            });
        }

        if (password !== confirmPassword) {
            return res.json({
                code: 400,
                message: "Mật khẩu xác nhận không khớp!"
            });
        }
    }

    try {
        // Check if user exists
        const user = await User.findOne({ _id: id, deleted: false });
        if (!user) {
            return res.json({
                code: 404,
                message: "Không tìm thấy người dùng!"
            });
        }

        // Check if email is already used by another user
        if (email !== user.email) {
            const existingUser = await User.findOne({ email: email, deleted: false, _id: { $ne: id } });
            if (existingUser) {
                return res.json({
                    code: 400,
                    message: "Email đã được sử dụng!"
                });
            }
        }

        // Update user data
        const updateData = {
            fullName: fullName,
            email: email,
            phone: phone
        };

        // Hash and update password if provided
        if (password) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            updateData.password = hashedPassword;
        }

        await User.updateOne({ _id: id }, updateData);

        const updatedUser = await User.findOne({ _id: id }).select("-password -token");

        return res.json({
            code: 200,
            message: "Cập nhật tài khoản người dùng thành công!",
            data: updatedUser
        });
    } catch (error) {
        console.error("Edit user error:", error);
        return res.json({
            code: 500,
            message: "Lỗi khi cập nhật tài khoản người dùng!"
        });
    }
};