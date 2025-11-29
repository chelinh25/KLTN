import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    InputBase,
    Paper,
    CircularProgress,
    Typography,
    IconButton,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    getVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    getVoucherDetail,
} from "./VoucherApi";
import { useAdminAuth } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";

const VoucherControl = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { adminToken } = useAdminAuth();
    const navigate = useNavigate();
    const [vouchers, setVouchers] = useState([]);
    const [allVouchers, setAllVouchers] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [sortOption, setSortOption] = useState("stt_asc");
    const [sortModel, setSortModel] = useState([]);
    const [open, setOpen] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    const [deleteVoucherId, setDeleteVoucherId] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [currentVoucher, setCurrentVoucher] = useState(null);
    const [newVoucher, setNewVoucher] = useState({
        title: "",
        code: "",
        description: "",
        quantity: "",
        discount: "",
        minOrderAmount: 0,
        startDate: "",
        endDate: "",
    });
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const limitItems = 10;
    const [totalPages, setTotalPages] = useState(1);

    // Chuẩn hóa từ khóa tìm kiếm
    const normalizeSearchText = (text) => {
        return text
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    // Lấy danh sách voucher
    const fetchVouchers = useCallback(
        async (page = 1, search = "", sortKey = "", sortValue = "") => {
            setLoading(true);
            try {
                const params = { page, limit: limitItems };
                if (search) params.search = search;
                if (sortKey && sortValue) {
                    params.sortKey = sortKey;
                    params.sortValue = sortValue;
                }
                const response = await getVouchers(params);
                console.log("fetchVouchers response:", response);
                if (response && Array.isArray(response.vouchers)) {
                    const totalRecords = response.totalRecords || response.vouchers.length;
                    const formattedData = response.vouchers.map((item, index) => {
                        let stt;
                        if (sortKey === "_id" && sortValue === "desc") {
                            stt = totalRecords - ((page - 1) * limitItems + index);
                        } else {
                            stt = (page - 1) * limitItems + index + 1;
                        }
                        return {
                            ...item,
                            id: item._id,
                            stt: stt,
                            status: new Date(item.endDate) < new Date() ? "expired" : "active",
                            formattedEndDate: new Date(item.endDate).toLocaleString("vi-VN"),
                        };
                    });
                    setAllVouchers(formattedData);
                    setVouchers(formattedData);
                    setTotalPages(response.totalPage || 1);
                    if (formattedData.length === 0) {
                        toast.info("Không có voucher nào để hiển thị!", { position: "top-right" });
                    }
                } else {
                    setError("Dữ liệu voucher không hợp lệ!");
                    toast.error("Dữ liệu voucher không hợp lệ!", { position: "top-right" });
                    setVouchers([]);
                    setAllVouchers([]);
                    setTotalPages(1);
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Không thể tải danh sách voucher!";
                setError(errorMessage);
                toast.error(errorMessage, { position: "top-right" });
                console.error("Fetch vouchers error:", err.response?.data);
                if (err.response?.status === 401) {
                    toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
                    localStorage.removeItem("adminToken");
                    navigate("/loginadmin");
                }
            } finally {
                setLoading(false);
            }
        },
        [limitItems, navigate]
    );

    // Khởi tạo dữ liệu
    useEffect(() => {
        const token = adminToken || localStorage.getItem("adminToken");
        if (token) {
            fetchVouchers(currentPage);
        } else {
            toast.error("Vui lòng đăng nhập để tiếp tục!", { position: "top-right" });
            setTimeout(() => {
                navigate("/loginadmin");
            }, 2000);
        }
    }, [adminToken, navigate, currentPage, fetchVouchers]);

    // Xử lý tìm kiếm
    const handleSearch = async (e) => {
        e.preventDefault();
        setIsSearching(true);
        try {
            setCurrentPage(1);
            let sortKey = "";
            let sortValue = "";
            switch (sortOption) {
                case "stt_asc":
                    sortKey = "_id";
                    sortValue = "asc";
                    break;
                case "stt_desc":
                    sortKey = "_id";
                    sortValue = "desc";
                    break;
                case "code_asc":
                    sortKey = "code";
                    sortValue = "asc";
                    break;
                case "code_desc":
                    sortKey = "code";
                    sortValue = "desc";
                    break;
                case "title_asc":
                    sortKey = "title";
                    sortValue = "asc";
                    break;
                case "title_desc":
                    sortKey = "title";
                    sortValue = "desc";
                    break;
                case "discount_asc":
                    sortKey = "discount";
                    sortValue = "asc";
                    break;
                case "discount_desc":
                    sortKey = "discount";
                    sortValue = "desc";
                    break;
                case "quantity_asc":
                    sortKey = "quantity";
                    sortValue = "asc";
                    break;
                case "quantity_desc":
                    sortKey = "quantity";
                    sortValue = "desc";
                    break;
                case "endDate_asc":
                    sortKey = "endDate";
                    sortValue = "asc";
                    break;
                case "endDate_desc":
                    sortKey = "endDate";
                    sortValue = "desc";
                    break;
                default:
                    break;
            }
            const normalizedValue = normalizeSearchText(searchText);
            await fetchVouchers(1, normalizedValue, sortKey, sortValue);
        } finally {
            setIsSearching(false);
        }
    };

    // Xử lý thay đổi văn bản tìm kiếm
    const handleSearchTextChange = (e) => {
        setSearchText(e.target.value);
    };

    // Xử lý thay đổi sắp xếp
    const handleSortChange = (event) => {
        const value = event.target.value;
        setSortOption(value);
        setCurrentPage(1);
        let sortKey = "";
        let sortValue = "";
        let sortField = "";
        switch (value) {
            case "stt_asc":
                sortKey = "_id";
                sortValue = "asc";
                sortField = "stt";
                break;
            case "stt_desc":
                sortKey = "_id";
                sortValue = "desc";
                sortField = "stt";
                break;
            case "code_asc":
                sortKey = "code";
                sortValue = "asc";
                sortField = "code";
                break;
            case "code_desc":
                sortKey = "code";
                sortValue = "desc";
                sortField = "code";
                break;
            case "title_asc":
                sortKey = "title";
                sortValue = "asc";
                sortField = "title";
                break;
            case "title_desc":
                sortKey = "title";
                sortValue = "desc";
                sortField = "title";
                break;
            case "discount_asc":
                sortKey = "discount";
                sortValue = "asc";
                sortField = "discount";
                break;
            case "discount_desc":
                sortKey = "discount";
                sortValue = "desc";
                sortField = "discount";
                break;
            case "quantity_asc":
                sortKey = "quantity";
                sortValue = "asc";
                sortField = "quantity";
                break;
            case "quantity_desc":
                sortKey = "quantity";
                sortValue = "desc";
                sortField = "quantity";
                break;
            case "endDate_asc":
                sortKey = "endDate";
                sortValue = "asc";
                sortField = "formattedEndDate";
                break;
            case "endDate_desc":
                sortKey = "endDate";
                sortValue = "desc";
                sortField = "formattedEndDate";
                break;
            default:
                break;
        }
        const normalizedValue = normalizeSearchText(searchText);
        fetchVouchers(1, normalizedValue, sortKey, sortValue);
        if (sortKey && sortValue) {
            setSortModel([{ field: sortField, sort: sortValue }]);
        } else {
            setSortModel([]);
        }
    };

    // Xử lý sắp xếp từ DataGrid
    const handleSortModelChange = (newSortModel) => {
        setSortModel(newSortModel);
        setCurrentPage(1);
        if (newSortModel.length > 0) {
            const { field, sort } = newSortModel[0];
            let sortKey = "";
            let sortOptionValue = "";
            switch (field) {
                case "stt":
                    sortKey = "_id";
                    sortOptionValue = sort === "asc" ? "stt_asc" : "stt_desc";
                    break;
                case "code":
                    sortKey = "code";
                    sortOptionValue = sort === "asc" ? "code_asc" : "code_desc";
                    break;
                case "title":
                    sortKey = "title";
                    sortOptionValue = sort === "asc" ? "title_asc" : "title_desc";
                    break;
                case "discount":
                    sortKey = "discount";
                    sortOptionValue = sort === "asc" ? "discount_asc" : "discount_desc";
                    break;
                case "quantity":
                    sortKey = "quantity";
                    sortOptionValue = sort === "asc" ? "quantity_asc" : "quantity_desc";
                    break;
                case "formattedEndDate":
                    sortKey = "endDate";
                    sortOptionValue = sort === "asc" ? "endDate_asc" : "endDate_desc";
                    break;
                default:
                    break;
            }
            if (sortKey) {
                setSortOption(sortOptionValue);
                const normalizedValue = normalizeSearchText(searchText);
                fetchVouchers(1, normalizedValue, sortKey, sort);
            }
        } else {
            setSortOption("none");
            const normalizedValue = normalizeSearchText(searchText);
            fetchVouchers(1, normalizedValue);
        }
    };

    // Xử lý thay đổi trang
    const handlePageChange = (event, value) => {
        setCurrentPage(value);
        let sortKey = "";
        let sortValue = "";
        switch (sortOption) {
            case "stt_asc":
                sortKey = "_id";
                sortValue = "asc";
                break;
            case "stt_desc":
                sortKey = "_id";
                sortValue = "desc";
                break;
            case "code_asc":
                sortKey = "code";
                sortValue = "asc";
                break;
            case "code_desc":
                sortKey = "code";
                sortValue = "desc";
                break;
            case "title_asc":
                sortKey = "title";
                sortValue = "asc";
                break;
            case "title_desc":
                sortKey = "title";
                sortValue = "desc";
                break;
            case "discount_asc":
                sortKey = "discount";
                sortValue = "asc";
                break;
            case "discount_desc":
                sortKey = "discount";
                sortValue = "desc";
                break;
            case "quantity_asc":
                sortKey = "quantity";
                sortValue = "asc";
                break;
            case "quantity_desc":
                sortKey = "quantity";
                sortValue = "desc";
                break;
            case "endDate_asc":
                sortKey = "endDate";
                sortValue = "asc";
                break;
            case "endDate_desc":
                sortKey = "endDate";
                sortValue = "desc";
                break;
            default:
                break;
        }
        const normalizedValue = normalizeSearchText(searchText);
        fetchVouchers(value, normalizedValue, sortKey, sortValue);
    };

    const handleOpen = () => {
        setIsEdit(false);
        setNewVoucher({
            title: "",
            code: "",
            description: "",
            quantity: "",
            discount: "",
            minOrderAmount: 0,
            startDate: "",
            endDate: "",
        });
        setError("");
        setOpen(true);
    };

    const handleEdit = (voucher) => {
        setIsEdit(true);
        setCurrentId(voucher._id);
        const formatDate = (date) => {
            if (!date) return "";
            const parsedDate = new Date(date);
            return isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString().split("T")[0];
        };
        setNewVoucher({
            title: voucher.title || "",
            code: voucher.code || "",
            description: voucher.description || "",
            quantity: voucher.quantity || "",
            discount: voucher.discount || "",
            minOrderAmount: voucher.minOrderAmount || 0,
            startDate: formatDate(voucher.startDate),
            endDate: formatDate(voucher.endDate),
        });
        setError("");
        setOpen(true);
    };

    const handleOpenDetail = async (voucher) => {
        setLoading(true);
        try {
            const response = await getVoucherDetail(voucher._id);
            if (response.code === 200) {
                setCurrentVoucher(response.data);
                setOpenDetail(true);
            } else {
                toast.error(response.message || "Không thể tải chi tiết voucher!", { position: "top-right" });
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Không thể tải chi tiết voucher!";
            toast.error(errorMessage, { position: "top-right" });
            console.error("Get voucher detail error:", err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setError("");
    };

    const handleCloseDetail = () => {
        setOpenDetail(false);
        setCurrentVoucher(null);
    };

    const handleOpenDeleteConfirm = (id) => {
        setDeleteVoucherId(id);
        setOpenDeleteConfirm(true);
    };

    const handleCloseDeleteConfirm = () => {
        setOpenDeleteConfirm(false);
        setDeleteVoucherId(null);
    };

    const handleAdd = async () => {
        if (
            !newVoucher.title ||
            !newVoucher.code ||
            !newVoucher.description ||
            !newVoucher.quantity ||
            !newVoucher.discount ||
            !newVoucher.startDate ||
            !newVoucher.endDate
        ) {
            setError("Vui lòng điền đầy đủ thông tin!");
            return;
        }
        if (newVoucher.quantity <= 0 || newVoucher.discount <= 0 || newVoucher.discount > 100) {
            setError("Số lượng và % giảm giá phải lớn hơn 0, % giảm giá không quá 100!");
            return;
        }
        if (new Date(newVoucher.startDate) > new Date(newVoucher.endDate)) {
            setError("Ngày bắt đầu phải trước ngày hết hạn!");
            return;
        }
        setLoading(true);
        try {
            const response = await createVoucher(newVoucher);
            if (response.code === 200) {
                const normalizedValue = normalizeSearchText(searchText);
                fetchVouchers(currentPage, normalizedValue);
                handleClose();
                toast.success("Thêm voucher thành công!", { position: "top-right" });
            } else {
                setError(response.message || "Thêm voucher thất bại!");
                toast.error(response.message || "Thêm voucher thất bại!", { position: "top-right" });
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.errors?.join(", ") ||
                err.response?.data?.message ||
                "Thêm voucher thất bại!";
            setError(errorMessage);
            toast.error(errorMessage, { position: "top-right" });
            console.error("Add voucher error:", err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (
            !newVoucher.title ||
            !newVoucher.code ||
            !newVoucher.description ||
            !newVoucher.quantity ||
            !newVoucher.discount ||
            !newVoucher.startDate ||
            !newVoucher.endDate
        ) {
            setError("Vui lòng điền đầy đủ thông tin!");
            return;
        }
        if (newVoucher.quantity <= 0 || newVoucher.discount <= 0 || newVoucher.discount > 100) {
            setError("Số lượng và % giảm giá phải lớn hơn 0, % giảm giá không quá 100!");
            return;
        }
        if (new Date(newVoucher.startDate) > new Date(newVoucher.endDate)) {
            setError("Ngày bắt đầu phải trước ngày hết hạn!");
            return;
        }
        setLoading(true);
        try {
            const response = await updateVoucher(currentId, newVoucher);
            if (response.code === 200) {
                const normalizedValue = normalizeSearchText(searchText);
                fetchVouchers(currentPage, normalizedValue);
                handleClose();
                toast.success("Cập nhật voucher thành công!", { position: "top-right" });
            } else {
                setError(response.message || "Cập nhật voucher thất bại!");
                toast.error(response.message || "Cập nhật voucher thất bại!", { position: "top-right" });
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.errors?.join(", ") ||
                err.response?.data?.message ||
                "Cập nhật voucher thất bại!";
            setError(errorMessage);
            toast.error(errorMessage, { position: "top-right" });
            console.error("Update voucher error:", err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteVoucherId) return;
        setLoading(true);
        try {
            const response = await deleteVoucher(deleteVoucherId);
            if (response.code === 200) {
                const normalizedValue = normalizeSearchText(searchText);
                fetchVouchers(currentPage, normalizedValue);
                toast.success("Xóa voucher thành công!", { position: "top-right" });
            } else {
                toast.error(response.message || "Xóa voucher thất bại!", { position: "top-right" });
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Xóa voucher thất bại!";
            toast.error(errorMessage, { position: "top-right" });
            console.error("Delete voucher error:", err.response?.data);
        } finally {
            setLoading(false);
            handleCloseDeleteConfirm();
        }
    };

    const columns = [
        {
            field: "stt",
            headerName: "STT",
            flex: 0.5,
            sortable: true,
        },
        {
            field: "code",
            headerName: "Mã voucher",
            flex: 0.7,
            sortable: true,
        },
        {
            field: "title",
            headerName: "Tiêu đề",
            flex: 1,
            sortable: true,
        },
        {
            field: "discount",
            headerName: "% Giảm giá",
            flex: 0.5,
            sortable: true,
        },
        {
            field: "quantity",
            headerName: "Số lượng",
            flex: 0.5,
            sortable: true,
        },
        {
            field: "formattedEndDate",
            headerName: "Thời gian hết hạn",
            flex: 1,
            sortable: true,
        },
        {
            field: "status",
            headerName: "Trạng thái",
            flex: 1,
            renderCell: (params) => {
                const status = params.value;
                const displayText = status === "expired" ? "Đã hết hạn" : "Hoạt động";
                const bgColor = status === "expired" ? "red" : "green";
                return (
                    <Typography
                        sx={{
                            backgroundColor: bgColor,
                            color: "white",
                            fontWeight: "bold",
                            mt: "21px",
                            width: "80%",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            textAlign: "center",
                        }}
                    >
                        {displayText}
                    </Typography>
                );
            },
        },
        {
            field: "actions",
            headerName: "Hành động",
            flex: 2,
            renderCell: (params) => (
                <Box display="flex" gap={1} mt="25px">
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenDetail(params.row)}
                    >
                        Xem
                    </Button>
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: colors.blueAccent[300],
                            color: "white",
                            "&:hover": {
                                backgroundColor: colors.blueAccent[200],
                            },
                        }}
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(params.row)}
                    >
                        Sửa
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDeleteConfirm(params.row._id)}
                    >
                        Xóa
                    </Button>
                </Box>
            ),
        },
    ];

    return (
        <Box m="20px">
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                limit={3}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
                <Box sx={{ gridColumn: "span 12" }}>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">
                            Quản lý voucher
                        </Typography>
                        <Box display="flex" gap={2} alignItems="center">
                            <FormControl sx={{ width: 200 }}>
                                <InputLabel>Sắp xếp</InputLabel>
                                <Select
                                    value={sortOption}
                                    onChange={handleSortChange}
                                    label="Sắp xếp"
                                    sx={{
                                        backgroundColor: colors.primary[400],
                                    }}
                                >
                                    <MenuItem value="stt_asc">STT: Tăng dần</MenuItem>
                                    <MenuItem value="stt_desc">STT: Giảm dần</MenuItem>
                                    <MenuItem value="code_asc">Mã voucher: Tăng dần</MenuItem>
                                    <MenuItem value="code_desc">Mã voucher: Giảm dần</MenuItem>
                                    <MenuItem value="title_asc">Tiêu đề: Tăng dần</MenuItem>
                                    <MenuItem value="title_desc">Tiêu đề: Giảm dần</MenuItem>
                                    <MenuItem value="discount_asc">% Giảm giá: Tăng dần</MenuItem>
                                    <MenuItem value="discount_desc">% Giảm giá: Giảm dần</MenuItem>
                                    <MenuItem value="quantity_asc">Số lượng: Tăng dần</MenuItem>
                                    <MenuItem value="quantity_desc">Số lượng: Giảm dần</MenuItem>
                                    <MenuItem value="endDate_asc">Thời gian hết hạn: Tăng dần</MenuItem>
                                    <MenuItem value="endDate_desc">Thời gian hết hạn: Giảm dần</MenuItem>
                                </Select>
                            </FormControl>
                            <Paper
                                component="form"
                                sx={{
                                    p: "2px 4px",
                                    display: "flex",
                                    alignItems: "center",
                                    width: 300,
                                    backgroundColor: colors.primary[400],
                                }}
                                onSubmit={handleSearch}
                            >
                                <InputBase
                                    sx={{ ml: 1, flex: 1 }}
                                    placeholder="Tìm kiếm voucher (nhấn Enter)"
                                    value={searchText}
                                    onChange={handleSearchTextChange}
                                />
                                <IconButton type="submit" sx={{ p: "10px" }} disabled={isSearching}>
                                    {isSearching ? <CircularProgress size={24} /> : <SearchIcon />}
                                </IconButton>
                            </Paper>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<AddIcon />}
                                onClick={handleOpen}
                            >
                                Thêm mới voucher
                            </Button>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ gridColumn: "span 12" }}>
                    <Box
                        height="75vh"
                        sx={{
                            "& .MuiDataGrid-root": {
                                border: "none",
                                width: "100%",
                            },
                            "& .MuiDataGrid-main": {
                                width: "100%",
                            },
                            "& .MuiDataGrid-cell": {
                                borderBottom: "none",
                            },
                            "& .MuiDataGrid-columnHeaders": {
                                backgroundColor: colors.blueAccent[700],
                                borderBottom: "none",
                                color: colors.grey[100],
                                fontSize: "14px",
                                fontWeight: "bold",
                            },
                            "& .MuiDataGrid-columnHeader": {
                                backgroundColor: colors.blueAccent[700],
                                color: colors.grey[100],
                                fontSize: "14px",
                                fontWeight: "bold",
                            },
                            "& .MuiDataGrid-columnHeaderTitle": {
                                color: colors.grey[100],
                                fontWeight: "bold",
                            },
                            "& .MuiDataGrid-virtualScroller": {
                                backgroundColor: colors.primary[400],
                            },
                            "& .MuiDataGrid-footerContainer": {
                                borderTop: "none",
                                backgroundColor: colors.blueAccent[700],
                            },
                            "& .MuiCheckbox-root": {
                                color: `${colors.greenAccent[200]} !important`,
                            },
                        }}
                    >
                        {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                <CircularProgress />
                            </Box>
                        ) : vouchers.length === 0 ? (
                            <Typography variant="h6" align="center" mt={4}>
                                Không có voucher nào để hiển thị
                            </Typography>
                        ) : (
                            <>
                                <DataGrid
                                    rows={vouchers}
                                    columns={columns}
                                    getRowId={(row) => row._id}
                                    getRowHeight={() => 80}
                                    sx={{ width: "100%" }}
                                    pagination={false}
                                    hideFooter={true}
                                    sortingMode="server"
                                    sortModel={sortModel}
                                    onSortModelChange={handleSortModelChange}
                                />
                                <Box display="flex" justifyContent="center" mt={2}>
                                    <Pagination
                                        count={totalPages}
                                        page={currentPage}
                                        onChange={handlePageChange}
                                        color="primary"
                                    />
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle
                    sx={{
                        fontWeight: "bold",
                        fontSize: "1.3rem",
                        textAlign: "center",
                    }}
                >
                    {isEdit ? "Chỉnh sửa voucher" : "Thêm mới voucher"}
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Typography color="error" mb={2}>
                            {error}
                        </Typography>
                    )}
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Tiêu đề"
                        value={newVoucher.title}
                        onChange={(e) => setNewVoucher({ ...newVoucher, title: e.target.value })}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Mã voucher"
                        value={newVoucher.code}
                        onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value })}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Mô tả"
                        multiline
                        rows={3}
                        value={newVoucher.description}
                        onChange={(e) =>
                            setNewVoucher({ ...newVoucher, description: e.target.value })
                        }
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Số lượng"
                        type="number"
                        value={newVoucher.quantity}
                        onChange={(e) =>
                            setNewVoucher({ ...newVoucher, quantity: e.target.value })
                        }
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="% Giảm giá"
                        type="number"
                        value={newVoucher.discount}
                        onChange={(e) =>
                            setNewVoucher({ ...newVoucher, discount: e.target.value })
                        }
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Giá trị đơn hàng tối thiểu (VNĐ)"
                        type="number"
                        value={newVoucher.minOrderAmount}
                        onChange={(e) =>
                            setNewVoucher({ ...newVoucher, minOrderAmount: e.target.value })
                        }
                        helperText="Nhập 0 nếu không yêu cầu giá trị tối thiểu"
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Ngày bắt đầu"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={newVoucher.startDate}
                        onChange={(e) =>
                            setNewVoucher({ ...newVoucher, startDate: e.target.value })
                        }
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Ngày hết hạn"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={newVoucher.endDate}
                        onChange={(e) =>
                            setNewVoucher({ ...newVoucher, endDate: e.target.value })
                        }
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleClose}
                        color="error"
                        variant="contained"
                        sx={{ fontWeight: "bold" }}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={isEdit ? handleUpdate : handleAdd}
                        color="success"
                        variant="contained"
                        sx={{ fontWeight: "bold" }}
                        disabled={loading}
                    >
                        {loading ? (
                            <CircularProgress size={24} />
                        ) : isEdit ? (
                            "Cập nhật"
                        ) : (
                            "Thêm mới"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="xs" fullWidth>
                <DialogTitle
                    sx={{
                        fontWeight: "bold",
                        fontSize: "1.3rem",
                        textAlign: "center",
                    }}
                >
                    Chi tiết voucher
                </DialogTitle>
                <DialogContent>
                    {currentVoucher ? (
                        <Box color={colors.grey[100]} mb={1}>
                            <Typography variant="h6">
                                <strong>Tiêu đề:</strong>
                                <span style={{ marginLeft: "8px" }}>{currentVoucher.title || "N/A"}</span>
                            </Typography>
                            <Typography variant="h6">
                                <strong>Mã voucher:</strong>
                                <span style={{ marginLeft: "8px" }}>{currentVoucher.code || "N/A"}</span>
                            </Typography>
                            <Typography variant="h6">
                                <strong>Mô tả:</strong>
                                <span style={{ marginLeft: "8px" }}>{currentVoucher.description || "N/A"}</span>
                            </Typography>
                            <Typography variant="h6">
                                <strong>Số lượng:</strong>
                                <span style={{ marginLeft: "8px" }}>{currentVoucher.quantity || 0}</span>
                            </Typography>
                            <Typography variant="h6">
                                <strong>% Giảm giá:</strong>
                                <span style={{ marginLeft: "8px" }}>{currentVoucher.discount || 0}</span>
                            </Typography>
                            <Typography variant="h6">
                                <strong>Ngày bắt đầu:</strong>
                                <span style={{ marginLeft: "8px" }}>
                                    {currentVoucher.startDate
                                        ? new Date(currentVoucher.startDate).toLocaleDateString("vi-VN")
                                        : "N/A"}
                                </span>
                            </Typography>
                            <Typography variant="h6">
                                <strong>Ngày hết hạn:</strong>
                                <span style={{ marginLeft: "8px" }}>
                                    {currentVoucher.endDate
                                        ? new Date(currentVoucher.endDate).toLocaleDateString("vi-VN")
                                        : "N/A"}
                                </span>
                            </Typography>
                            <Typography variant="h6">
                                <strong>Trạng thái:</strong>
                                <span style={{ marginLeft: "8px" }}>
                                    {new Date(currentVoucher.endDate) < new Date()
                                        ? "Đã hết hạn"
                                        : "Hoạt động"}
                                </span>
                            </Typography>
                        </Box>
                    ) : (
                        <Typography>Không có dữ liệu</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseDetail}
                        color="error"
                        variant="contained"
                        sx={{ fontWeight: "bold" }}
                    >
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openDeleteConfirm} onClose={handleCloseDeleteConfirm} maxWidth="xs" fullWidth>
                <DialogTitle
                    sx={{
                        fontWeight: "bold",
                        fontSize: "1.3rem",
                        textAlign: "center",
                    }}
                >
                    Xác nhận xóa voucher
                </DialogTitle>
                <DialogContent>
                    <Typography>Bạn có chắc chắn muốn xóa voucher này không?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseDeleteConfirm}
                        color="primary"
                        variant="contained"
                        sx={{ fontWeight: "bold" }}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        sx={{ fontWeight: "bold" }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : "Xóa"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VoucherControl;