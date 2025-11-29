import React, { createContext, useContext, useState, useEffect } from "react";
import { debounce } from "lodash";
import api from "../utils/api";
import { toast } from "react-toastify";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ tours: [], hotels: [], totalPrice: 0 });
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const debouncedFetchCart = debounce(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/v1/carts/");
      if (response.data) {
        const cartData = {
          tours: response.data.tours || [],
          hotels: response.data.hotels || [],
          totalPrice: response.data.totalPrice || 0,
        };
        setCart(cartData);

        const totalCount = cartData.tours.reduce(
          (sum, tour) =>
            sum +
            tour.timeStarts.reduce((tSum, time) => tSum + (time.quantity || 0), 0),
          0
        ) +
          cartData.hotels.reduce(
            (sum, hotel) =>
              sum + hotel.rooms.reduce((rSum, room) => rSum + (room.quantity || 0), 0),
            0
          );
        setCartCount(totalCount);
      }
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Không thể tải giỏ hàng!");
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const fetchCart = async () => {
    await debouncedFetchCart();
  };

  const addToCart = async (type, item) => {
    try {
      setIsLoading(true);
      if (type === "tour") {
        const payload = {
          timeDepart: item.timeDepart,
          quantity: item.quantity,
        };
        await api.post(`/api/v1/carts/add/${item._id}`, payload);
      } else if (type === "room") {
        const checkInDate = new Date(item.checkIn);
        const checkOutDate = new Date(item.checkOut);
        checkInDate.setHours(7, 0, 0, 0); // Múi giờ +07
        checkOutDate.setHours(7, 0, 0, 0);

        const payload = {
          quantity: item.quantity,
          checkIn: checkInDate.toISOString().split("T")[0],
          checkOut: checkOutDate.toISOString().split("T")[0],
          relatedTourSlug: item.relatedTourSlug || null, // Thêm tourSlug liên quan nếu có
        };
        await api.post(`/api/v1/carts/add/${item.hotelId}/${item.roomId}`, payload);
      }
      await fetchCart();
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Không thể thêm vào giỏ hàng!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (type, item, newQuantity) => {
    try {
      setIsLoading(true);
      if (type === "tour") {
        await api.patch(`/api/v1/carts/update/${item.id}/${item.timeDepart}`, null, {
          params: { quantity: newQuantity },
        });
      } else if (type === "room") {
        await api.patch(`/api/v1/carts/updateRoom/${item.hotel_id}/${item.room_id}`, null, {
          params: { quantity: newQuantity },
        });
      }
      await fetchCart();
      toast.success("Cập nhật số lượng thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Không thể cập nhật số lượng!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (type, id, roomId) => {
    try {
      setIsLoading(true);
      if (type === "tour") {
        await api.patch(`/api/v1/carts/delete/${id}`);
      } else if (type === "room" && roomId) {
        await api.patch(`/api/v1/carts/deleteHotel/${id}/${roomId}`);
      } else if (type === "room") {
        await api.patch(`/api/v1/carts/deleteHotel/${id}`);
      }
      await fetchCart();
      toast.success("Đã xóa khỏi giỏ hàng!");
    } catch (error) {
      console.error("Lỗi khi xóa khỏi giỏ hàng:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Không thể xóa khỏi giỏ hàng!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async (data) => {
    try {
      setIsLoading(true);
      const response = await api.post("/api/v1/checkout/order", data);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn hàng!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      const response = await api.delete("/api/v1/carts");
      console.log("Clear cart response:", response.data);
      setCart({ tours: [], hotels: [] });
      setCartCount(0);
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        checkout,
        fetchCart,
        clearCart,
        cartCount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};