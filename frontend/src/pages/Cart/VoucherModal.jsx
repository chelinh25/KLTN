import { useState, useEffect } from "react";
import { Modal, Button, Card, Spinner, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import api from "../../utils/api";
import "./VoucherModal.css";

const VoucherModal = ({ show, onHide, onSelectVoucher, currentTotal }) => {
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  useEffect(() => {
    if (show) {
      fetchVouchers();
    }
  }, [show]);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/v1/vouchers");
      if (response.data.code === 200) {
        setVouchers(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách voucher:", error);
      toast.error("Không thể tải danh sách voucher!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVoucher = (voucher) => {
    // Kiểm tra điều kiện tối thiểu
    if (voucher.minOrderAmount > 0 && currentTotal < voucher.minOrderAmount) {
      toast.error(
        `Đơn hàng phải có giá trị tối thiểu ${voucher.minOrderAmount.toLocaleString()} VNĐ để áp dụng voucher này!`
      );
      return;
    }

    setSelectedVoucher(voucher);
    onSelectVoucher(voucher);
    onHide();
    toast.success(`Đã chọn voucher "${voucher.title}"`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const calculateDiscount = (voucher) => {
    if (!currentTotal) return 0;
    return Math.round(currentTotal * (voucher.discount / 100));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Chọn mã giảm giá</Modal.Title>
      </Modal.Header>
      <Modal.Body className="voucher-modal-body">
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải danh sách voucher...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">Hiện không có mã giảm giá nào khả dụng</p>
          </div>
        ) : (
          <div className="voucher-list">
            {vouchers.map((voucher) => {
              const isAvailable =
                voucher.minOrderAmount === 0 || currentTotal >= voucher.minOrderAmount;
              const discountAmount = calculateDiscount(voucher);

              return (
                <Card
                  key={voucher._id}
                  className={`voucher-card mb-3 ${!isAvailable ? "disabled" : ""}`}
                >
                  <Card.Body>
                    <div className="voucher-header">
                      <div className="voucher-code-badge">
                        <Badge bg="danger" className="voucher-code">
                          {voucher.code}
                        </Badge>
                        <Badge bg="success" className="ms-2">
                          -{voucher.discount}%
                        </Badge>
                      </div>
                      {isAvailable && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSelectVoucher(voucher)}
                        >
                          Áp dụng
                        </Button>
                      )}
                    </div>
                    <h5 className="voucher-title mt-2">{voucher.title}</h5>
                    <p className="voucher-description text-muted">
                      {voucher.description || "Không có mô tả"}
                    </p>
                    <div className="voucher-info">
                      {voucher.minOrderAmount > 0 && (
                        <div className="info-item">
                          <i className="bi bi-cart-check"></i>
                          <span>
                            Đơn tối thiểu: {voucher.minOrderAmount.toLocaleString()} VNĐ
                          </span>
                        </div>
                      )}
                      {discountAmount > 0 && isAvailable && (
                        <div className="info-item text-success">
                          <i className="bi bi-piggy-bank"></i>
                          <span>
                            Tiết kiệm: {discountAmount.toLocaleString()} VNĐ
                          </span>
                        </div>
                      )}
                      <div className="info-item">
                        <i className="bi bi-calendar-event"></i>
                        <span>
                          HSD: {formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}
                        </span>
                      </div>
                      <div className="info-item">
                        <i className="bi bi-box-seam"></i>
                        <span>Còn lại: {voucher.quantity} mã</span>
                      </div>
                    </div>
                    {!isAvailable && (
                      <div className="voucher-unavailable">
                        <small className="text-danger">
                          Đơn hàng chưa đủ điều kiện để áp dụng voucher này
                        </small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VoucherModal;
