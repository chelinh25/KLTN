import api from "../../utils/api";

const BASE_URL = "http://localhost:3000/api/v1/admin/orders/statistics";
const EXPORT_BASE_URL = "http://localhost:3000/api/v1/admin/orders";

export const getRevenueStatistics = async (params) => {
    try {
        const response = await api.get(BASE_URL, {
            params: {
                ...params,
            },
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
        });

        return response.data;
    } catch (error) {
        // console.error("Lỗi khi lấy dữ liệu thống kê:", error);
        throw error;
    }
};

export const exportExcelReport = async (params) => {
    try {
        const response = await api.get(`${EXPORT_BASE_URL}/export-excel`, {
            params: {
                ...params,
            },
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            responseType: 'blob'
        });

        // Generate filename based on params
        let filename = 'bao-cao-doanh-thu';
        if (params.year) {
            filename += `-${params.year}`;
            if (params.month) {
                filename += `-thang${params.month}`;
            }
        } else if (params.startDate && params.endDate) {
            filename += `-${params.startDate}-den-${params.endDate}`;
        } else {
            filename += `-${Date.now()}`;
        }
        filename += '.xlsx';

        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        
        return { success: true };
    } catch (error) {
        console.error("Lỗi khi xuất báo cáo Excel:", error);
        throw error;
    }
};

export const exportPDFReport = async (params) => {
    try {
        const response = await api.get(`${EXPORT_BASE_URL}/export-pdf`, {
            params: {
                ...params,
            },
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            responseType: 'blob'
        });

        // Generate filename based on params
        let filename = 'bao-cao-doanh-thu';
        if (params.year) {
            filename += `-${params.year}`;
            if (params.month) {
                filename += `-thang${params.month}`;
            }
        } else if (params.startDate && params.endDate) {
            filename += `-${params.startDate}-den-${params.endDate}`;
        } else {
            filename += `-${Date.now()}`;
        }
        filename += '.pdf';

        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        
        return { success: true };
    } catch (error) {
        console.error("Lỗi khi xuất báo cáo PDF:", error);
        throw error;
    }
};