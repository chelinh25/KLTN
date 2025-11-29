import { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Header from "../../components/Common/Header/Header";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    document.title = "Xử lý thanh toán - GoTravel";
    processPayment();
  }, []);

  const processPayment = async () => {
    try {
      // Lấy tất cả query params từ VNPay
      const queryString = searchParams.toString();
      
      if (!queryString) {
        navigate("/payment-result?status=error");
        return;
      }

      // Gọi API backend để verify payment
      const response = await api.get(`/api/v1/checkout/verify-payment?${queryString}`);
      
      if (response.data.code === 200) {
        // Thanh toán thành công
        navigate(`/payment-result?status=success&orderCode=${response.data.orderCode}`);
      } else {
        // Thanh toán thất bại
        navigate(`/payment-result?status=fail&message=${encodeURIComponent(response.data.message || "Thanh toán thất bại")}`);
      }
    } catch (error) {
      console.error("Lỗi xử lý thanh toán:", error);
      navigate("/payment-result?status=error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Header />
      <section className="payment-return-section">
        <Container>
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="lg" />
            <h3 className="mt-4">Đang xử lý thanh toán...</h3>
            <p className="text-muted">Vui lòng không tắt trình duyệt</p>
          </div>
        </Container>
      </section>
    </>
  );
};

export default PaymentCallback;
