const Voucher = require("../../models/voucher.model");
const paginationHelper = require("../../helper/pagination");

// [GET]/api/v1/admin/vouchers
module.exports.index = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("voucher_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem danh sách voucher"
        });
    } else {
        let find = { deleted: false };

        // Search
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            find.$or = [
                { title: searchRegex },
                { code: searchRegex }
            ];
        }

        // sort
        const sort = {};
        if (req.query.sortKey && req.query.sortValue) {
            sort[req.query.sortKey] = req.query.sortValue;
        }

        // pagination
        const countRecords = await Voucher.countDocuments(find);
        let objPagination = paginationHelper(
            {
                currentPage: 1,
                limitItems: 10
            },
            req.query,
            countRecords
        );
        // end pagination

        const vouchers = await Voucher.find(find).sort(sort).limit(objPagination.limitItems).skip(objPagination.skip);

        res.json({
            vouchers: vouchers,
            totalPage: objPagination.totalPage
        });
    }
};

// [POST]/api/v1/admin/vouchers/create
module.exports.createPost = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("voucher_create")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền tạo mới voucher"
        });
    } else {
        try {
            const startDate = req.body.startDate ? new Date(req.body.startDate) : Date.now();
            const endDate = new Date(req.body.endDate);

            // Tạo đối tượng voucher mới
            const voucher = new Voucher({
                title: req.body.title,
                code: req.body.code.trim().toUpperCase(),
                description: req.body.description,
                quantity: parseInt(req.body.quantity),
                discount: parseFloat(req.body.discount),
                minOrderAmount: req.body.minOrderAmount ? parseFloat(req.body.minOrderAmount) : 0,
                startDate: startDate,
                endDate: endDate,
            });

            // Lưu voucher vào cơ sở dữ liệu
            const data = await voucher.save();

            res.json({
                code: 200,
                message: "Tạo voucher thành công",
                data: data
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: "Lỗi khi tạo voucher: " + error.message
            });
        }
    }
};

// [PATCH]/api/v1/admin/vouchers/edit/:id
module.exports.edit = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("voucher_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền chỉnh sửa voucher"
        });
    } else {
        try {
            const id = req.params.id;
            const updateData = { ...req.body };
            if (updateData.code) {
                updateData.code = updateData.code.trim().toUpperCase();
            }
            if (updateData.minOrderAmount !== undefined) {
                updateData.minOrderAmount = parseFloat(updateData.minOrderAmount) || 0;
            }
            if (updateData.quantity !== undefined) {
                updateData.quantity = parseInt(updateData.quantity);
            }
            if (updateData.discount !== undefined) {
                updateData.discount = parseFloat(updateData.discount);
            }
            await Voucher.updateOne({
                _id: id
            }, updateData);

            res.json({
                code: 200,
                message: "Chỉnh sửa voucher thành công"
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: "Lỗi khi chỉnh sửa voucher: " + error.message
            });
        }
    }
};

// [DELETE]/api/v1/admin/vouchers/delete/:id
module.exports.delete = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("voucher_delete")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xóa voucher"
        });
    } else {
        try {
            const id = req.params.id;
            await Voucher.deleteOne({
                _id: id
            });

            res.json({
                code: 200,
                message: "Xóa voucher thành công"
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: "Lỗi khi xóa voucher: " + error.message
            });
        }
    }
};

// [GET]/api/v1/admin/vouchers/detail/:id
module.exports.detail = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("voucher_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem chi tiết voucher"
        });
    } else {
        try {
            const id = req.params.id;
            const data = await Voucher.findOne({
                _id: id
            });

            res.json({
                code: 200,
                message: "Thành công",
                data: data
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: "Lỗi khi xóa voucher: " + error.message
            });
        }
    }
};