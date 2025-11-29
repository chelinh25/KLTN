import axios from "axios";
import { toast } from "react-toastify";

const BASE_URL = "/api/v1/admin/hotels";

const createApiInstance = (adminToken) => {
    return axios.create({
        baseURL: "http://localhost:3000",
        headers: {
            Authorization: `Bearer ${adminToken || localStorage.getItem("adminToken")}`,
        },
    });
};

export const getHotels = async (adminToken, params = {}) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.get(BASE_URL, { params });
        // console.log("getHotels response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("getHotels error:", err.response?.data || err);
        throw err;
    }
};

export const createHotel = async (formData, adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.post(`${BASE_URL}/create`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        // console.log("createHotel response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("createHotel error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};

export const updateHotel = async (hotelId, formData, adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.patch(`${BASE_URL}/edit/${hotelId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        // console.log("updateHotel response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("updateHotel error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};

export const changeHotelStatus = async (hotelId, status, adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.patch(`${BASE_URL}/changeStatus/${status}/${hotelId}`);
        // console.log("changeHotelStatus response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("changeHotelStatus error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};

export const deleteHotel = async (hotelId, adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.delete(`${BASE_URL}/delete/${hotelId}`);
        // console.log("deleteHotel response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("deleteHotel error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};

export const getRooms = async (hotelId, adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.get(`${BASE_URL}/${hotelId}`);
        // console.log("getRooms response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("getRooms error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};

export const createRoom = async (hotelId, formData, adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.post(`${BASE_URL}/create/${hotelId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        // console.log("createRoom response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("createRoom error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};

export const updateRoom = async (hotelId, roomId, formData, adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.patch(`${BASE_URL}/edit/${hotelId}/${roomId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        // console.log("updateRoom response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("updateRoom error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};

export const deleteRoom = async (hotelId, roomId, adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.delete(`${BASE_URL}/delete/${hotelId}/${roomId}`);
        // console.log("deleteRoom response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("deleteRoom error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};

export const changeRoomStatus = async (hotelId, roomId, status, adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.patch(`${BASE_URL}/changeStatus/${status}/${hotelId}/${roomId}`);
        // console.log("changeRoomStatus response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("changeRoomStatus error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};

export const updateRoomStock = async (hotelId, roomId, stock, adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.patch(`${BASE_URL}/stockRoom/${stock}/${hotelId}/${roomId}`);
        // console.log("updateRoomStock response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (err) {
        console.error("updateRoomStock error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};

export const getAllTours = async (adminToken) => {
    try {
        const api = createApiInstance(adminToken);
        const response = await api.get(`${BASE_URL}/get-all-tours`);
        return response.data;
    } catch (err) {
        console.error("getAllTours error:", JSON.stringify(err.response?.data, null, 2));
        throw err;
    }
};