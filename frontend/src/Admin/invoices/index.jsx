import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  InputBase,
  Paper,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getInvoices,
  getInvoiceDetail,
  deleteInvoice,
  refundOrder,
} from "./InvoicesApi";
import { useAdminAuth } from "../../context/AdminContext";
import { debounce } from "lodash";

const InvoicesControl = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { adminToken } = useAdminAuth();
  const [invoices, setInvoices] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOption, setSortOption] = useState("stt_asc");
  const [sortModel, setSortModel] = useState([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const fetchInvoices = useCallback(
    async (page = 1, search = "", start = "", end = "", sortKey = "", sortValue = "") => {
      if (!adminToken) {
        toast.error("Vui lòng đăng nhập để tiếp tục!", { position: "top-right" });
        setTimeout(() => {
          window.location.href = "/loginadmin";
        }, 2000);
        return;
      }

      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (start) params.startDate = start;
        if (end) params.endDate = end;
        if (sortKey && sortValue) {
          params.sortKey = sortKey;
          params.sortValue = sortValue;
        }

        const data = await getInvoices(adminToken, params);
        if (!data || !Array.isArray(data.orders)) {
          setInvoices([]);
          setTotalPages(1);
          toast.info("Không có hóa đơn nào để hiển thị!", { position: "top-right" });
          return;
        }

        const totalRecords = data.totalRecords || data.orders.length;
        const formattedData = data.orders.map((item, index) => {
          let stt;
          if (sortKey === "_id" && sortValue === "desc") {
            stt = totalRecords - ((page - 1) * 10 + index);
          } else {
            stt = (page - 1) * 10 + index + 1;
          }
          return {
            ...item,
            id: item._id,
            stt: stt,
            orderCode: item.orderCode || "N/A",
            customerName: item.userInfor?.fullName || "N/A",
            customerPhone: item.userInfor?.phone || "N/A",
            totalPrice: item.totalPrice || 0,
            createdAt: item.createdAt,
            status: item.status || "pending",
          };
        });

        setInvoices(formattedData);
        setTotalPages(data.totalPage || 1);

        if (formattedData.length === 0) {
          toast.info("Không có hóa đơn nào để hiển thị!", { position: "top-right" });
        }
      } catch (err) {
        const errorMessage = err.message || "Không thể tải danh sách hóa đơn!";
        setError(errorMessage);
        toast.error(errorMessage, { position: "top-right" });
        if (err.message.includes("Token") || err.message.includes("401")) {
          setTimeout(() => {
            window.location.href = "/loginadmin";
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    },
    [adminToken]
  );

  const debouncedSearch = useCallback(
    debounce((value) => {
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
        case "orderCode_asc":
          sortKey = "orderCode";
          sortValue = "asc";
          break;
        case "orderCode_desc":
          sortKey = "orderCode";
          sortValue = "desc";
          break;
        case "customerName_asc":
          sortKey = "userInfor.fullName";
          sortValue = "asc";
          break;
        case "customerName_desc":
          sortKey = "userInfor.fullName";
          sortValue = "desc";
          break;
        case "customerPhone_asc":
          sortKey = "userInfor.phone";
          sortValue = "asc";
          break;
        case "customerPhone_desc":
          sortKey = "userInfor.phone";
          sortValue = "desc";
          break;
        case "totalPrice_asc":
          sortKey = "totalPrice";
          sortValue = "asc";
          break;
        case "totalPrice_desc":
          sortKey = "totalPrice";
          sortValue = "desc";
          break;
        case "createdAt_asc":
          sortKey = "createdAt";
          sortValue = "asc";
          break;
        case "createdAt_desc":
          sortKey = "createdAt";
          sortValue = "desc";
          break;
        default:
          break;
      }
      fetchInvoices(1, value, startDate, endDate, sortKey, sortValue);
    }, 500),
    [sortOption, startDate, endDate, fetchInvoices]
  );

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage, fetchInvoices]);

  const handleSearchTextChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleDateSearch = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        toast.error("Ngày bắt đầu phải nhỏ hơn ngày kết thúc!", { position: "top-right" });
        return;
      }

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
        case "orderCode_asc":
          sortKey = "orderCode";
          sortValue = "asc";
          break;
        case "orderCode_desc":
          sortKey = "orderCode";
          sortValue = "desc";
          break;
        case "customerName_asc":
          sortKey = "userInfor.fullName";
          sortValue = "asc";
          break;
        case "customerName_desc":
          sortKey = "userInfor.fullName";
          sortValue = "desc";
          break;
        case "customerPhone_asc":
          sortKey = "userInfor.phone";
          sortValue = "asc";
          break;
        case "customerPhone_desc":
          sortKey = "userInfor.phone";
          sortValue = "desc";
          break;
        case "totalPrice_asc":
          sortKey = "totalPrice";
          sortValue = "asc";
          break;
        case "totalPrice_desc":
          sortKey = "totalPrice";
          sortValue = "desc";
          break;
        case "createdAt_asc":
          sortKey = "createdAt";
          sortValue = "asc";
          break;
        case "createdAt_desc":
          sortKey = "createdAt";
          sortValue = "desc";
          break;
        default:
          break;
      }
      fetchInvoices(1, searchText, startDate, endDate, sortKey, sortValue);
    } else {
      toast.warning("Vui lòng chọn khoảng thời gian!", { position: "top-right" });
    }
  };

  const handleResetDateSearch = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    fetchInvoices(1, searchText);
    toast.success("Đã đặt lại tìm kiếm theo ngày!");
  };

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
      case "orderCode_asc":
        sortKey = "orderCode";
        sortValue = "asc";
        sortField = "orderCode";
        break;
      case "orderCode_desc":
        sortKey = "orderCode";
        sortValue = "desc";
        sortField = "orderCode";
        break;
      case "customerName_asc":
        sortKey = "userInfor.fullName";
        sortValue = "REGEXP";
        sortField = "customerName";
        break;
      case "customerName_desc":
        sortKey = "userInfor.fullName";
        sortValue = "-REGEXP";
        sortField = "customerName";
        break;
      case "customerPhone_asc":
        sortKey = "userInfor.phone";
        sortValue = "asc";
        sortField = "customerPhone";
        break;
      case "customerPhone_desc":
        sortKey = "userInfor.phone";
        sortValue = "desc";
        sortField = "customerPhone";
        break;
      case "totalPrice_asc":
        sortKey = "totalPrice";
        sortValue = "asc";
        sortField = "totalPrice";
        break;
      case "totalPrice_desc":
        sortKey = "totalPrice";
        sortValue = "desc";
        sortField = "totalPrice";
        break;
      case "createdAt_asc":
        sortKey = "createdAt";
        sortValue = "asc";
        sortField = "createdAt";
        break;
      case "createdAt_desc":
        sortKey = "createdAt";
        sortValue = "desc";
        sortField = "createdAt";
        break;
      default:
        break;
    }
    fetchInvoices(1, searchText, startDate, endDate, sortKey, sortValue);
    if (sortKey && sortValue) {
      setSortModel([{ field: sortField, sort: sortValue }]);
    } else {
      setSortModel([]);
    }
  };

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
        case "orderCode":
          sortKey = "orderCode";
          sortOptionValue = sort === "asc" ? "orderCode_asc" : "orderCode_desc";
          break;
        case "customerName":
          sortKey = "userInfor.fullName";
          sortOptionValue = sort === "asc" ? "customerName_asc" : "customerName_desc";
          break;
        case "customerPhone":
          sortKey = "userInfor.phone";
          sortOptionValue = sort === "asc" ? "customerPhone_asc" : "customerPhone_desc";
          break;
        case "totalPrice":
          sortKey = "totalPrice";
          sortOptionValue = sort === "asc" ? "totalPrice_asc" : "totalPrice_desc";
          break;
        case "createdAt":
          sortKey = "createdAt";
          sortOptionValue = sort === "asc" ? "createdAt_asc" : "createdAt_desc";
          break;
        default:
          break;
      }
      if (sortKey) {
        setSortOption(sortOptionValue);
        fetchInvoices(1, searchText, startDate, endDate, sortKey, sort);
      }
    } else {
      setSortOption("none");
      fetchInvoices(1, searchText, startDate, endDate);
    }
  };

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
      case "orderCode_asc":
        sortKey = "orderCode";
        sortValue = "asc";
        break;
      case "orderCode_desc":
        sortKey = "orderCode";
        sortValue = "desc";
        break;
      case "customerName_asc":
        sortKey = "userInfor.fullName";
        sortValue = "asc";
        break;
      case "customerName_desc":
        sortKey = "userInfor.fullName";
        sortValue = "desc";
        break;
      case "customerPhone_asc":
        sortKey = "userInfor.phone";
        sortValue = "asc";
        break;
      case "customerPhone_desc":
        sortKey = "userInfor.phone";
        sortValue = "desc";
        break;
      case "totalPrice_asc":
        sortKey = "totalPrice";
        sortValue = "asc";
        break;
      case "totalPrice_desc":
        sortKey = "totalPrice";
        sortValue = "desc";
        break;
      case "createdAt_asc":
        sortKey = "createdAt";
        sortValue = "asc";
        break;
      case "createdAt_desc":
        sortKey = "createdAt";
        sortValue = "desc";
        break;
      default:
        break;
    }
    fetchInvoices(value, searchText, startDate, endDate, sortKey, sortValue);
  };

  const handleOpenDetail = async (invoice) => {
    setLoading(true);
    try {
      const response = await getInvoiceDetail(adminToken, invoice._id);
      if (response.code === 200 && response.data) {
        setCurrentInvoice(response.data);
        setOpenDetail(true);
      } else {
        toast.error(response.message || "Không thể tải chi tiết hóa đơn!", {
          position: "top-right",
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể tải chi tiết hóa đơn!";
      toast.error(errorMessage, { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setCurrentInvoice(null);
  };

  const handleDelete = async (id) => {
    setInvoiceToDelete(id);
    setOpenDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;

    setLoading(true);
    try {
      const response = await deleteInvoice(adminToken, invoiceToDelete);
      if (response.code === 200) {
        fetchInvoices(currentPage);
        toast.success("Xóa hóa đơn thành công!", { position: "top-right" });
      } else {
        toast.error(response.message || "Xóa hóa đơn thất bại!", { position: "top-right" });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Xóa hóa đơn thất bại!";
      toast.error(errorMessage, { position: "top-right" });
    } finally {
      setLoading(false);
      setOpenDeleteConfirm(false);
      setInvoiceToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteConfirm(false);
    setInvoiceToDelete(null);
  };

  const handlePrint = () => {
    if (!currentInvoice) return;
    const printWindow = window.open("", "_blank");
    const content = document.getElementById("invoice-detail").innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn tour Gotravel</title>
          <style>
            @media print {
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
              }
              .no-print {
                display: none;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
              .total-price {
                text-align: right;
                font-weight: bold;
                margin-top: 20px;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleRefund = async () => {
    if (!currentInvoice?.order?._id) return;
    setLoading(true);
    try {
      const response = await refundOrder(adminToken, currentInvoice.order._id);
      if (response.code === 200) {
        setCurrentInvoice({
          ...currentInvoice,
          order: {
            ...currentInvoice.order,
            status: "refund",
          },
        });
        await fetchInvoices(currentPage);
        toast.success("Hoàn tiền thành công!", { position: "top-right" });
      } else {
        toast.error(response.message || "Hoàn tiền thất bại!", { position: "top-right" });
      }
    } catch (err) {
      const errorMessage = err.message || "Hoàn tiền thất bại!";
      toast.error(errorMessage, { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: "stt",
      headerName: "STT",
      flex: 0.3,
      sortable: true,
    },
    {
      field: "orderCode",
      headerName: "Mã hóa đơn",
      flex: 0.5,
      sortable: true,
    },
    {
      field: "customerName",
      headerName: "Khách hàng",
      flex: 1,
      sortable: true,
    },
    {
      field: "customerPhone",
      headerName: "Số điện thoại",
      flex: 0.7,
      sortable: true,
    },
    {
      field: "totalPrice",
      headerName: "Tổng giá (VNĐ)",
      flex: 0.7,
      sortable: true,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Typography color={colors.grey[100]}>
            {params.value.toLocaleString("vi-VN")}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Trạng thái",
      flex: 0.7,
      renderCell: (params) => {
        const statusMap = {
          cancelled: "Đã hủy",
          pending: "Chờ xác nhận",
          confirmed: "Đang xử lý",
          paid: "Đã thanh toán",
          refund: "Đã hoàn tiền",
        };
        const displayStatus = statusMap[params.value] || "Không xác định";
        const backgroundColor = {
          cancelled: "#EE0000",
          pending: "#FFA500",
          paid: "#009900",
          confirmed: "transparent",
          refund: "transparent",
        }[params.value] || "transparent";
        const textColor = {
          cancelled: "#FFFFFF",
          pending: "#000000",
          paid: "#FFFFFF",
          confirmed: "#000000",
          refund: "#000000",
        }[params.value] || "#000000";
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
            width="100%"
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="60%"
              width="80%"
              sx={{
                backgroundColor: backgroundColor,
                borderRadius: "8px",
                padding: "2px 6px",
                boxSizing: "border-box",
              }}
            >
              <Typography
                sx={{
                  color: textColor,
                  fontSize: { xs: "0.75rem", sm: "0.85rem", md: "1rem" },
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {displayStatus}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Ngày tạo",
      flex: 1,
      sortable: true,
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
          <Box display="flex" alignItems="center" height="100%">
            {isNaN(date.getTime()) ? "N/A" : date.toLocaleString("vi-VN")}
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Hành động",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" gap={1} alignItems="center" height="100%">
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
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => handleDelete(params.row._id)}
          >
            Xóa
          </Button>
        </Box>
      ),
    },
  ];

  const hasVoucherOrDiscount = currentInvoice?.order?.voucherCode ||
    currentInvoice?.order?.tours?.some((tour) => tour.discount);

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
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb={2}>
            Quản lý hóa đơn
          </Typography>
        </Box>

        <Box sx={{ gridColumn: "span 12" }}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Box display="flex" gap={2}>
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
                  <MenuItem value="orderCode_asc">Mã hóa đơn: Tăng dần</MenuItem>
                  <MenuItem value="orderCode_desc">Mã hóa đơn: Giảm dần</MenuItem>
                  <MenuItem value="customerName_asc">Khách hàng: Tăng dần</MenuItem>
                  <MenuItem value="customerName_desc">Khách hàng: Giảm dần</MenuItem>
                  <MenuItem value="customerPhone_asc">Số điện thoại: Tăng dần</MenuItem>
                  <MenuItem value="customerPhone_desc">Số điện thoại: Giảm dần</MenuItem>
                  <MenuItem value="totalPrice_asc">Tổng giá: Tăng dần</MenuItem>
                  <MenuItem value="totalPrice_desc">Tổng giá: Giảm dần</MenuItem>
                  <MenuItem value="createdAt_asc">Ngày tạo: Tăng dần</MenuItem>
                  <MenuItem value="createdAt_desc">Ngày tạo: Giảm dần</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <Paper
                component="form"
                sx={{
                  p: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                  width: 300,
                  backgroundColor: colors.primary[400],
                }}
              >
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Tìm kiếm hóa đơn (theo mã)"
                  value={searchText}
                  onChange={handleSearchTextChange}
                />
                <IconButton sx={{ p: "10px" }}>
                  <SearchIcon />
                </IconButton>
              </Paper>
              <Box display="flex" gap={1} alignItems="center">
                <TextField
                  type="date"
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    width: 150,
                    borderRadius: "6px",
                    backgroundColor: colors.primary[400],
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "transparent" },
                      "&:hover fieldset": { borderColor: "transparent" },
                      "&.Mui-focused fieldset": { borderColor: "transparent" },
                    },
                  }}
                />
                <Typography>đến</Typography>
                <TextField
                  type="date"
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    width: 150,
                    borderRadius: "6px",
                    backgroundColor: colors.primary[400],
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "transparent" },
                      "&:hover fieldset": { borderColor: "transparent" },
                      "&.Mui-focused fieldset": { borderColor: "transparent" },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDateSearch}
                  sx={{
                    ml: 1,
                    backgroundColor: colors.blueAccent[400],
                    "&:hover": { backgroundColor: colors.blueAccent[300] },
                  }}
                >
                  Tìm kiếm
                </Button>
                <Button
                  sx={{ ml: 1, backgroundColor: "white" }}
                  variant="outlined"
                  onClick={handleResetDateSearch}
                >
                  Đặt lại
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ gridColumn: "span 12" }}>
          <Box
            height="70vh"
            sx={{
              "& .MuiDataGrid-root": { border: "none", width: "100%" },
              "& .MuiDataGrid-main": { width: "100%" },
              "& .MuiDataGrid-cell": { borderBottom: "none" },
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
            ) : error ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="h4" color={colors.redAccent[500]}>
                  {error}
                </Typography>
              </Box>
            ) : invoices.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="h4" color={colors.grey[100]}>
                  Không có hóa đơn nào để hiển thị
                </Typography>
              </Box>
            ) : (
              <>
                <DataGrid
                  rows={invoices}
                  columns={columns}
                  disableSelectionOnClick
                  getRowHeight={() => 60}
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

      <Dialog
        open={openDetail}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
        sx={{ "& .MuiDialog-paper": { maxWidth: "800px", width: "100%" } }}
      >
        <DialogTitle
          sx={{ fontWeight: "bold", fontSize: "1.3rem", textAlign: "center" }}
        >
          Chi tiết hóa đơn
        </DialogTitle>
        <DialogContent>
          {currentInvoice ? (
            <Box id="invoice-detail">
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h4" color={colors.grey[100]}>
                  Mã hóa đơn: {currentInvoice.order?.orderCode || "N/A"}
                </Typography>
              </Box>
              <Typography variant="h4" color={colors.grey[100]} mb={1}>
                Thông tin khách hàng
              </Typography>
              <Box mb={2}>
                <Typography>Họ tên: {currentInvoice.order?.userInfor?.fullName || "N/A"}</Typography>
                <Typography>Số điện thoại: {currentInvoice.order?.userInfor?.phone || "N/A"}</Typography>
                <Typography>Ghi chú: {currentInvoice.order?.userInfor?.note || "Không có"}</Typography>
              </Box>

              {(currentInvoice.order?.status === "cancelled" || currentInvoice.order?.status === "refund") && (
                <>
                  <Typography variant="h5" color={colors.grey[100]} mb={1}>
                    Thông tin hoàn tiền
                  </Typography>
                  <Box mb={2}>
                    <Typography>Ngân hàng: {currentInvoice.order?.inforCancel?.bankName || "N/A"}</Typography>
                    <Typography>Số tài khoản: {currentInvoice.order?.inforCancel?.numberAccount || "N/A"}</Typography>
                    <Typography>Số tiền hoàn: {Math.floor((currentInvoice.order?.totalPrice || 0) * 0.7).toLocaleString("vi-VN")} VNĐ</Typography>
                  </Box>
                </>
              )}

              {Array.isArray(currentInvoice.tours) && currentInvoice.tours.length > 0 && (
                <>
                  <Typography variant="h5" color={colors.grey[100]} mb={1}>
                    Danh sách tour
                  </Typography>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width="25%">Tiêu đề</TableCell>
                          <TableCell width="12%" align="center">Số lượng</TableCell>
                          <TableCell width="15%" align="center">Ngày xuất phát</TableCell>
                          {hasVoucherOrDiscount && (
                            <>
                              <TableCell width="15%" align="center">Mã Voucher</TableCell>
                              <TableCell width="15%" align="center">Giảm giá tour</TableCell>
                            </>
                          )}
                          <TableCell width={hasVoucherOrDiscount ? "10%" : "35%"} align="right">Giá (VNĐ)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentInvoice.tours.map((tour, index) => {
                          const matchingTour = currentInvoice.order?.tours?.find(
                            (orderTour) => orderTour.tour_id === tour.tourInfo?._id
                          );
                          const quantity = matchingTour?.timeStarts?.length > 0
                            ? matchingTour.timeStarts[0].stock
                            : 0;
                          const departureDate = matchingTour?.timeStarts?.length > 0
                            ? new Date(matchingTour.timeStarts[0].timeDepart)
                            : null;
                          const formattedDate = departureDate
                            ? departureDate.toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                            : "N/A";
                          const price = typeof tour.priceNew === 'number'
                            ? tour.priceNew
                            : (tour.tourInfo?.price || 0);
                          const voucherCode = currentInvoice.order?.voucherCode || "Không có";
                          const discount = typeof matchingTour?.discount === 'number'
                            ? matchingTour.discount
                            : 0;

                          return (
                            <TableRow key={index}>
                              <TableCell>{tour.tourInfo?.title || "N/A"}</TableCell>
                              <TableCell align="center">{quantity}</TableCell>
                              <TableCell align="center">{formattedDate}</TableCell>
                              {hasVoucherOrDiscount && (
                                <>
                                  <TableCell align="center">{voucherCode}</TableCell>
                                  <TableCell align="center">
                                    {discount > 0 ? discount.toLocaleString("vi-VN") : "N/A"}%
                                  </TableCell>
                                </>
                              )}
                              <TableCell align="right">
                                {price > 0 ? price.toLocaleString("vi-VN") : "N/A"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {Array.isArray(currentInvoice.hotels) && currentInvoice.hotels.length > 0 && (
                <>
                  <Typography variant="h5" color={colors.grey[100]} mb={1}>
                    Danh sách khách sạn
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width="20%">Tên khách sạn</TableCell>
                          <TableCell width="15%">Phòng</TableCell>
                          <TableCell width="10%" align="center">Số đêm</TableCell>
                          <TableCell width="15%" align="center">Ngày vào</TableCell>
                          <TableCell width="15%" align="center">Ngày ra</TableCell>
                          <TableCell width="15%" align="right">Giá (VNĐ)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentInvoice.hotels.flatMap((hotel, index) =>
                          hotel.rooms.map((room, roomIndex) => {
                            const checkInDate = room.checkIn
                              ? new Date(room.checkIn).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                              : "N/A";
                            const checkOutDate = room.checkOut
                              ? new Date(room.checkOut).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                              : "N/A";

                            return (
                              <TableRow key={`${index}-${roomIndex}`}>
                                <TableCell>{hotel.hotelInfo?.name || "N/A"}</TableCell>
                                <TableCell>{room.roomInfo?.name || "N/A"}</TableCell>
                                <TableCell align="center">{room.quantity || 0}</TableCell>
                                <TableCell align="center">{checkInDate}</TableCell>
                                <TableCell align="center">{checkOutDate}</TableCell>
                                <TableCell align="right">{room.price?.toLocaleString("vi-VN") || "N/A"}</TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {(!Array.isArray(currentInvoice.tours) || currentInvoice.tours.length === 0) &&
                (!Array.isArray(currentInvoice.hotels) || currentInvoice.hotels.length === 0) && (
                  <Typography variant="h6" color={colors.grey[100]} mt={2}>
                    Không có tour hoặc khách sạn trong hóa đơn này.
                  </Typography>
                )}

              <Typography
                variant="h5"
                sx={{
                  mt: 2,
                  textAlign: "right",
                  fontWeight: "bold",
                  color: colors.grey[100],
                }}
              >
                Tổng giá: {currentInvoice.order?.totalPrice?.toLocaleString("vi-VN") || "N/A"} VNĐ
              </Typography>

              {currentInvoice.order?.status === "cancelled" && (
                <Typography
                  variant="h5"
                  sx={{
                    mt: 1,
                    textAlign: "right",
                    fontWeight: "bold",
                    color: colors.redAccent[500],
                  }}
                >
                  Số tiền phải hoàn (70%): {Math.floor((currentInvoice.order?.totalPrice || 0) * 0.7).toLocaleString("vi-VN")} VNĐ
                </Typography>
              )}
            </Box>
          ) : (
            <Typography>Không có dữ liệu</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Box display="flex" alignItems="center" gap={2}>
            {currentInvoice?.order?.status === "cancelled" &&
              currentInvoice.order?.inforCancel?.bankName &&
              currentInvoice.order?.inforCancel?.numberAccount ? (
              <Button
                variant="contained"
                color="success"
                onClick={handleRefund}
                disabled={loading}
              >
                Xác nhận hoàn tiền
              </Button>
            ) : currentInvoice?.order?.status !== "refund" ? (
              <Button
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                variant="contained"
                color="primary"
                disabled={!currentInvoice}
              >
                In hóa đơn
              </Button>
            ) : null}
            <Button
              onClick={handleCloseDetail}
              color="error"
              variant="contained"
              sx={{ fontWeight: "bold" }}
            >
              Đóng
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteConfirm}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.3rem", textAlign: "center" }}>
          Xác nhận xóa
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa hóa đơn này không?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDelete}
            color="primary"
            variant="outlined"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoicesControl;