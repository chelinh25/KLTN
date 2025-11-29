const Tour = require("../../models/tour.model");
const Category = require("../../models/category.model");

// [GET]/tours/:slugCategory
module.exports.index = async (req, res) => {
    const slugCategory = req.params.slugCategory
    const category = await Category.findOne({
        slug: slugCategory,
        deleted: false
    });
    const tours = await Tour.find({
        category_id: category.id,
        deleted: false
    });

    res.json(tours);
}

// [GET]/tours/detail/:slugTour
module.exports.detail = async (req, res) => {
    try {
        const slugTour = req.params.slugTour;
        const tourDetail = await Tour.findOne({
            slug: slugTour,
            deleted: false,
            status: "active"
        });

        if (!tourDetail) {
            return res.status(404).json({
                code: 404,
                message: "Không tìm thấy tour!"
            });
        }

        const tourDetailObj = tourDetail.toObject();
        tourDetailObj.price_special = tourDetail.price * (1 - tourDetail.discount / 100);
        res.json(tourDetailObj);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết tour:", error);
        res.status(500).json({
            code: 500,
            message: "Lỗi server khi lấy chi tiết tour!"
        });
    }
}