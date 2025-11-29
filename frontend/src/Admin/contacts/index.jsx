import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputBase,
  Paper,
  CircularProgress,
  Typography,
  Grid,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getContacts,
  changeContactStatus,
  getContactDetail,
  deleteContact,
  createUser,
  updateUser,
} from "./ContactsApi";
import { useAdminAuth } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";

const ContactsControl = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { adminToken } = useAdminAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("createdAt_desc");
  const [sortModel, setSortModel] = useState([{ field: "createdAt", sort: "desc" }]);
  const [open, setOpen] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteContactId, setDeleteContactId] = useState(null);
  const [currentContact, setCurrentContact] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limitItems = 10;

  const fetchContacts = useCallback(
    async (page = 1, search = "", status = "all", sortKey = "createdAt", sortValue = "desc") => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: limitItems,
        };
        if (search) params.search = search;
        if (status !== "all") params.status = status;
        if (sortKey) params.sortKey = sortKey;
        if (sortValue) params.sortValue = sortValue;
        // console.log("Fetching contacts with params:", params);
        const response = await getContacts(params);
        // console.log("fetchContacts response:", response);
        if (response && Array.isArray(response.users)) {
          const totalRecords = response.totalRecords || response.users.length;
          const formattedData = response.users.map((item, index) => {
            let stt;
            if (sortKey === "_id" && sortValue === "desc") {
              stt = totalRecords - ((page - 1) * limitItems + index);
            } else {
              stt = (page - 1) * limitItems + index + 1;
            }
            return {
              ...item,
              id: item._id,
              stt,
              createdAt: new Date(item.createdAt).toLocaleDateString("vi-VN"),
            };
          });
          setContacts(formattedData);
          setTotalPages(response.totalPage || 1);
          if (formattedData.length === 0) {
            toast.info(
              search
                ? `Không tìm thấy liên hệ nào với từ khóa "${search}"!`
                : "Không có liên hệ nào để hiển thị!",
              { position: "top-right" }
            );
          }
        } else {
          setError("Dữ liệu liên hệ không hợp lệ!");
          toast.error("Dữ liệu liên hệ không hợp lệ!", { position: "top-right" });
          setContacts([]);
          setTotalPages(1);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Không thể tải danh sách liên hệ!";
        setError(errorMessage);
        toast.error(errorMessage, { position: "top-right" });
        console.error("Fetch contacts error:", err.response?.data);
        if (err.response?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
          localStorage.removeItem("adminToken");
          navigate("/loginadmin");
        }
        setContacts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [adminToken, navigate, limitItems]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value, status, sortKey, sortValue) => {
      setCurrentPage(1);
      fetchContacts(1, value, status, sortKey, sortValue);
    }, 500),
    [fetchContacts]
  );

  useEffect(() => {
    const token = adminToken || localStorage.getItem("adminToken");
    if (token) {
      fetchContacts(currentPage, searchText, statusFilter);
    } else {
      toast.error("Vui lòng đăng nhập để tiếp tục!", { position: "top-right" });
      setTimeout(() => {
        navigate("/loginadmin");
      }, 2000);
    }
  }, [adminToken, navigate, fetchContacts]);

  const handleSearchTextChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
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
      case "fullName_asc":
        sortKey = "fullName";
        sortValue = "asc";
        break;
      case "fullName_desc":
        sortKey = "fullName";
        sortValue = "desc";
        break;
      case "email_asc":
        sortKey = "email";
        sortValue = "asc";
        break;
      case "email_desc":
        sortKey = "email";
        sortValue = "desc";
        break;
      case "phone_asc":
        sortKey = "phone";
        sortValue = "asc";
        break;
      case "phone_desc":
        sortKey = "phone";
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
        sortKey = "createdAt";
        sortValue = "desc";
        break;
    }
    debouncedSearch(value, statusFilter, sortKey, sortValue);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleSearchTextChange({ target: { value: searchText } });
  };

  const handleStatusFilterChange = (event) => {
    const newStatus = event.target.value;
    setStatusFilter(newStatus);
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
      case "fullName_asc":
        sortKey = "fullName";
        sortValue = "asc";
        break;
      case "fullName_desc":
        sortKey = "fullName";
        sortValue = "desc";
        break;
      case "email_asc":
        sortKey = "email";
        sortValue = "asc";
        break;
      case "email_desc":
        sortKey = "email";
        sortValue = "desc";
        break;
      case "phone_asc":
        sortKey = "phone";
        sortValue = "asc";
        break;
      case "phone_desc":
        sortKey = "phone";
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
        sortKey = "createdAt";
        sortValue = "desc";
        break;
    }
    fetchContacts(1, searchText, newStatus, sortKey, sortValue);
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
      case "fullName_asc":
        sortKey = "fullName";
        sortValue = "asc";
        sortField = "fullName";
        break;
      case "fullName_desc":
        sortKey = "fullName";
        sortValue = "desc";
        sortField = "fullName";
        break;
      case "email_asc":
        sortKey = "email";
        sortValue = "asc";
        sortField = "email";
        break;
      case "email_desc":
        sortKey = "email";
        sortValue = "desc";
        sortField = "email";
        break;
      case "phone_asc":
        sortKey = "phone";
        sortValue = "asc";
        sortField = "phone";
        break;
      case "phone_desc":
        sortKey = "phone";
        sortValue = "desc";
        sortField = "phone";
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
        sortKey = "createdAt";
        sortValue = "desc";
        sortField = "createdAt";
        break;
    }
    fetchContacts(1, searchText, statusFilter, sortKey, sortValue);
    setSortModel([{ field: sortField, sort: sortValue }]);
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
        case "fullName":
          sortKey = "fullName";
          sortOptionValue = sort === "asc" ? "fullName_asc" : "fullName_desc";
          break;
        case "email":
          sortKey = "email";
          sortOptionValue = sort === "asc" ? "email_asc" : "email_desc";
          break;
        case "phone":
          sortKey = "phone";
          sortOptionValue = sort === "asc" ? "phone_asc" : "phone_desc";
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
        fetchContacts(1, searchText, statusFilter, sortKey, sort);
      }
    } else {
      setSortOption("createdAt_desc");
      fetchContacts(1, searchText, statusFilter, "createdAt", "desc");
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
      case "fullName_asc":
        sortKey = "fullName";
        sortValue = "asc";
        break;
      case "fullName_desc":
        sortKey = "fullName";
        sortValue = "desc";
        break;
      case "email_asc":
        sortKey = "email";
        sortValue = "asc";
        break;
      case "email_desc":
        sortKey = "email";
        sortValue = "desc";
        break;
      case "phone_asc":
        sortKey = "phone";
        sortValue = "asc";
        break;
      case "phone_desc":
        sortKey = "phone";
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
        sortKey = "createdAt";
        sortValue = "desc";
        break;
    }
    fetchContacts(value, searchText, statusFilter, sortKey, sortValue);
  };

  const handleOpen = () => {
    setIsEdit(false);
    setNewUser({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    });
    setError("");
    setOpen(true);
  };

  const handleEdit = (user) => {
    setIsEdit(true);
    setCurrentId(user._id);
    setNewUser({
      fullName: user.fullName || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
      phone: user.phone || "",
    });
    setError("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError("");
  };

  const handleOpenDetail = async (contact) => {
    setLoading(true);
    try {
      const response = await getContactDetail(contact._id);
      if (response.code === 200) {
        setCurrentContact(response.data);
        setOpenDetail(true);
      } else {
        toast.error(response.message || "Không thể tải chi tiết liên hệ!", { position: "top-right" });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể tải chi tiết liên hệ!";
      toast.error(errorMessage, { position: "top-right" });
      console.error("Get contact detail error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setCurrentContact(null);
  };

  const handleOpenDeleteConfirm = (id) => {
    setDeleteContactId(id);
    setOpenDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
    setDeleteContactId(null);
  };

  const handleChangeStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setLoading(true);
    try {
      const response = await changeContactStatus(id, newStatus);
      if (response.code === 200) {
        fetchContacts(currentPage, searchText, statusFilter);
        toast.success(`Tài khoản đã được ${newStatus === "active" ? "kích hoạt" : "tạm ngưng"} thành công!`, { position: "top-right" });
      } else {
        toast.error(response.message || "Cập nhật trạng thái thất bại!", { position: "top-right" });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Cập nhật trạng thái thất bại!";
      toast.error(errorMessage, { position: "top-right" });
      console.error("Change status error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newUser.fullName) {
      setError("Vui lòng nhập họ tên!");
      return;
    }
    if (!newUser.email || !/^\S+@\S+\.\S+$/.test(newUser.email)) {
      setError("Vui lòng nhập email hợp lệ!");
      return;
    }
    if (!newUser.password) {
      setError("Vui lòng nhập mật khẩu!");
      return;
    }
    if (newUser.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    if (!newUser.confirmPassword) {
      setError("Vui lòng xác nhận mật khẩu!");
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (!newUser.phone) {
      setError("Vui lòng nhập số điện thoại!");
      return;
    }
    if (!/^\d{10,11}$/.test(newUser.phone)) {
      setError("Số điện thoại không hợp lệ!");
      return;
    }

    setLoading(true);
    try {
      const userData = {
        fullName: newUser.fullName,
        email: newUser.email,
        password: newUser.password,
        confirmPassword: newUser.confirmPassword,
        phone: newUser.phone,
      };

      const response = await createUser(userData);
      if (response.code === 200) {
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
          case "fullName_asc":
            sortKey = "fullName";
            sortValue = "asc";
            break;
          case "fullName_desc":
            sortKey = "fullName";
            sortValue = "desc";
            break;
          case "email_asc":
            sortKey = "email";
            sortValue = "asc";
            break;
          case "email_desc":
            sortKey = "email";
            sortValue = "desc";
            break;
          case "phone_asc":
            sortKey = "phone";
            sortValue = "asc";
            break;
          case "phone_desc":
            sortKey = "phone";
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
            sortKey = "createdAt";
            sortValue = "desc";
            break;
        }
        fetchContacts(currentPage, searchText, statusFilter, sortKey, sortValue);
        handleClose();
        toast.success("Thêm tài khoản người dùng thành công!", { position: "top-right" });
      } else {
        setError(response.message || "Thêm tài khoản thất bại!");
        toast.error(response.message || "Thêm tài khoản thất bại!", { position: "top-right" });
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Thêm tài khoản thất bại!";
      setError(errorMessage);
      toast.error(errorMessage, { position: "top-right" });
      console.error("Add user error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!newUser.fullName) {
      setError("Vui lòng nhập họ tên!");
      return;
    }
    if (!newUser.email || !/^\S+@\S+\.\S+$/.test(newUser.email)) {
      setError("Vui lòng nhập email hợp lệ!");
      return;
    }
    if (!newUser.phone) {
      setError("Vui lòng nhập số điện thoại!");
      return;
    }
    if (!/^\d{10,11}$/.test(newUser.phone)) {
      setError("Số điện thoại không hợp lệ!");
      return;
    }
    if (newUser.password && newUser.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    if (newUser.password && newUser.password !== newUser.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      const userData = {
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
      };
      
      if (newUser.password) {
        userData.password = newUser.password;
        userData.confirmPassword = newUser.confirmPassword;
      }

      const response = await updateUser(currentId, userData);
      if (response.code === 200) {
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
          case "fullName_asc":
            sortKey = "fullName";
            sortValue = "asc";
            break;
          case "fullName_desc":
            sortKey = "fullName";
            sortValue = "desc";
            break;
          case "email_asc":
            sortKey = "email";
            sortValue = "asc";
            break;
          case "email_desc":
            sortKey = "email";
            sortValue = "desc";
            break;
          case "phone_asc":
            sortKey = "phone";
            sortValue = "asc";
            break;
          case "phone_desc":
            sortKey = "phone";
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
            sortKey = "createdAt";
            sortValue = "desc";
            break;
        }
        fetchContacts(currentPage, searchText, statusFilter, sortKey, sortValue);
        handleClose();
        toast.success("Cập nhật tài khoản người dùng thành công!", { position: "top-right" });
      } else {
        setError(response.message || "Cập nhật tài khoản thất bại!");
        toast.error(response.message || "Cập nhật tài khoản thất bại!", { position: "top-right" });
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Cập nhật tài khoản thất bại!";
      setError(errorMessage);
      toast.error(errorMessage, { position: "top-right" });
      console.error("Update user error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteContactId) return;
    setLoading(true);
    try {
      const response = await deleteContact(deleteContactId);
      if (response.code === 200) {
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
          case "fullName_asc":
            sortKey = "fullName";
            sortValue = "asc";
            break;
          case "fullName_desc":
            sortKey = "fullName";
            sortValue = "desc";
            break;
          case "email_asc":
            sortKey = "email";
            sortValue = "asc";
            break;
          case "email_desc":
            sortKey = "email";
            sortValue = "desc";
            break;
          case "phone_asc":
            sortKey = "phone";
            sortValue = "asc";
            break;
          case "phone_desc":
            sortKey = "phone";
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
            sortKey = "createdAt";
            sortValue = "desc";
            break;
        }
        fetchContacts(currentPage, searchText, statusFilter, sortKey, sortValue);
        toast.success("Xóa tài khoản thành công!", { position: "top-right" });
      } else {
        toast.error(response.message || "Xóa tài khoản thất bại!", { position: "top-right" });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Xóa tài khoản thất bại!";
      toast.error(errorMessage, { position: "top-right" });
      console.error("Delete contact error:", err.response?.data);
    } finally {
      setLoading(false);
      handleCloseDeleteConfirm();
    }
  };

  const columns = [
    { field: "stt", headerName: "STT", flex: 0.3, sortable: true },
    { field: "fullName", headerName: "Tên", flex: 1, sortable: true },
    { field: "email", headerName: "Email", flex: 1, sortable: true },
    { field: "phone", headerName: "Số điện thoại", flex: 0.7, sortable: true },
    { field: "createdAt", headerName: "Ngày tạo", flex: 0.5, sortable: true },
    {
      field: "status",
      headerName: "Trạng thái",
      flex: 0.7,
      sortable: false,
      renderCell: ({ row }) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Button
            variant="contained"
            size="small"
            onClick={() => handleChangeStatus(row._id, row.status)}
            color={row.status === "active" ? "success" : "warning"}
            disabled={loading}
          >
            {row.status === "active" ? "Hoạt động" : "Tạm ngưng"}
          </Button>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Hành động",
      flex: 1.5,
      sortable: false,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1} mt="25px">
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => handleOpenDetail(row)}
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
            onClick={() => handleEdit(row)}
          >
            Sửa
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => handleOpenDeleteConfirm(row._id)}
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
              Quản lý khách hàng
            </Typography>
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
                  <MenuItem value="fullName_asc">Tên: Tăng dần</MenuItem>
                  <MenuItem value="fullName_desc">Tên: Giảm dần</MenuItem>
                  <MenuItem value="email_asc">Email: Tăng dần</MenuItem>
                  <MenuItem value="email_desc">Email: Giảm dần</MenuItem>
                  <MenuItem value="phone_asc">Số điện thoại: Tăng dần</MenuItem>
                  <MenuItem value="phone_desc">Số điện thoại: Giảm dần</MenuItem>
                  <MenuItem value="createdAt_asc">Ngày tạo: Tăng dần</MenuItem>
                  <MenuItem value="createdAt_desc">Ngày tạo: Giảm dần</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ width: 150 }}>
                <InputLabel>Lọc trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  label="Trạng thái"
                  sx={{
                    backgroundColor: colors.primary[400],
                  }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="active">Hoạt động</MenuItem>
                  <MenuItem value="inactive">Tạm ngưng</MenuItem>
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
                  placeholder="Tìm kiếm liên hệ (tên, email, số điện thoại)"
                  value={searchText}
                  onChange={handleSearchTextChange}
                />
                <IconButton type="submit" sx={{ p: "10px" }}>
                  <SearchIcon />
                </IconButton>
              </Paper>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={handleOpen}
              >
                Thêm tài khoản mới
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
                backgroundColor: colors.blueAccent[700],
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
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
              },
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : contacts.length === 0 ? (
              <Typography variant="h6" align="center" mt={4}>
                Không có liên hệ nào để hiển thị
              </Typography>
            ) : (
              <>
                <DataGrid
                  rows={contacts}
                  columns={columns}
                  getRowId={(row) => row._id}
                  pagination={false}
                  getRowHeight={() => 80}
                  sx={{
                    width: "100%",
                  }}
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
          {isEdit ? "Chỉnh sửa tài khoản người dùng" : "Thêm tài khoản người dùng mới"}
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
            label="Họ và tên"
            value={newUser.fullName}
            onChange={(e) =>
              setNewUser({ ...newUser, fullName: e.target.value })
            }
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) =>
              setNewUser({ ...newUser, email: e.target.value })
            }
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Số điện thoại"
            value={newUser.phone}
            onChange={(e) =>
              setNewUser({ ...newUser, phone: e.target.value })
            }
            required
          />
          {!isEdit && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Mật khẩu"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label="Nhập lại mật khẩu"
                type="password"
                value={newUser.confirmPassword}
                onChange={(e) =>
                  setNewUser({ ...newUser, confirmPassword: e.target.value })
                }
                required
              />
            </>
          )}
          {isEdit && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Mật khẩu mới (nếu muốn thay đổi)"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Nhập lại mật khẩu mới"
                type="password"
                value={newUser.confirmPassword}
                onChange={(e) =>
                  setNewUser({ ...newUser, confirmPassword: e.target.value })
                }
              />
            </>
          )}
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
              "Lưu"
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
          Chi tiết khách hàng
        </DialogTitle>
        <DialogContent>
          {currentContact ? (
            <Grid container spacing={2}>
              <Grid item xs={4} display="flex" justifyContent="center" alignItems="center">
                {currentContact.avatar ? (
                  <img
                    src={currentContact.avatar}
                    alt="Avatar"
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                      objectFit: "contain",
                      border: "2px solid #000",
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/120";
                    }}
                  />
                ) : (
                  <img
                    src="https://via.placeholder.com/120"
                    alt="Avatar Placeholder"
                    style={{ width: "120px", height: "120px", borderRadius: "50%" }}
                  />
                )}
              </Grid>
              <Grid item xs={8}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  <strong>Họ tên:</strong> {currentContact.fullName || "N/A"}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {currentContact.email || "N/A"}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  <strong>Số điện thoại:</strong> {currentContact.phone || "N/A"}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  <strong>Trạng thái:</strong> {currentContact.status === "active" ? "Hoạt động" : "Tạm ngưng"}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  <strong>Ngày tạo:</strong> {new Date(currentContact.createdAt).toLocaleDateString("vi-VN")}
                </Typography>
              </Grid>
            </Grid>
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
          Xác nhận xóa tài khoản
        </DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn xóa tài khoản người dùng này không?</Typography>
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
    </Box >
  );
};

export default ContactsControl;