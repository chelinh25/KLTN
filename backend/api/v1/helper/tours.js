module.exports.priceNewTour = (tour) => {
    const priceNew = (tour.price * (100 - tour.discount) / 100).toFixed(0);

    return priceNew;
}

module.exports.calculateDiscount = (totalPrice, voucher) => {
    if (!voucher) return { discountAmount: 0, finalPrice: totalPrice };

    const discountAmount = Math.round(totalPrice * (voucher.discount / 100));
    const finalPrice = Math.max(0, totalPrice - discountAmount);

    return { discountAmount, finalPrice };
};
