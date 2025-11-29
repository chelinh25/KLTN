import React, { useEffect, useState } from "react";
import { useParams, NavLink, useNavigate } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import "../Tours/tour.css";
import ImageGallery from "react-image-gallery";
import {
  Container,
  Row,
  Nav,
  Col,
  Tab,
  ListGroup,
  Accordion,
  Card,
  Stack,
  Form,
  Button,
  Modal,
} from "react-bootstrap";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const TourDetails = () => {
  const { slugTour: tourId } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeDepart, setSelectedTimeDepart] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucher, setVoucher] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false); // Trạng thái cho modal xác nhận
  const [isConfirmed, setIsConfirmed] = useState(false); // Trạng thái checkbox
  const [hotels, setHotels] = useState([]); // Danh sách khách sạn liên quan
  const [loadingHotels, setLoadingHotels] = useState(false);

  useEffect(() => {
    if (!tourId || tourId === "undefined") {
      toast.error("ID tour không hợp lệ! Chuyển về trang Tours.");
      navigate("/tours");
      return;
    }

    document.title = "Tours Details - GoTravel";
    window.scrollTo(0, 0);
    fetchTourDetails();
  }, [tourId, navigate]);

  const fetchTourDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/tours/detail/${tourId}`);
      if (!response.data || !response.data._id) {
        throw new Error("Dữ liệu tour không hợp lệ");
      }
      const tourData = response.data;
      tourData.images = tourData.images.map((img) => ({
        original: img,
        thumbnail: img,
      }));
      setTour(tourData);

      // Không tự động chọn ngày, để user tự chọn
      // if (tourData.timeStarts && tourData.timeStarts.length > 0) {
      //   setSelectedTimeDepart(tourData.timeStarts[0].timeDepart);
      // }

      if (tourData.category_id) {
        const categoryResponse = await api.get("/categories");
        const foundCategory = categoryResponse.data.find(
          (cat) => cat._id === tourData.category_id
        );
        setCategory(foundCategory);
      }

      // Lấy danh sách khách sạn liên quan
      fetchHotelsByTour(tourData._id);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết tour:", error);
      const errorMessage = error.response?.data?.message || "Không thể tải chi tiết tour!";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotelsByTour = async (tourId) => {
    setLoadingHotels(true);
    try {
      const response = await api.get(`/hotels/by-tour/${tourId}`);
      if (response.data.code === 200) {
        setHotels(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy khách sạn:", error);
    } finally {
      setLoadingHotels(false);
    }
  };

  const fetchVoucher = async () => {
    if (!voucherCode) return;
    try {
      const response = await api.get(`/vouchers/code/${voucherCode}`);
      setVoucher(response.data);
      toast.success("Áp dụng mã giảm giá thành công!");
    } catch (error) {
      console.error("Lỗi khi lấy voucher:", error);
      toast.error(error.response?.data?.message || "Mã giảm giá không hợp lệ!");
      setVoucher(null);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt tour!");
      navigate("/login");
      return;
    }

    if (!tour || !tour._id) {
      toast.error("Không tìm thấy tour để thêm vào giỏ hàng!");
      return;
    }

    if (!selectedTimeDepart) {
      toast.error("Vui lòng chọn thời gian khởi hành!");
      return;
    }

    if (quantity <= 0) {
      toast.error("Số lượng phải lớn hơn 0!");
      return;
    }

    const selectedTime = tour.timeStarts.find(
      (time) => new Date(time.timeDepart).getTime() === new Date(selectedTimeDepart).getTime()
    );
    if (!selectedTime) {
      toast.error("Thời gian khởi hành không hợp lệ!");
      return;
    }

    if (quantity > selectedTime.stock) {
      toast.error(`Số lượng vượt quá số chỗ còn lại (${selectedTime.stock})!`);
      return;
    }

    const cartItem = {
      _id: tour._id,
      timeDepart: new Date(selectedTimeDepart).toISOString(),
      quantity: parseInt(quantity),
      voucherCode: voucher ? voucher.code : null,
    };

    try {
      await addToCart("tour", cartItem);
      toast.success("Đã thêm tour vào giỏ hàng!");
      navigate("/cart");
    } catch (error) {
      console.error("Lỗi khi thêm tour vào giỏ hàng:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Không thể thêm tour vào giỏ hàng! Vui lòng thử lại.");
    }
  };

  const handleConfirm = () => {
    if (!isConfirmed) {
      toast.error("Vui lòng xác nhận địa điểm khởi hành!");
      return;
    }
    setShowConfirmation(false);
    handleAddToCart();
  };

  if (loading) {
    return <p>Đang tải chi tiết tour...</p>;
  }

  if (!tour) {
    return <p>Không tìm thấy tour.</p>;
  }

  const priceAfterDiscount = tour.price_special || (tour.price * (100 - (tour.discount || 0)) / 100).toFixed(0);

  const totalPriceBeforeDiscount = priceAfterDiscount * quantity;
  const { discountAmount, finalPrice } = voucher
    ? {
        discountAmount: totalPriceBeforeDiscount * (voucher.discount / 100),
        finalPrice: totalPriceBeforeDiscount * (1 - voucher.discount / 100)
      }
    : { discountAmount: 0, finalPrice: totalPriceBeforeDiscount };

  return (
    <>
      <Breadcrumbs
        title={tour.title}
        pagename={<NavLink to="/tours">Tours</NavLink>}
        childpagename={tour.title}
      />

      <section className="tour_details py-5">
        <Container>
          <Row>
            <h1 className="fs-2 font-bold mb-4">{tour.title}</h1>
            <ImageGallery
              items={tour.images}
              showNav={false}
              showBullets={false}
              showPlayButton={false}
            />

            <Tab.Container id="left-tabs-example" defaultActiveKey="1">
              <Row className="py-5">
                <Col md={8} className="mb-3 mb-md-0">
                  <Col md={12}>
                    <Nav variant="pills" className="flex-row nav_bars rounded-2">
                      <Nav.Item>
                        <Nav.Link eventKey="1">Tổng quan</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="2">Lịch trình</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="3">Khách sạn</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="4">Vị trí</Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Col>

                  <Tab.Content className="mt-4">
                    <Tab.Pane eventKey="1">
                      <div className="tour_details-section overview-section">
                        <h1 className="section-title">Tổng quan</h1>
                        <p className="section-content">{tour.information}</p>

                        {category && (
                          <div className="category-section">
                            <h5 className="section-subtitle">Danh mục</h5>
                            <ListGroup className="category-list">
                              <ListGroup.Item className="category-item border-0 pt-0 body-text">
                                {category.title}
                              </ListGroup.Item>
                            </ListGroup>
                          </div>
                        )}

                        <div className="tour-info-section">
                          <h5 className="section-subtitle">Thông tin tour</h5>
                          <ListGroup className="tour-info-list">
                            <ListGroup.Item className="tour-info-item border-0 pt-0 body-text">
                              <strong>Mã tour:</strong> {tour.code}
                            </ListGroup.Item>
                            <ListGroup.Item className="tour-info-item border-0 pt-0 body-text">
                              <strong>Điểm tập trung:</strong> {tour.gathering || "Chưa có thông tin"}
                            </ListGroup.Item>
                            <ListGroup.Item className="tour-info-item border-0 pt-0 body-text">
                              <strong>Số lượng đã bán:</strong> {tour.sold || 0}
                            </ListGroup.Item>
                            <ListGroup.Item className="tour-info-item border-0 pt-0 body-text">
                              <strong>Ngày tạo:</strong>{" "}
                              {new Date(tour.createdAt).toLocaleDateString("vi-VN")}
                            </ListGroup.Item>               
                            <ListGroup.Item className="tour-info-item border-0 pt-0 body-text">
                              <strong>Thời gian khởi hành:</strong>{" "}
                              <Form.Select
                                value={selectedTimeDepart || ""}
                                onChange={(e) => setSelectedTimeDepart(e.target.value)}
                                className="d-inline-block w-auto tour-info-select"
                              >
                                {tour.timeStarts && tour.timeStarts.length > 0 ? (
                                  <>
                                    <option value="" disabled>-- Chọn thời gian khởi hành --</option>
                                    {tour.timeStarts.map((time, index) => (
                                      <option key={index} value={time.timeDepart}>
                                        {new Date(time.timeDepart).toLocaleDateString("vi-VN")} (Còn {time.stock} chỗ)
                                      </option>
                                    ))}
                                  </>
                                ) : (
                                  <option value="">Chưa có ngày khởi hành</option>
                                )}
                              </Form.Select>
                            </ListGroup.Item>
                            <ListGroup.Item className="tour-info-item border-0 pt-0 body-text">
                              <strong>Số lượng:</strong>{" "}
                              <Form.Control
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                className="d-inline-block w-auto"
                              />
                            </ListGroup.Item>
                          </ListGroup>
                        </div>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="2">
                      <div className="tour_details-section schedule-section">
                        <h1 className="section-title">Lịch trình</h1>
                        <Accordion defaultActiveKey="0" className="mt-4">
                          {tour.schedule && tour.schedule.split("\n").length > 0 ? (
                            tour.schedule.split("\n").map((item, index) => (
                              <Accordion.Item eventKey={index.toString()} key={index} className="mb-4">
                                <Accordion.Header>
                                  <h1>Ngày {index + 1}</h1>
                                </Accordion.Header>
                                <Accordion.Body className="body-text">{item}</Accordion.Body>
                              </Accordion.Item>
                            ))
                          ) : (
                            <p>Chưa có lịch trình</p>
                          )}
                        </Accordion>
                      </div>
                    </Tab.Pane>
                    <Tab.Pane eventKey="3">
                      <div className="tour_details-section hotels-section">
                        <h1 className="section-title">Khách sạn phù hợp với tour</h1>
                        {loadingHotels ? (
                          <p>Đang tải danh sách khách sạn...</p>
                        ) : hotels.length > 0 ? (
                          <Row className="mt-4">
                            {hotels.map((hotel) => (
                              <Col md={6} key={hotel._id} className="mb-4">
                                <Card className="h-100 shadow-sm">
                                  {hotel.images && hotel.images.length > 0 && (
                                    <Card.Img 
                                      variant="top" 
                                      src={hotel.images[0]} 
                                      style={{ height: '200px', objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
                                      }}
                                    />
                                  )}
                                  <Card.Body>
                                    <Card.Title className="fw-bold">{hotel.name}</Card.Title>
                                    <Card.Text>
                                      <small className="text-muted">
                                        <i className="bi bi-geo-alt-fill"></i> {hotel.location?.city} - {hotel.location?.address}
                                      </small>
                                    </Card.Text>
                                    {hotel.description && (
                                      <Card.Text className="text-truncate-3">
                                        {hotel.description}
                                      </Card.Text>
                                    )}
                                    {hotel.rooms && hotel.rooms.length > 0 && (
                                      <div className="mt-3">
                                        <h6 className="fw-bold">Phòng có sẵn:</h6>
                                        <ListGroup variant="flush">
                                          {hotel.rooms.slice(0, 3).map((room) => (
                                            <ListGroup.Item key={room._id} className="px-0">
                                              <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                  <strong>{room.name}</strong>
                                                  <br />
                                                  <small className="text-muted">Còn {room.availableRooms} phòng</small>
                                                </div>
                                                <span className="text-primary fw-bold">
                                                  {Number(room.price).toLocaleString()} VNĐ/đêm
                                                </span>
                                              </div>
                                            </ListGroup.Item>
                                          ))}
                                        </ListGroup>
                                        {hotel.rooms.length > 3 && (
                                          <small className="text-muted">Và {hotel.rooms.length - 3} phòng khác...</small>
                                        )}
                                      </div>
                                    )}
                                    <Button 
                                      variant="primary" 
                                      className="w-100 mt-3"
                                      onClick={() => navigate(`/hotel-details/${hotel._id}?tourSlug=${tour.slug}&tourTitle=${encodeURIComponent(tour.title)}`)}
                                    >
                                      Xem chi tiết & Đặt phòng
                                    </Button>
                                  </Card.Body>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-muted">Hiện tại chưa có khách sạn liên quan đến tour này.</p>
                          </div>
                        )}
                      </div>
                    </Tab.Pane>
                    <Tab.Pane eventKey="4">
                      <div className="tour_details-section location-section">
                        <h1 className="section-title">Vị trí</h1>
                        {tour.location?.latitude && tour.location?.longitude ? (
                          <iframe
                            src={`https://maps.google.com/maps?q=${tour.location.latitude},${tour.location.longitude}&hl=vi&z=15&output=embed`}
                            width="100%"
                            height="400px"
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        ) : (
                          <p>Chưa có thông tin vị trí chính xác. Điểm tập trung: {tour.gathering || "Chưa có thông tin"}</p>
                        )}
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Col>

                <Col md={4}>
                  <aside>
                    <Card className="rounded-3 p-2 shadow-sm mb-4 price-info">
                      <Card.Body>
                        <Stack gap={2} direction="horizontal">
                          <h1 className="font-bold mb-0 h2">{Number(finalPrice).toLocaleString()} VNĐ</h1>
                          <span className="fs-4"> /người</span>
                        </Stack>
                        {tour.discount > 0 && (
                          <p className="text-muted">
                            <del>{tour.price.toLocaleString()} VNĐ</del> (Giảm {tour.discount}%)
                          </p>
                        )}
                        {voucher && (
                          <p className="text-success">
                            Giảm thêm {voucher.discount}%: -{Number(discountAmount).toLocaleString()} VNĐ
                          </p>
                        )}
                        <Button
                          className="btn btn-primary w-100 mt-3"
                          onClick={() => setShowConfirmation(true)}
                        >
                          Đặt Tour
                        </Button>
                      </Card.Body>
                    </Card>
                  </aside>
                </Col>
              </Row>
            </Tab.Container>
          </Row>
        </Container>
      </section>

      {/* Modal xác nhận */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận đặt tour</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Địa điểm khởi hành hiện tại chỉ đang ở <strong>Đà Nẵng, Quảng Nam</strong>.</p>
          <Form.Check
            type="checkbox"
            label="Tôi xác nhận đã đọc và đồng ý với thông tin trên."
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!isConfirmed}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TourDetails;