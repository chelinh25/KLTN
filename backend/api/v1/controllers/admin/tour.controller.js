const Tour = require("../../models/tour.model");
const Category = require("../../models/category.model");
const generate = require("../../helper/generate");
const paginationHelper = require("../../helper/pagination");
const tourHelper = require("../../helper/tours");
const { convertToSlug } = require("../../helper/convertToSlug");

// [GET]/api/v1/admin/tours
module.exports.index = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("tour_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem danh sách tour"
        });
    } else {
        let find = { deleted: false };

        // Search
        if (req.query.search) {
            const keywordRegex = new RegExp(req.query.search, "i");

            const stringSlug = convertToSlug(req.query.search);
            const stringSlugRegex = new RegExp(stringSlug, "i");
            find.$or = [
                { title: keywordRegex },
                { slug: stringSlugRegex }
            ];
        }

        if (req.query.status) {
            find.status = req.query.status;
        };

        const sort = {};
        if (req.query.sortKey && req.query.sortValue) {
            sort[req.query.sortKey] = req.query.sortValue;
        }

        // pagination
        const countRecords = await Tour.countDocuments(find);
        let objPagination = paginationHelper(
            {
                currentPage: 1,
                limitItems: 10
            },
            req.query,
            countRecords
        );
        // end pagination

        const tours = await Tour.find(find).sort(sort).limit(objPagination.limitItems).skip(objPagination.skip);
        let toursObject = tours.map(item => item.toObject());

        toursObject.forEach(item => {
            item.price_special = tourHelper.priceNewTour(item);
        });
        res.json({
            toursObject: toursObject,
            totalPage: objPagination.totalPage
        });
    }
};

// [POST]/api/v1/admin/tours/create
module.exports.createPost = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("tour_create")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền tạo mới tour"
        });
    } else {
        try {
            const countTour = await Tour.countDocuments();
            const code = generate.generateTourCode(countTour + 1);

            let rawTimeStarts = req.body.timeStarts;

            if (typeof rawTimeStarts === "string") {
                try {
                    rawTimeStarts = JSON.parse(rawTimeStarts);
                } catch (err) {
                    return res.status(400).json({
                        code: 400,
                        message: "timeStarts không đúng định dạng JSON"
                    });
                }
            }


            const tour = new Tour({
                title: req.body.title,
                code: code,
                price: parseInt(req.body.price),
                discount: parseInt(req.body.discount),
                stock: parseInt(req.body.stock),
                category_id: req.body.category_id,
                timeStarts: rawTimeStarts.map(item => ({
                    timeDepart: new Date(item.timeDepart),
                    stock: parseInt(item.stock),
                })),
                gathering: req.body.gathering,
                status: req.body.status,
                featured: req.body.featured === 'true' || req.body.featured === true,
                images: req.body.images,
                information: req.body.information,
                schedule: req.body.schedule,
            });
            const data = await tour.save();
            res.json({
                code: 200,
                message: "Tạo thành công",
                data: data
            });
        } catch (error) {
            res.json({
                code: 404,
                message: "Không tồn tại!" + error
            });
        }
    }
};

// [PATCH]/api/v1/admin/tours/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("tour_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền chỉnh sửa trạng thái tour"
        });
    } else {
        try {
            const id = req.params.id;
            const status = req.params.status;
            await Tour.updateOne({
                _id: id
            }, {
                status: status
            });
            res.json({
                code: 200,
                message: "Cập nhật trạng thái thành công"
            })
        } catch (error) {
            res.json({
                code: 404,
                message: "Lỗi! " + error
            })
        }
    }
};

// [DELETE]/api/v1/admin/delete/:id
module.exports.deleteTour = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("tour_delete")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xóa tour"
        });
    } else {
        try {
            const id = req.params.id;

            await Tour.deleteOne({
                _id: id
            });

            res.json({
                code: 200,
                message: "Xóa tour thành công!"
            })
        } catch (error) {
            res.json({
                code: 404,
                message: "Lỗi! " + error
            })
        }
    }
};

// [GET]/api/v1/admin/detail/:id
module.exports.detail = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("tour_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem chi tiết tour"
        });
    } else {
        const id = req.params.id;

        const tour = await Tour.findOne({
            _id: id,
            deleted: false,
        });

        const category = await Category.findOne({
            _id: tour.category_id,
            deleted: false
        });
        res.json({
            tour: tour,
            category: category
        });
    }
};

// [PATCH]/api/v1/admin/tours/edit/:id
module.exports.editPatch = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("tour_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền chỉnh sửa tour"
        });
    } else {
        try {
            const id = req.params.id;
            const existingTour = await Tour.findById(id);

            if (!existingTour) {
                return res.json({
                    code: 404,
                    message: "Tour không tồn tại"
                });
            }

            let rawTimeStarts = req.body.timeStarts;

            if (typeof rawTimeStarts === "string") {
                try {
                    rawTimeStarts = JSON.parse(rawTimeStarts);
                } catch (err) {
                    return res.json({
                        code: 400,
                        message: "timeStarts không đúng định dạng JSON"
                    });
                }
            }

            const updatedData = {
                title: req.body.title || existingTour.title,
                price: req.body.price ? parseInt(req.body.price) : existingTour.price,
                discount: req.body.discount ? parseInt(req.body.discount) : existingTour.discount,
                stock: req.body.stock ? parseInt(req.body.stock) : existingTour.stock,
                category_id: req.body.category_id || existingTour.category_id,
                timeStarts: rawTimeStarts ? rawTimeStarts.map(item => ({
                    timeDepart: new Date(item.timeDepart),
                    stock: parseInt(item.stock),
                })) : existingTour.timeStarts,
                gathering: req.body.gathering || existingTour.gathering,
                status: req.body.status || existingTour.status,
                featured: req.body.featured === 'true' || req.body.featured === true,
                images: req.body.images || existingTour.images,
                information: req.body.information || existingTour.information,
                schedule: req.body.schedule || existingTour.schedule,
            };

            const data = await Tour.findByIdAndUpdate(
                id,
                { $set: updatedData },
                { new: true }
            );

            res.json({
                code: 200,
                message: "Cập nhật tour thành công",
                data: data
            });
        } catch (error) {
            res.json({
                code: 404,
                message: "Cập nhật tour thất bại" + error
            });
        }
    }
};