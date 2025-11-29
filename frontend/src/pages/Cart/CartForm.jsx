import { useEffect, useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../utils/api";
import VoucherModal from "./VoucherModal";

const CartForm = ({ totalPrice }) => {
  const { user } = useAuth();
  const { cart, fetchCart, isLoading } = useCart();
  const navigate = useNavigate();
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  // Đảm bảo totalPrice là số hợp lệ
  const validTotalPrice = isNaN(totalPrice) || !totalPrice ? 0 : totalPrice;
  const [finalTotal, setFinalTotal] = useState(validTotalPrice);
  
  const [customer, setCustomer] = useState({
    fullName: "",
    phone: "",
    email: "",
    note: "",
  });
  const [errors, setErrors] = useState({ fullName: "", phone: "", email: "", note: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  useEffect(() => {
    if (user) {
      setCustomer({
        fullName: user.fullName || "",
        phone: user.phone || "",
        email: user.email || "",
        note: "",
      });
    }
  }, [user]);

  useEffect(() => {
    const validTotal = isNaN(validTotalPrice) || !validTotalPrice ? 0 : validTotalPrice;
    const validDiscount = isNaN(discountAmount) || !discountAmount ? 0 : discountAmount;
    setFinalTotal(Math.max(0, validTotal - validDiscount));
  }, [validTotalPrice, discountAmount]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá!");
      return;
    }

    setIsCheckingVoucher(true);
    try {
      // Encode voucher code để xử lý dấu cách và ký tự đặc biệt
      const encodedVoucherCode = encodeURIComponent(voucherCode.trim());
      
      // Gửi giá trị đơn hàng hiện tại để kiểm tra điều kiện
      const response = await api.get(`/api/v1/vouchers/check/${encodedVoucherCode}?orderAmount=${validTotalPrice}`);
      const result = response.data;

      console.log("Voucher check response:", result);

      // Kiểm tra nếu API trả về lỗi (có code và message)
      if (result.code && result.code !== 200) {
        toast.error(result.message || "Mã giảm giá không hợp lệ!");
        setAppliedVoucher(null);
        setDiscountAmount(0);
        return;
      }

      // Lấy voucher từ result.data
      const voucher = result.data || result;

      // Kiểm tra voucher object
      if (!voucher || !voucher._id) {
        toast.error("Mã giảm giá không tồn tại!");
        setAppliedVoucher(null);
        setDiscountAmount(0);
        return;
      }

      // Kiểm tra hạn sử dụng
      if (new Date() > new Date(voucher.endDate)) {
        toast.error("Mã giảm giá đã hết hạn!");
        setAppliedVoucher(null);
        setDiscountAmount(0);
        return;
      }

      // Kiểm tra số lượng
      if (voucher.quantity <= 0) {
        toast.error("Mã giảm giá đã hết số lượng!");
        setAppliedVoucher(null);
        setDiscountAmount(0);
        return;
      }

      // Tính toán giảm giá
      const validTotal = isNaN(validTotalPrice) || !validTotalPrice ? 0 : validTotalPrice;
      const calculatedDiscount = Math.round(validTotal * (voucher.discount / 100));
      
      console.log("Voucher applied:", {
        code: voucher.code,
        discount: voucher.discount,
        totalPrice: validTotal,
        calculatedDiscount
      });

      setDiscountAmount(calculatedDiscount);
      setAppliedVoucher(voucher);
      toast.success(`Áp dụng voucher thành công! Giảm ${voucher.discount}%`);
    } catch (error) {
      console.error("Lỗi khi kiểm tra voucher:", error);
      const errorMessage = error.response?.data?.message || error.message || "Không thể áp dụng mã giảm giá!";
      console.error("Error details:", error.response?.data);
      toast.error(errorMessage);
      setAppliedVoucher(null);
      setDiscountAmount(0);
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode("");
    setAppliedVoucher(null);
    setDiscountAmount(0);
    toast.info("Đã xóa mã giảm giá");
  };

  const handleSelectVoucherFromModal = (voucher) => {
    setVoucherCode(voucher.code);
    setAppliedVoucher(voucher);
    const calculatedDiscount = Math.round(validTotalPrice * (voucher.discount / 100));
    setDiscountAmount(calculatedDiscount);
  };

  const validateForm = () => {
    const newErrors = { fullName: "", phone: "", email: "", note: "" };
    let isValid = true;

    if (!customer.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên!";
      isValid = false;
    }

    if (!customer.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại!";
      isValid = false;
    } else if (!/^\d{10,11}$/.test(customer.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ!";
      isValid = false;
    }

    for (const tour of cart.tours) {
      for (const time of tour.timeStarts) {
        if (time.quantity > time.stock) {
          newErrors.note = `Số lượng tour ${tour.tourInfo.title} vượt quá số lượng còn lại (${time.stock})!`;
          isValid = false;
        }
        if (new Date(time.timeDepart) < new Date()) {
          newErrors.note = `Thời gian khởi hành của tour ${tour.tourInfo.title} không hợp lệ (ngày trong quá khứ)!`;
          isValid = false;
        }
      }
    }
    for (const hotel of cart.hotels) {
      for (const room of hotel.rooms) {
        if (room.quantity > room.roomInfo.availableRooms) {
          newErrors.note = `Số lượng phòng ${room.roomInfo.name} vượt quá số lượng còn lại (${room.roomInfo.availableRooms})!`;
          isValid = false;
        }
        const checkInDate = new Date(room.checkIn);
        const checkOutDate = new Date(room.checkOut);
        if (checkInDate >= checkOutDate) {
          newErrors.note = `Ngày check-out của phòng ${room.roomInfo.name} không hợp lệ!`;
          isValid = false;
        }
        const numNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        if (numNights < 1) {
          newErrors.note = `Số đêm của phòng ${room.roomInfo.name} phải ít nhất 1 đêm!`;
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thanh toán!");
      navigate("/login");
      return;
    }

    if (!cart.tours.length && !cart.hotels.length) {
      toast.error("Giỏ hàng trống, không thể thanh toán!");
      return;
    }

    if (finalTotal <= 0) {
      toast.error("Tổng tiền không hợp lệ, không thể thanh toán!");
      return;
    }

    if (voucherCode.trim() && !appliedVoucher) {
      toast.error("Vui lòng nhấn 'Áp dụng' để kích hoạt mã giảm giá!");
      return;
    }

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra thông tin trước khi thanh toán!");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchCart();

      const orderData = {
        userInfor: {
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          note: customer.note,
          voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
        },
        tours: cart.tours.map((tour) => ({
          tour_id: tour.tour_id,
          price: tour.priceNew || tour.tourInfo?.price || 0,
          discount: tour.discount || 0,
          timeStarts: tour.timeStarts.map((time) => ({
            timeDepart: time.timeDepart,
            quantity: time.quantity,
          })),
        })),
        hotels: cart.hotels.map((hotel) => ({
          hotel_id: hotel.hotel_id,
          rooms: hotel.rooms.map((room) => ({
            room_id: room.room_id,
            price: room.price || room.roomInfo?.price || 0,
            quantity: room.quantity,
            checkIn: room.checkIn,
            checkOut: room.checkOut,
          })),
        })),
      };

      console.log("Order data being sent:", orderData);

      const orderResponse = await api.post("/api/v1/checkout/order", orderData);
      const orderId = orderResponse.data.order?._id;
      if (!orderId) {
        throw new Error("Không thể tạo đơn hàng: orderId không tồn tại!");
      }

      const paymentResponse = await api.post(`/api/v1/checkout/payment/${orderId}`);
      const paymentUrl = paymentResponse.data.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("Không nhận được URL thanh toán từ VNPay!");
      }
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message || "Có lỗi xảy ra khi tạo đơn hàng!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Lấy danh sách tour liên quan từ khách sạn
  const relatedTours = cart.hotels
    .filter(hotel => hotel.relatedTour)
    .map(hotel => hotel.relatedTour);

  return (
    <div className="cart-form">
      <h3 className="fs-4 fw-bold mb-3">Thông tin thanh toán</h3>
      
      {/* Hiển thị tour liên quan nếu có */}
      {relatedTours.length > 0 && (
        <div className="related-tours-section mb-4 p-3" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
          <h6 className="fw-bold mb-2">
            <i className="bi bi-info-circle"></i> Tour liên quan với khách sạn
          </h6>
          {relatedTours.map((tour, index) => (
            <div key={index} className="d-flex align-items-center mb-2">
              {tour.images && tour.images[0] && (
                <img 
                  src={tour.images[0]} 
                  alt={tour.title}
                  style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px", marginRight: "10px" }}
                />
              )}
              <div>
                <small className="fw-bold d-block">{tour.title}</small>
                {tour.price && (
                  <small className="text-muted">
                    Giá: {tour.price.toLocaleString()} VNĐ
                    {tour.discount > 0 && ` (-${tour.discount}%)`}
                  </small>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Họ và tên</Form.Label>
          <Form.Control
            type="text"
            name="fullName"
            value={customer.fullName}
            onChange={handleInputChange}
            placeholder="Nhập họ và tên"
            isInvalid={!!errors.fullName}
            disabled={isLoading || isSubmitting}
          />
          <Form.Control.Feedback type="invalid">{errors.fullName}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="text"
            name="email"
            value={customer.email}
            onChange={handleInputChange}
            placeholder="Nhập email"
            isInvalid={!!errors.email}
            disabled={isLoading || isSubmitting}
          />
          <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Số điện thoại</Form.Label>
          <Form.Control
            type="text"
            name="phone"
            value={customer.phone}
            onChange={handleInputChange}
            placeholder="Nhập số điện thoại"
            isInvalid={!!errors.phone}
            disabled={isLoading || isSubmitting}
          />
          <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Ghi chú</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="note"
            value={customer.note}
            onChange={handleInputChange}
            placeholder="Nhập ghi chú (nếu có)"
            isInvalid={!!errors.note}
            disabled={isLoading || isSubmitting}
          />
          <Form.Control.Feedback type="invalid">{errors.note}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Mã giảm giá</Form.Label>
          <div className="d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Nhập mã giảm giá hoặc chọn từ danh sách"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              disabled={isLoading || isSubmitting || appliedVoucher}
              onClick={() => !appliedVoucher && setShowVoucherModal(true)}
              style={{ cursor: appliedVoucher ? 'not-allowed' : 'pointer' }}
            />
            {!appliedVoucher ? (
              <>
                <Button
                  variant="outline-primary"
                  onClick={handleApplyVoucher}
                  disabled={isLoading || isSubmitting || isCheckingVoucher || !voucherCode.trim()}
                >
                  {isCheckingVoucher ? <Spinner animation="border" size="sm" /> : "Áp dụng"}
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => setShowVoucherModal(true)}
                  disabled={isLoading || isSubmitting}
                  title="Xem danh sách voucher"
                >
                  <i className="bi bi-list-ul"></i>
                </Button>
              </>
            ) : (
              <Button
                variant="outline-danger"
                onClick={handleRemoveVoucher}
                disabled={isLoading || isSubmitting}
              >
                Xóa
              </Button>
            )}
          </div>
          {appliedVoucher && (
            <small className="text-success d-block mt-2">
              ✓ Đã áp dụng voucher "{appliedVoucher.title}" - Giảm {appliedVoucher.discount}%
            </small>
          )}
        </Form.Group>
        <div className="cart-summary-details mb-3">
          <div className="d-flex justify-content-between">
            <span>Tạm tính:</span>
            <span>{(validTotalPrice || 0).toLocaleString()} VNĐ</span>
          </div>
          {discountAmount > 0 && (
            <div className="d-flex justify-content-between text-success">
              <span>Giảm giá:</span>
              <span>-{(discountAmount || 0).toLocaleString()} VNĐ</span>
            </div>
          )}
          <hr />
          <div className="d-flex justify-content-between fw-bold">
            <span>Tổng thanh toán:</span>
            <span className="text-primary">{(finalTotal || 0).toLocaleString()} VNĐ</span>
          </div>
        </div>
        <Button
          variant="primary"
          className="w-100"
          onClick={handleCheckout}
          disabled={isLoading || isSubmitting}
        >
          {isSubmitting ? <Spinner animation="border" size="sm" /> : "Thanh toán"}
        </Button>
      </Form>

      <VoucherModal
        show={showVoucherModal}
        onHide={() => setShowVoucherModal(false)}
        onSelectVoucher={handleSelectVoucherFromModal}
        currentTotal={validTotalPrice}
      />
    </div>
  );
};

export default CartForm;