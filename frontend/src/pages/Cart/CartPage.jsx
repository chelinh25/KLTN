import React from "react";
import { Container, Row, Col, Button, Table, Alert, Form } from "react-bootstrap";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CartForm from "./CartForm";
import "./cart.css";

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, isLoading } = useCart();
  const navigate = useNavigate();

  const cartItems = [
    ...cart.tours.flatMap((tour) =>
      tour.timeStarts.map((time) => ({
        type: "tour",
        id: `${tour.tour_id}-${time.timeDepart}`,
        tour_id: tour.tour_id,
        timeDepart: time.timeDepart,
        quantity: time.quantity || 1,
        title: tour.tourInfo?.title || "Tên tour không xác định",
        price: tour.priceNew || tour.tourInfo?.price || 0,
        image: tour.tourInfo.images[0] || "/path/to/fallback-image.jpg",
      })),
    ),
    
    ...cart.hotels.flatMap((hotel) =>
      hotel.rooms.map((room) => ({
        type: "room",
        id: `${hotel.hotel_id}-${room.room_id}`,
        hotel_id: hotel.hotel_id,
        room_id: room.room_id,
        quantity: room.quantity || 1,
        title: `${hotel.hotelInfo?.name || "Khách sạn không xác định"} - ${
          room.roomInfo?.name || "Phòng không xác định"
        }`,
        price: room.price || room.roomInfo?.price || 0,
        image:
          room.roomInfo?.images?.[0] ||
          hotel.hotelInfo?.images?.[0] ||
          "/path/to/fallback-image.jpg",
        checkIn: room.checkIn,
        checkOut: room.checkOut,
        relatedTour: hotel.relatedTour || null,
      }))
    ),
  ];

  const totalPrice = cart.totalPrice || 0;

  const handleQuantityChange = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(
        item.type,
        item.type === "tour"
          ? { id: item.tour_id, timeDepart: item.timeDepart }
          : { hotel_id: item.hotel_id, room_id: item.room_id },
        newQuantity
      );
    } catch (error) {
      // Lỗi đã được xử lý trong updateQuantity
    }
  };

  const handleRemoveItem = async (item) => {
    // Hiển thị hộp thoại xác nhận
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa "${item.title}" khỏi giỏ hàng không?`
    );
    
    if (!isConfirmed) {
      return; // Người dùng hủy bỏ, không thực hiện xóa
    }

    try {
      await removeFromCart(
        item.type,
        item.type === "tour" ? item.tour_id : item.hotel_id,
        item.type === "room" ? item.room_id : undefined
      );
      // Thông báo xóa thành công
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");
    } catch (error) {
      // Lỗi đã được xử lý trong removeFromCart
      toast.error("Có lỗi xảy ra khi xóa sản phẩm!");
    }
  };

  return (
    <>
      <Breadcrumbs title="Giỏ hàng" pagename="Giỏ hàng" />
      <section className="cart_page py-5">
        <Container>
          {isLoading ? (
            <Alert variant="info">Đang tải giỏ hàng...</Alert>
          ) : cartItems.length === 0 ? (
            <Alert variant="info">Giỏ hàng của bạn đang trống.</Alert>
          ) : (
            <Row>
              <Col lg={8}>
                <h4 className="mb-3">Danh sách tour</h4>
                <Table responsive className="cart-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Giá</th>
                      <th>Số lượng</th>
                      <th>Tổng</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems
                      .filter((item) => item.type === "tour")
                      .map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="cart-item-info">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="cart-item-image"
                              />
                              <div>
                                <h5>{item.title}</h5>
                                <p>
                                  Thời gian khởi hành:{" "}
                                  {new Date(item.timeDepart).toLocaleDateString("vi-VN")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>{item.price.toLocaleString()} VNĐ</td>
                          <td>
                            <Form.Control
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(item, parseInt(e.target.value))
                              }
                              min="1"
                              style={{ width: "80px" }}
                              disabled={isLoading}
                            />
                          </td>
                          <td>{(item.price * item.quantity).toLocaleString()} VNĐ</td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveItem(item)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <i className="bi bi-spinner bi-spin"></i>
                              ) : (
                                "Xóa"
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>

                <h4 className="mt-4 mb-3">Danh sách phòng</h4>
                <Table responsive className="cart-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Giá</th>
                      <th>Số lượng</th>
                      <th>Ngày ở</th>
                      <th>Tổng</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems
                      .filter((item) => item.type === "room")
                      .map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="cart-item-info">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="cart-item-image"
                              />
                              <div>
                                <h5>{item.title}</h5>
                                {item.relatedTour && (
                                  <small className="text-muted d-block mt-1">
                                    <i className="bi bi-geo-alt"></i> Tour liên quan: {item.relatedTour.title}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{item.price.toLocaleString()} VNĐ</td>
                          <td>
                            <Form.Control
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(item, parseInt(e.target.value))
                              }
                              min="1"
                              style={{ width: "80px" }}
                              disabled={isLoading}
                            />
                          </td>
                          <td>
                            {item.checkIn && item.checkOut ? (
                              <>
                                Check-in: {new Date(item.checkIn).toLocaleDateString("vi-VN")}<br />
                                Check-out: {new Date(item.checkOut).toLocaleDateString("vi-VN")}
                              </>
                            ) : (
                              "Không xác định"
                            )}
                          </td>
                          <td>{(item.price * item.quantity).toLocaleString()} VNĐ</td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveItem(item)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <i className="bi bi-spinner bi-spin"></i>
                              ) : (
                                "Xóa"
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </Col>
              <Col lg={4}>
                <CartForm totalPrice={totalPrice} />
              </Col>
            </Row>
          )}
        </Container>
      </section>
    </>
  );
};

export default CartPage;