import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    CircularProgress,
    Typography,
    FormControl,
    FormControlLabel,
    Checkbox,
    FormGroup,
    InputBase,
    Paper,
    IconButton,
    Pagination,
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
    getRightsGroups,
    createRightsGroup,
    updateRightsGroup,
    deleteRightsGroup,
    getRightsGroupDetail,
} from "./RightsgroupApi";
import { useAdminAuth } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";

// Ánh xạ tên hiển thị cho quyền
const PERMISSION_DISPLAY_NAMES = {
    role_view: "Xem nhóm quyền",
    role_create: "Thêm nhóm quyền",
    role_edit: "Sửa nhóm quyền",
    role_delete: "Xóa nhóm quyền",
    role_permissions: "Phân quyền",
    user_view: "Xem tài khoản khách hàng",
    user_create: "Thêm tài khoản khách hàng",
    user_edit: "Sửa tài khoản khách hàng",
    user_delete: "Xóa tài khoản khách hàng",
    voucher_view: "Xem voucher",
    voucher_create: "Thêm voucher",
    voucher_edit: "Sửa voucher",
    voucher_delete: "Xóa voucher",
    tour_view: "Xem tour",
    tour_create: "Thêm tour",
    tour_edit: "Sửa tour",
    tour_delete: "Xóa tour",
    category_view: "Xem danh mục",
    category_create: "Thêm danh mục",
    category_edit: "Sửa danh mục",
    category_delete: "Xóa danh mục",
    invoice_view: "Xem đơn hàng",
    invoice_create: "Thêm đơn hàng",
    invoice_edit: "Sửa đơn hàng",
    invoice_delete: "Xóa đơn hàng",
    hotel_view: "Xem khách sạn",
    hotel_create: "Thêm khách sạn",
    hotel_edit: "Sửa khách sạn",
    hotel_delete: "Xóa khách sạn",
    account_view: "Xem tài khoản nội bộ",
    account_create: "Tạo tài khoản nội bộ",
    account_edit: "Sửa tài khoản nội bộ",
    account_delete: "Xoá tài khoản nội bộ",
    order_view: "Xem danh sách đơn tour",
    order_edit: "Sửa danh sách đơn tour",
    order_delete: "Xoá danh sách đơn tour",
    review_view: "Xem danh sách review",
    review_delete: "Xóa danh sách review",
    general: "Cài đặt chung",
};

// Danh sách quyền hiển thị
const AVAILABLE_PERMISSIONS = [
    "role_view",
    "role_create",
    "role_edit",
    "role_delete",
    "role_permissions",
    "user_view",
    "user_create",
    "user_edit",
    "user_delete",
    "voucher_view",
    "voucher_create",
    "voucher_edit",
    "voucher_delete",
    "tour_view",
    "tour_create",
    "tour_edit",
    "tour_delete",
    "category_view",
    "category_create",
    "category_edit",
    "category_delete",
    "invoice_view",
    "invoice_create",
    "invoice_edit",
    "invoice_delete",
    "hotel_view",
    "hotel_create",
    "hotel_edit",
    "hotel_delete",
    "account_view",
    "account_create",
    "account_edit",
    "account_delete",
    "order_view",
    "order_edit",
    "order_delete",
    "review_view",
    "review_delete",
    "general",
];

const RightsGroupControl = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { adminToken } = useAdminAuth();
    const navigate = useNavigate();
    const [rightsGroups, setRightsGroups] = useState([]);
    const [allRightsGroups, setAllRightsGroups] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [open, setOpen] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    const [deleteRightsGroupId, setDeleteRightsGroupId] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [currentRightsGroup, setCurrentRightsGroup] = useState(null);
    const [newRightsGroup, setNewRightsGroup] = useState({
        title: "",
        description: "",
        permissions: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limitItems = 10;

    const fetchRightsGroups = async (page = 1) => {
        setLoading(true);
        try {
            const response = await getRightsGroups({
                page,
                limit: limitItems,
                sortKey: "createdAt",
                sortValue: "desc",
            });
            console.log("fetchRightsGroups response:", response);
            if (response && Array.isArray(response.roles)) {
                const formattedData = response.roles.map((item, index) => ({
                    ...item,
                    id: item._id,
                    stt: index + 1 + (page - 1) * limitItems,
                }));
                setAllRightsGroups(formattedData);
                setRightsGroups(formattedData);
                setTotalPages(response.totalPage || 1);
                if (formattedData.length === 0) {
                    toast.info("Không có nhóm quyền nào để hiển thị!", { position: "top-right" });
                }
            } else {
                setError("Dữ liệu nhóm quyền không hợp lệ!");
                toast.error("Dữ liệu nhóm quyền không hợp lệ!", { position: "top-right" });
                setRightsGroups([]);
                setAllRightsGroups([]);
                setTotalPages(1);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Không thể tải danh sách nhóm quyền!";
            setError(errorMessage);
            toast.error(errorMessage, { position: "top-right" });
            console.error("Fetch rights groups error:", err.response?.data);
            if (err.response?.status === 401) {
                toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
                localStorage.removeItem("adminToken");
                navigate("/loginadmin");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = adminToken || localStorage.getItem("adminToken");
        if (token) {
            fetchRightsGroups(currentPage);
        } else {
            toast.error("Vui lòng đăng nhập để tiếp tục!", { position: "top-right" });
            setTimeout(() => {
                navigate("/loginadmin");
            }, 2000);
        }
    }, [adminToken, navigate, currentPage]);

    useEffect(() => {
        const filteredRightsGroups = allRightsGroups.filter((group) =>
            (group.title?.toLowerCase() || "").includes(searchText.toLowerCase()) ||
            (group.description?.toLowerCase() || "").includes(searchText.toLowerCase())
        );
        setRightsGroups(filteredRightsGroups);
    }, [searchText, allRightsGroups]);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    const handleOpen = () => {
        setIsEdit(false);
        setNewRightsGroup({
            title: "",
            description: "",
            permissions: [],
        });
        setError("");
        setOpen(true);
    };

    const handleEdit = (rightsGroup) => {
        setIsEdit(true);
        setCurrentId(rightsGroup._id);
        setNewRightsGroup({
            title: rightsGroup.title || "",
            description: rightsGroup.description || "",
            permissions: rightsGroup.permissions || [],
        });
        setError("");
        setOpen(true);
    };

    const handleOpenDetail = async (rightsGroup) => {
        setLoading(true);
        try {
            const response = await getRightsGroupDetail(rightsGroup._id);
            setCurrentRightsGroup(response);
            setOpenDetail(true);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Không thể tải chi tiết nhóm quyền!";
            toast.error(errorMessage, { position: "top-right" });
            console.error("Get rights group detail error:", err.response?.data);
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
        setCurrentRightsGroup(null);
    };

    const handleOpenDeleteConfirm = (id) => {
        setDeleteRightsGroupId(id);
        setOpenDeleteConfirm(true);
    };

    const handleCloseDeleteConfirm = () => {
        setOpenDeleteConfirm(false);
        setDeleteRightsGroupId(null);
    };

    const handleAdd = async () => {
        if (!newRightsGroup.title || !newRightsGroup.description) {
            setError("Vui lòng điền đầy đủ thông tin!");
            return;
        }
        setLoading(true);
        try {
            const response = await createRightsGroup(newRightsGroup);
            if (response.code === 200) {
                fetchRightsGroups(currentPage);
                handleClose();
                toast.success("Thêm nhóm quyền thành công!", { position: "top-right" });
            } else {
                setError(response.message || "Thêm nhóm quyền thất bại!");
                toast.error(response.message || "Thêm nhóm quyền thất bại!", { position: "top-right" });
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.errors?.join(", ") ||
                err.response?.data?.message ||
                "Thêm nhóm quyền thất bại!";
            setError(errorMessage);
            toast.error(errorMessage, { position: "top-right" });
            console.error("Add rights group error:", err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!newRightsGroup.title || !newRightsGroup.description) {
            setError("Vui lòng điền đầy đủ thông tin!");
            return;
        }
        setLoading(true);
        try {
            const response = await updateRightsGroup(currentId, newRightsGroup);
            if (response.code === 200) {
                fetchRightsGroups(currentPage);
                handleClose();
                toast.success("Cập nhật nhóm quyền thành công!", { position: "top-right" });
            } else {
                setError(response.message || "Cập nhật nhóm quyền thất bại!");
                toast.error(response.message || "Cập nhật nhóm quyền thất bại!", { position: "top-right" });
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.errors?.join(", ") ||
                err.response?.data?.message ||
                "Cập nhật nhóm quyền thất bại!";
            setError(errorMessage);
            toast.error(errorMessage, { position: "top-right" });
            console.error("Update rights group error:", err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteRightsGroupId) return;
        setLoading(true);
        try {
            const response = await deleteRightsGroup(deleteRightsGroupId);
            if (response.code === 200) {
                fetchRightsGroups(currentPage);
                toast.success("Xóa nhóm quyền thành công!", { position: "top-right" });
            } else {
                toast.error(response.message || "Xóa nhóm quyền thất bại!", { position: "top-right" });
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Xóa nhóm quyền thất bại!";
            toast.error(errorMessage, { position: "top-right" });
            console.error("Delete rights group error:", err.response?.data);
        } finally {
            setLoading(false);
            handleCloseDeleteConfirm();
        }
    };

    const handlePermissionChange = (event) => {
        const permission = event.target.name;
        setNewRightsGroup((prev) => ({
            ...prev,
            permissions: event.target.checked
                ? [...prev.permissions, permission]
                : prev.permissions.filter((p) => p !== permission),
        }));
    };

    const handleSelectAllPermissions = (event) => {
        if (event.target.checked) {
            setNewRightsGroup((prev) => ({
                ...prev,
                permissions: [...AVAILABLE_PERMISSIONS],
            }));
        } else {
            setNewRightsGroup((prev) => ({
                ...prev,
                permissions: [],
            }));
        }
    };

    const isAllPermissionsSelected = () => {
        return AVAILABLE_PERMISSIONS.every((permission) =>
            newRightsGroup.permissions?.includes(permission)
        );
    };

    const columns = [
        { field: "stt", headerName: "STT", flex: 0.3 },
        { field: "title", headerName: "Nhóm quyền", flex: 1 },
        { field: "description", headerName: "Mô tả ngắn", flex: 1 },
        {
            field: "actions",
            headerName: "Hành động",
            flex: 1,
            renderCell: (params) => (
                <Box display="flex" gap={1} mt="12px">
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenDetail(params.row)}
                    >
                        Chi tiết
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
                            Nhóm quyền
                        </Typography>
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
                                onSubmit={(e) => e.preventDefault()}
                            >
                                <InputBase
                                    sx={{ ml: 1, flex: 1 }}
                                    placeholder="Tìm kiếm nhóm quyền (tiêu đề, mô tả)"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                                <IconButton sx={{ p: "10px" }}>
                                    <SearchIcon />
                                </IconButton>
                            </Paper>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<AddIcon />}
                                onClick={handleOpen}
                            >
                                Thêm mới nhóm quyền
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
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px",
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
                        ) : rightsGroups.length === 0 ? (
                            <Typography variant="h6" align="center" mt={4}>
                                Không có nhóm quyền nào để hiển thị
                            </Typography>
                        ) : (
                            <>
                                <DataGrid
                                    rows={rightsGroups}
                                    columns={columns}
                                    getRowId={(row) => row._id}
                                    pagination={false}
                                    getRowHeight={() => 60}
                                    sx={{
                                        width: "100%",
                                    }}
                                    hideFooter={true}
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
                    {isEdit ? "Chỉnh sửa nhóm quyền" : "Thêm mới nhóm quyền"}
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
                        label="Tên nhóm quyền"
                        value={newRightsGroup.title}
                        onChange={(e) =>
                            setNewRightsGroup({ ...newRightsGroup, title: e.target.value })
                        }
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Mô tả ngắn"
                        multiline
                        rows={3}
                        value={newRightsGroup.description}
                        onChange={(e) =>
                            setNewRightsGroup({ ...newRightsGroup, description: e.target.value })
                        }
                        required
                    />
                    <Box display="flex" alignItems="center" gap={1} mt={2} mb={1}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isAllPermissionsSelected()}
                                    onChange={handleSelectAllPermissions}
                                    sx={{ color: colors.greenAccent[200] }}
                                />
                            }
                            label=""
                        />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Quyền:</Typography>
                    </Box>
                    <FormControl component="fieldset">
                        <FormGroup>
                            {AVAILABLE_PERMISSIONS.map((permission) => (
                                <FormControlLabel
                                    key={permission}
                                    control={
                                        <Checkbox
                                            checked={newRightsGroup.permissions.includes(permission)}
                                            onChange={handlePermissionChange}
                                            name={permission}
                                            sx={{ color: colors.greenAccent[200] }}
                                        />
                                    }
                                    label={PERMISSION_DISPLAY_NAMES[permission] || permission}
                                />
                            ))}
                        </FormGroup>
                    </FormControl>
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
            <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
                <DialogTitle
                    sx={{
                        fontWeight: "bold",
                        fontSize: "1.3rem",
                        textAlign: "center",
                    }}
                >
                    Chi tiết nhóm quyền
                </DialogTitle>
                <DialogContent>
                    {currentRightsGroup ? (
                        <Box>
                            <Typography variant="h5">
                                <strong>Tiêu đề:</strong> {currentRightsGroup.title || "N/A"}
                            </Typography>
                            <Typography variant="h5">
                                <strong>Mô tả:</strong> {currentRightsGroup.description || "N/A"}
                            </Typography>
                            <Typography variant="h5" mt={1} mb={1} sx={{ fontWeight: 700 }}>
                                Quyền:
                            </Typography>
                            {currentRightsGroup.permissions && currentRightsGroup.permissions.length > 0 ? (
                                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {currentRightsGroup.permissions.map((permission) => (
                                        <Typography component="li" key={permission}>
                                            {PERMISSION_DISPLAY_NAMES[permission] || permission}
                                        </Typography>
                                    ))}
                                </Box>
                            ) : (
                                <Typography>Không có quyền nào được chọn</Typography>
                            )}
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
                    Xác nhận xóa nhóm quyền
                </DialogTitle>
                <DialogContent>
                    <Typography>Bạn có chắc chắn muốn xóa nhóm quyền này không?</Typography>
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

export default RightsGroupControl;