import { useEffect, useState } from "react";
import { useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import { toast } from "react-toastify";

const CartItem = ({ item, removeItem }) => {
  const { updateQuantity, isLoading } = useContext(CartContext);
  const [quantity, setQuantity] = useState(item.quantity || 1);

  useEffect(() => {
    setQuantity(item.quantity || 1); // Đồng bộ với backend
  }, [item.quantity]);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) {
      setQuantity(1);
      return;
    }
    try {
      setQuantity(newQuantity);
      await updateQuantity(
        item.type,
        item.type === "tour"
          ? { id: item.tour_id, timeDepart: item.timeDepart }
          : { hotel_id: item.hotel_id, room_id: item.room_id },
        newQuantity
      );
    } catch (error) {
      setQuantity(item.quantity || 1);
      console.error("Lỗi khi cập nhật số lượng:", error.message);
    }
  };

  const handleRemove = () => {
    // Hiển thị hộp thoại xác nhận
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa "${item.title || "sản phẩm này"}" khỏi giỏ hàng không?`
    );
    
    if (!isConfirmed) {
      return; // Người dùng hủy bỏ, không thực hiện xóa
    }

    try {
      removeItem(item);
      // Thông báo xóa thành công
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa sản phẩm!");
    }
  };

  return (
    <tr>
      <td>
        {item.image ? (
          <img src={item.image} alt={item.title} className="cart-item-image" />
        ) : (
          <div className="cart-placeholder">No Image</div>
        )}
      </td>
      <td className="cart-item-title"><strong>{item.title || "Không xác định"}</strong></td>
      <td className="cart-item-time">
        {item.type === "tour"
          ? item.timeDepart
            ? new Date(item.timeDepart).toLocaleDateString("vi-VN")
            : "Không xác định"
          : "Không áp dụng"}
      </td>
      <td className="cart-item-price">{item.price ? item.price.toLocaleString() : "0"} VNĐ</td>
      <td>
        <div className="quantity-control">
          <button
            onClick={() => handleQuantityChange(Number(quantity) - 1)}
            disabled={isLoading || quantity <= 1}
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(Number(e.target.value) || 1)}
            min="1"
            disabled={isLoading}
          />
          <button
            onClick={() => handleQuantityChange(Number(quantity) + 1)}
            disabled={isLoading}
          >
            +
          </button>
        </div>
      </td>
      <td className="cart-item-total">{(item.price * quantity).toLocaleString()} VNĐ</td>
      <td>
        <button className="remove-btn" onClick={handleRemove} disabled={isLoading}>
          {isLoading ? (
            <i className="bi bi-spinner bi-spin"></i>
          ) : (
            <i className="bi bi-trash"></i>
          )}{" "}
          Xóa
        </button>
      </td>
    </tr>
  );
};

export default CartItem;