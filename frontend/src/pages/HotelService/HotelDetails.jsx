import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import api from "../../utils/api";
import { toast } from "react-toastify";
import {
  Container,
  Row,
  Col,
  Tab,
  Nav,
  Card,
  Stack,
  Table,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import ImageGallery from "react-image-gallery";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./hotel.css";

const HotelDetails = () => {
  const { hotelId } = useParams();
  const location = useLocation();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [fetchReviewError, setFetchReviewError] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(null);
  const [relatedTour, setRelatedTour] = useState(null); // Thông tin tour liên quan
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Chi tiết khách sạn - GoTravel";
    window.scrollTo(0, 0);
    fetchHotelDetails();
    
    // Lấy tourSlug từ URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const tourSlug = searchParams.get('tourSlug');
    const tourTitle = searchParams.get('tourTitle');
    if (tourSlug && tourTitle) {
      setRelatedTour({ slug: tourSlug, title: decodeURIComponent(tourTitle) });
    }
  }, [hotelId, location.search]);

  const fetchHotelDetails = async () => {
    setLoading(true);
    setFetchReviewError(false);
    try {
      const response = await api.get(`/hotels/${hotelId}`);
      if (response.data.code === 200) {
        setHotel(response.data.hotel);
        setRooms(response.data.rooms);

        const reviewsData = {};
        let hasError = false;
        for (const room of response.data.rooms) {
          try {
            const reviewsResponse = await api.get(`/reviews/get/${hotelId}/${room._id}`);
            if (reviewsResponse.data.code === 200) {
              reviewsData[room._id] = reviewsResponse.data.reviews || [];
            } else {
              console.warn(`Không lấy được đánh giá cho phòng ${room._id}:`, reviewsResponse.data.message);
              reviewsData[room._id] = [];
            }
          } catch (error) {
            console.warn(`Lỗi khi lấy đánh giá cho phòng ${room._id}:`, error.message);
            reviewsData[room._id] = [];
            hasError = true;
          }
        }
        setReviews(reviewsData);
        if (hasError) {
          setFetchReviewError(true);
          toast.warn("Không thể lấy một số đánh giá. Vui lòng thử lại sau!");
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết khách sạn:", error);
      toast.error("Không thể tải chi tiết khách sạn!");
    } finally {
      setLoading(false);
    }
  };

  const galleryImages = hotel?.images.map((img) => ({
    original: img,
    thumbnail: img,
  })) || [];

  const handleAddToCart = async (roomId, quantity) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt phòng!");
      navigate("/login");
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error("Vui lòng chọn ngày check-in và check-out!");
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const minCheckOutDate = new Date(checkInDate.getTime() + 86400000); // +1 ngày

    if (checkInDate >= checkOutDate) {
      toast.error("Ngày check-out phải sau ngày check-in!");
      return;
    }

    const numNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    if (numNights < 1) {
      toast.error("Số đêm phải ít nhất là 1!");
      return;
    }

    // Chuẩn hóa múi giờ +07 (Vietnam)
    checkInDate.setHours(7, 0, 0, 0);
    checkOutDate.setHours(7, 0, 0, 0);

    try {
      await addToCart("room", {
        hotelId,
        roomId,
        quantity,
        checkIn: checkInDate.toISOString().split("T")[0], // Gửi lại định dạng YYYY-MM-DD
        checkOut: checkOutDate.toISOString().split("T")[0],
        relatedTourSlug: relatedTour?.slug || null, // Thêm tourSlug nếu có
      });
      toast.success("Đã thêm phòng vào giỏ hàng!");
      
      // Nếu có tour liên quan, điều hướng về trang tour, nếu không thì về cart
      if (relatedTour?.slug) {
        navigate(`/tours/detail/${relatedTour.slug}`);
        toast.info("Quay lại trang tour để tiếp tục đặt tour!");
      } else {
        navigate("/cart");
      }
    } catch (error) {
      console.error("Lỗi khi thêm phòng vào giỏ hàng:", error);
      toast.error(error.response?.data?.message || "Không thể thêm vào giỏ hàng!");
    }
  };

  const calculateAverageRating = (roomId) => {
    const roomReviews = reviews[roomId] || [];
    if (roomReviews.length === 0) return 0;
    const totalRating = roomReviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / roomReviews.length).toFixed(1);
  };

  const hasUserReviewed = (roomId) => {
    if (!user) return false;
    const roomReviews = reviews[roomId] || [];
    return roomReviews.some((review) => review.user_id._id.toString() === user._id.toString());
  };

  const handleSubmitReview = async (roomId) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đánh giá!");
      navigate("/login");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Vui lòng nhập bình luận!");
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await api.post(`/reviews/${hotelId}/${roomId}`, {
        rating: newRating,
        comment: newComment,
      });
      if (response.data.code === 200) {
        toast.success("Đánh giá thành công!");
        setNewComment("");
        setNewRating(5);
        setFetchReviewError(false);
        fetchHotelDetails();
      } else if (response.data.code === 400) {
        toast.error(response.data.message || "Đánh giá thất bại!");
      } else {
        toast.error("Có lỗi xảy ra khi gửi đánh giá!");
      }
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      if (error.response?.data?.code === 400) {
        toast.error(error.response.data.message || "Bạn đã đánh giá phòng này rồi!");
      } else {
        toast.error(error.response?.data?.message || "Đánh giá thất bại!");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để xóa đánh giá!");
      navigate("/login");
      return;
    }

    setDeletingReview(reviewId);
    try {
      const response = await api.delete(`/reviews/delete/${reviewId}`);
      if (response.data.code === 200) {
        toast.success("Xóa đánh giá thành công!");
        setFetchReviewError(false);
        fetchHotelDetails();
      } else if (response.data.code === 404) {
        toast.error(response.data.message || "Xóa thất bại!");
      } else {
        toast.error("Có lỗi xảy ra khi xóa đánh giá!");
      }
    } catch (error) {
      console.error("Lỗi khi xóa đánh giá:", error);
      toast.error(error.response?.data?.message || "Xóa thất bại!");
    } finally {
      setDeletingReview(null);
    }
  };

  return (
    <>
      <Breadcrumbs
        title={hotel?.name || "Chi tiết khách sạn"}
        pagename="Dịch vụ khách sạn"
        childpagename={hotel?.name || "Chi tiết"}
      />
      <section className="hotel-section">
        <Container>
          {relatedTour && (
            <Alert variant="info" className="mb-4">
              <i className="bi bi-info-circle"></i> <strong>Chọn khách sạn cho tour:</strong> {relatedTour.title}
              <br />
              <small>Sau khi đặt phòng, bạn sẽ quay lại trang tour để hoàn tất đặt tour.</small>
            </Alert>
          )}
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Đang tải chi tiết khách sạn...</p>
            </div>
          ) : !hotel ? (
            <Alert variant="danger">Không tìm thấy khách sạn.</Alert>
          ) : (
            <Row>
              <h1 className="hotel-details-title mb-4">{hotel.name}</h1>
              <div className="hotel-gallery">
                <ImageGallery
                  items={galleryImages}
                  showNav={false}
                  showBullets={false}
                  showPlayButton={false}
                />
              </div>

              <Tab.Container id="hotel-tabs" defaultActiveKey="1">
                <Row className="py-5">
                  <Col md={8} className="mb-3 mb-md-0">
                    <Col md={12}>
                      <Nav variant="pills" className="hotel-nav rounded-2">
                        <Nav.Item>
                          <Nav.Link eventKey="1">Tổng quan</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="2">Phòng</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="3">Vị trí</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="4">Đánh giá</Nav.Link>
                        </Nav.Item>
                      </Nav>
                    </Col>

                    <Tab.Content className="hotel-content-details mt-4">
                      <Tab.Pane eventKey="1">
                        <h1 className="h3">Tổng quan</h1>
                        <p className="body-text">{hotel.description || "Chưa có mô tả."}</p>

                        <h5 className="font-bold mb-2 h5 mt-3">Thông tin khách sạn</h5>
                        <ul className="list-group">
                          <li className="list-group-item body-text">
                            <strong>Địa điểm:</strong> {hotel.location.city},{" "}
                            {hotel.location.country}
                          </li>
                          <li className="list-group-item body-text">
                            <strong>Địa chỉ:</strong> {hotel.location.address}
                          </li>
                        </ul>
                      </Tab.Pane>

                      <Tab.Pane eventKey="2">
                        <h1 className="h3">Danh sách phòng</h1>
                        <Form className="hotel-form mb-4">
                          <Row>
                            <Col md={6}>
                              <Form.Group controlId="checkIn">
                                <Form.Label>Ngày check-in</Form.Label>
                                <Form.Control
                                  type="date"
                                  value={checkIn}
                                  onChange={(e) => setCheckIn(e.target.value)}
                                  min={new Date().toISOString().split("T")[0]}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group controlId="checkOut">
                                <Form.Label>Ngày check-out</Form.Label>
                                <Form.Control
                                  type="date"
                                  value={checkOut}
                                  onChange={(e) => setCheckOut(e.target.value)}
                                  min={
                                    checkIn
                                      ? new Date(new Date(checkIn).getTime() + 86400000)
                                          .toISOString()
                                          .split("T")[0]
                                      : new Date().toISOString().split("T")[0]
                                  }
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          {checkIn && checkOut && (
                            <p className="hotel-date-info mt-3">
                              Số đêm: {Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))} đêm
                            </p>
                          )}
                        </Form>

                        {rooms.length === 0 ? (
                          <Alert variant="info">Khách sạn này hiện không có phòng nào.</Alert>
                        ) : (
                          <Table striped bordered hover className="hotel-table">
                            <thead>
                              <tr>
                                <th>Tên phòng</th>
                                <th>Giá (VNĐ/đêm)</th>
                                <th>Tiện ích</th>
                                <th>Số phòng trống</th>
                                <th>Hành động</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rooms.map((room) => (
                                <tr key={room._id}>
                                  <td>{room.name}</td>
                                  <td>{room.price.toLocaleString()}</td>
                                  <td>{room.amenities || "Không có"}</td>
                                  <td>{room.availableRooms}</td>
                                  <td>
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => handleAddToCart(room._id, 1)}
                                      disabled={room.availableRooms === 0}
                                    >
                                      <i className="bi bi-cart-plus"></i> Đặt phòng
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                        {checkIn && checkOut && (
                          <p className="hotel-date-info mt-3">
                            Bạn đã chọn: Check-in <strong>{checkIn}</strong>, Check-out{" "}
                            <strong>{checkOut}</strong>
                          </p>
                        )}
                      </Tab.Pane>

                      <Tab.Pane eventKey="3">
                        <h1 className="h3">Vị trí</h1>
                        <div className="hotel-map">
                          {hotel.location?.latitude && hotel.location?.longitude ? (
                            <iframe
                              src={`https://maps.google.com/maps?q=${hotel.location.latitude},${hotel.location.longitude}&hl=vi&z=15&output=embed`}
                              width="100%"
                              height="400px"
                              allowFullScreen=""
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                          ) : (
                            <Alert variant="info">Chưa có thông tin vị trí chính xác cho khách sạn này.</Alert>
                          )}
                        </div>
                      </Tab.Pane>

                      <Tab.Pane eventKey="4">
                        <h1 className="h3 mb-4">Đánh giá</h1>
                        {fetchReviewError && (
                          <Alert variant="warning">
                            Không thể lấy một số đánh giá do lỗi hệ thống. Vui lòng thử lại sau!
                          </Alert>
                        )}
                        {rooms.length > 0 ? (
                          rooms.map((room) => {
                            const roomReviews = reviews[room._id] || [];
                            const avgRating = calculateAverageRating(room._id);
                            return (
                              <div key={room._id} className="mb-5">
                                <h5 className="font-bold mb-3 h5">
                                  Đánh giá cho {room.name}: {avgRating}/5{" "}
                                  <span className="text-warning">
                                    {"★".repeat(Math.round(avgRating))}
                                    {"☆".repeat(5 - Math.round(avgRating))}
                                  </span>{" "}
                                  ({roomReviews.length} đánh giá)
                                </h5>
                                {roomReviews.length > 0 ? (
                                  <div className="review-list">
                                    {roomReviews.map((review, index) => (
                                      <Card key={index} className="mb-3 shadow-sm">
                                        <Card.Body>
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="d-flex align-items-center">
                                              {review.user_id.avatar && (
                                                <img
                                                  src={review.user_id.avatar}
                                                  alt={review.user_id.fullName}
                                                  className="rounded-circle me-2"
                                                  style={{ width: "30px", height: "30px" }}
                                                />
                                              )}
                                              <strong>{review.user_id.fullName}</strong>
                                              <span className="text-warning ms-2">
                                                {"★".repeat(review.rating)}
                                                {"☆".repeat(5 - review.rating)}
                                              </span>
                                            </div>
                                            {user &&
                                              review.user_id._id.toString() === user._id.toString() && (
                                                <Button
                                                  variant="danger"
                                                  size="sm"
                                                  onClick={() => handleDeleteReview(review._id)}
                                                  disabled={deletingReview === review._id}
                                                >
                                                  {deletingReview === review._id ? (
                                                    <Spinner
                                                      as="span"
                                                      animation="border"
                                                      size="sm"
                                                      className="me-1"
                                                    />
                                                  ) : (
                                                    <i className="bi bi-trash"></i>
                                                  )}
                                                  Xóa
                                                </Button>
                                              )}
                                          </div>
                                          <p className="mb-1">{review.comment}</p>
                                          <small className="text-muted">
                                            {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                                          </small>
                                        </Card.Body>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <Alert variant="info">Chưa có đánh giá nào cho phòng này.</Alert>
                                )}
                                {user && !hasUserReviewed(room._id) && (
                                  <Card className="mt-4 shadow-sm">
                                    <Card.Body>
                                      <h6 className="mb-3">Viết đánh giá của bạn</h6>
                                      <Form>
                                        <Form.Group className="mb-3">
                                          <Form.Label>Điểm đánh giá</Form.Label>
                                          <Form.Select
                                            value={newRating}
                                            onChange={(e) => setNewRating(parseInt(e.target.value))}
                                          >
                                            {[1, 2, 3, 4, 5].map((rate) => (
                                              <option key={rate} value={rate}>
                                                {rate} sao
                                              </option>
                                            ))}
                                          </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                          <Form.Label>Bình luận</Form.Label>
                                          <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Viết đánh giá của bạn..."
                                          />
                                        </Form.Group>
                                        <Button
                                          variant="primary"
                                          onClick={() => handleSubmitReview(room._id)}
                                          disabled={submittingReview}
                                        >
                                          {submittingReview ? (
                                            <>
                                              <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                className="me-2"
                                              />
                                              Đang gửi...
                                            </>
                                          ) : (
                                            "Gửi đánh giá"
                                          )}
                                        </Button>
                                      </Form>
                                    </Card.Body>
                                  </Card>
                                )}
                                {user && hasUserReviewed(room._id) && (
                                  <Alert variant="info" className="mt-3">
                                    Bạn đã đánh giá phòng này rồi.
                                  </Alert>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <Alert variant="info">Chưa có phòng nào để đánh giá.</Alert>
                        )}
                      </Tab.Pane>
                    </Tab.Content>
                  </Col>

                  <Col md={4}>
                    <aside>
                      <Card className="hotel-price-card mb-4 shadow-sm">
                        <Card.Body>
                          <Stack gap={2} direction="horizontal">
                            <h1 className="h2">
                              {rooms.length > 0
                                ? `${Math.min(...rooms.map((r) => r.price)).toLocaleString()} VNĐ`
                                : "Liên hệ"}
                            </h1>
                            <span className="fs-4"> /đêm</span>
                          </Stack>
                          <Button
                            variant="primary"
                            className="w-100 mt-3"
                            href="#rooms"
                            onClick={() => document.querySelector("#hotel-tabs-tab-2").click()}
                          >
                            Xem phòng
                          </Button>
                        </Card.Body>
                      </Card>

                      <Card className="hotel-support-card shadow-sm">
                        <Card.Body>
                          <h1 className="h3">Cần giúp đỡ?</h1>
                          <ul className="list-group">
                            <li className="list-group-item">
                              <i className="bi bi-telephone me-1"></i> Gọi cho chúng tôi{" "}
                              <strong>+84 779407905</strong>
                            </li>
                            <li className="list-group-item">
                              <i className="bi bi-alarm me-1"></i> Thời gian:{" "}
                              <strong>8AM to 7PM</strong>
                            </li>
                            <li className="list-group-item">
                              <strong>
                                <i className="bi bi-headset me-1"></i> Hãy để chúng tôi gọi bạn
                              </strong>
                            </li>
                            <li className="list-group-item">
                              <i className="bi bi-calendar-check me-1"></i>{" "}
                              <strong>Đặt lịch hẹn</strong>
                            </li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </aside>
                  </Col>
                </Row>
              </Tab.Container>
            </Row>
          )}
        </Container>
      </section>
    </>
  );
};

export default HotelDetails;