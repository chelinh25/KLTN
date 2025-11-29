import { useTheme, Box, FormControl, InputLabel, Select, MenuItem, TextField, Paper, Typography, ToggleButton, ToggleButtonGroup, Button, CircularProgress, useMediaQuery } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getRevenueStatistics, exportExcelReport, exportPDFReport } from "./BarApi";
import { useNavigate } from "react-router-dom";
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const BarChart = ({ isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filterType, setFilterType] = useState("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewType, setViewType] = useState("all");
  const [statType, setStatType] = useState("revenue");
  const [showTable, setShowTable] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: "", label: "Tất cả tháng" },
    { value: 1, label: "Tháng 1" },
    { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
    { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" },
    { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" },
    { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" },
    { value: 12, label: "Tháng 12" },
  ];

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const params = {
          status: "paid",
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
        };

        if (filterType === "year") {
          params.year = selectedYear;
        } else if (filterType === "month") {
          params.year = selectedYear;
          if (selectedMonth) params.month = selectedMonth;
        } else if (filterType === "range") {
          if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
              setErrorMessage("Ngày bắt đầu phải trước ngày kết thúc!");
              setData([]);
              setRowCount(0);
              setLoading(false);
              toast.error("Ngày bắt đầu phải trước ngày kết thúc!", { position: "top-right" });
              return;
            }
            params.startDate = startDate;
            params.endDate = endDate;
          } else {
            setErrorMessage("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc!");
            setData([]);
            setRowCount(0);
            setLoading(false);
            toast.error("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc!", { position: "top-right" });
            return;
          }
        }

        // console.log("Sending request with params:", params);
        const response = await getRevenueStatistics(params);
        // console.log("API Response:", response);

        if (response.code === 200 && Array.isArray(response.data)) {
          if (response.data.length === 0) {
            setErrorMessage(`Không có dữ liệu thống kê cho ${filterType === "year" ? `năm ${selectedYear}` : filterType === "month" ? `tháng ${selectedMonth || "tất cả"} năm ${selectedYear}` : `khoảng thời gian từ ${startDate} đến ${endDate}`}.`);
            setData([]);
            setRowCount(0);
            toast.info(`Không có dữ liệu thống kê cho ${filterType === "year" ? `năm ${selectedYear}` : filterType === "month" ? `tháng ${selectedMonth || "tất cả"} năm ${selectedYear}` : `khoảng thời gian từ ${startDate} đến ${endDate}`}.`, { position: "top-right" });
          } else {
            const formattedData = response.data
              .map((item, index) => {
                if (!item.month || !isFinite(item.totalPrice)) {
                  console.warn("Dữ liệu không hợp lệ:", item);
                  return null;
                }
                return {
                  id: `${item.month}-${index}`,
                  month: item.month,
                  tours: Number(item.tours) || 0,
                  hotels: Number(item.hotels) || 0,
                  totalPrice: Number(item.totalPrice) || 0,
                  tourRevenue: Number(item.tourRevenue) || 0,
                  hotelRevenue: Number(item.hotelRevenue) || 0,
                };
              })
              .filter((item) => item !== null);

            // console.log("Formatted Data:", formattedData);
            setData(formattedData);
            setRowCount(response.totalItems || formattedData.length);
            if (formattedData.length === 0) {
              setErrorMessage(`Không có dữ liệu hợp lệ cho ${filterType === "year" ? `năm ${selectedYear}` : filterType === "month" ? `tháng ${selectedMonth || "tất cả"} năm ${selectedYear}` : `khoảng thời gian từ ${startDate} đến ${endDate}`}.`);
              toast.info(`Không có dữ liệu hợp lệ cho ${filterType === "year" ? `năm ${selectedYear}` : filterType === "month" ? `tháng ${selectedMonth || "tất cả"} năm ${selectedYear}` : `khoảng thời gian từ ${startDate} đến ${endDate}`}.`, { position: "top-right" });
            }
          }
        } else {
          setErrorMessage(`Lỗi API: Mã ${response.code || "không xác định"}.`);
          setData([]);
          setRowCount(0);
          toast.error(`Lỗi API: ${response.message || "Không xác định"}`, { position: "top-right" });
        }
      } catch (error) {
        // console.error("Lỗi khi lấy dữ liệu thống kê:", error);
        const errorMsg = error.response?.data?.message || `Lỗi kết nối API: ${error.message}`;
        setErrorMessage(errorMsg);
        setData([]);
        setRowCount(0);
        toast.error(errorMsg, { position: "top-right" });
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
          localStorage.removeItem("adminToken");
          navigate("/loginadmin");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStatistics();
  }, [filterType, selectedYear, selectedMonth, startDate, endDate, paginationModel, navigate]);

  const getChartConfig = () => {
    let keys = [];
    let barColors = [];
    let legendLabels = [];

    if (viewType === "all") {
      if (statType === "quantity") {
        keys = ["tours", "hotels"];
        barColors = [colors.blueAccent[400], colors.greenAccent[400]];
        legendLabels = ["SL Tours", "SL Hotels"];
      } else {
        keys = ["tourRevenue", "hotelRevenue"];
        barColors = [colors.blueAccent[400], colors.greenAccent[400]];
        legendLabels = ["DT Tours", "DT Hotels"];
      }
    } else if (viewType === "tours") {
      keys = [statType === "quantity" ? "tours" : "tourRevenue"];
      barColors = [colors.blueAccent[400]];
      legendLabels = ["Tours"];
    } else if (viewType === "hotels") {
      keys = [statType === "quantity" ? "hotels" : "hotelRevenue"];
      barColors = [colors.greenAccent[400]];
      legendLabels = ["Hotels"];
    }

    return { keys, barColors, legendLabels };
  };

  const { keys, barColors, legendLabels } = getChartConfig();

  const handleResetFilters = () => {
    setFilterType("year");
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth("");
    setStartDate("");
    setEndDate("");
    setPaginationModel({ page: 0, pageSize: 10 });
    setErrorMessage("");
  };

  const toggleTableVisibility = () => {
    setShowTable((prev) => !prev);
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const params = {
        status: "paid",
      };

      if (filterType === "year") {
        params.year = selectedYear;
      } else if (filterType === "month") {
        params.year = selectedYear;
        if (selectedMonth) params.month = selectedMonth;
      } else if (filterType === "range") {
        if (startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        } else {
          toast.error("Vui lòng chọn đầy đủ khoảng thời gian!", { position: "top-right" });
          setLoading(false);
          return;
        }
      }

      await exportExcelReport(params);
      toast.success("Xuất báo cáo Excel thành công!", { position: "top-right" });
    } catch (error) {
      toast.error("Lỗi khi xuất báo cáo Excel!", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const params = {
        status: "paid",
      };

      if (filterType === "year") {
        params.year = selectedYear;
      } else if (filterType === "month") {
        params.year = selectedYear;
        if (selectedMonth) params.month = selectedMonth;
      } else if (filterType === "range") {
        if (startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        } else {
          toast.error("Vui lòng chọn đầy đủ khoảng thời gian!", { position: "top-right" });
          setLoading(false);
          return;
        }
      }

      await exportPDFReport(params);
      toast.success("Xuất báo cáo PDF thành công!", { position: "top-right" });
    } catch (error) {
      toast.error("Lỗi khi xuất báo cáo PDF!", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "month", headerName: "Tháng", flex: 0.5 },
    { field: "tours", headerName: "Số lượng Tours", flex: 0.7 },
    { field: "hotels", headerName: "Số lượng Hotels", flex: 0.7 },
    {
      field: "totalPrice",
      headerName: "",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Typography color={colors.grey[100]}>
            {Math.round(params.value / 1000).toLocaleString("vi-VN")}
          </Typography>
        </Box>
      ),
    },
    {
      field: "tourRevenue",
      headerName: "Doanh thu Tours (K VNĐ)",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Typography color={colors.grey[100]}>
            {Math.round(params.value / 1000).toLocaleString("vi-VN")}
          </Typography>
        </Box>
      ),
    },
    {
      field: "hotelRevenue",
      headerName: "Doanh thu Hotels (K VNĐ)",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" height="100%">
          <Typography color={colors.grey[100]}>
            {Math.round(params.value / 1000).toLocaleString("vi-VN")}
          </Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
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
      <Typography variant="h2" sx={{ mb: 3, color: colors.grey[100] }}>
        Báo cáo doanh thu
      </Typography>

      <Paper sx={{ p: 2, mb: 2, backgroundColor: colors.primary[400] }}>
        <Box
          display="flex"
          flexDirection={isMobile ? "column" : "row"}
          alignItems={isMobile ? "stretch" : "center"}
          justifyContent="space-between"
          gap={2}
        >
          <Box display="flex" flexDirection={isMobile ? "column" : "row"} alignItems={isMobile ? "stretch" : "center"} gap={2}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Loại báo cáo</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Loại báo cáo"
              >
                <MenuItem value="year">Theo năm</MenuItem>
                <MenuItem value="month">Theo tháng</MenuItem>
                <MenuItem value="range">Theo khoảng thời gian</MenuItem>
              </Select>
            </FormControl>

            {filterType !== "range" && (
              <>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Năm</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    label="Năm"
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {filterType === "month" && (
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Tháng</InputLabel>
                    <Select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      label="Tháng"
                    >
                      {months.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}

            {filterType === "range" && (
              <>
                <TextField
                  label="Từ ngày"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: isMobile ? "100%" : 180 }}
                />
                <TextField
                  label="Đến ngày"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: isMobile ? "100%" : 180 }}
                />
              </>
            )}
            <Button
              sx={{ ml: 1, backgroundColor: "white" }}
              variant="outlined"
              onClick={handleResetFilters}
            >
              Đặt lại
            </Button>
          </Box>

          <Box display="flex" flexDirection={isMobile ? "column" : "row"} gap={2}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              disabled={loading || data.length === 0}
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: colors.grey[100],
                "&:hover": {
                  backgroundColor: colors.greenAccent[700],
                },
              }}
            >
              Xuất Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExportPDF}
              disabled={loading || data.length === 0}
              sx={{
                backgroundColor: colors.redAccent[600],
                color: colors.grey[100],
                "&:hover": {
                  backgroundColor: colors.redAccent[700],
                },
              }}
            >
              Xuất PDF
            </Button>
          </Box>

          <Box display="flex" flexDirection={isMobile ? "column" : "row"} gap={2}>
            <ToggleButtonGroup
              value={statType}
              exclusive
              onChange={(e, newValue) => {
                if (newValue !== null) setStatType(newValue);
              }}
              sx={{
                backgroundColor: colors.primary[400],
                "& .MuiToggleButton-root": {
                  color: colors.grey[100],
                  "&.Mui-selected": {
                    backgroundColor: colors.blueAccent[700],
                    color: colors.grey[100],
                  },
                },
              }}
            >
              <ToggleButton value="revenue">Doanh thu</ToggleButton>
              <ToggleButton value="quantity">Số lượng</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={(e, newValue) => {
                if (newValue !== null) setViewType(newValue);
              }}
              sx={{
                backgroundColor: colors.primary[400],
                "& .MuiToggleButton-root": {
                  color: colors.grey[100],
                  "&.Mui-selected": {
                    backgroundColor: colors.blueAccent[700],
                    color: colors.grey[100],
                  },
                  '&[value="all"]': {
                    '&.Mui-selected': {
                      backgroundColor: colors.redAccent[400],
                    },
                  },
                  '&[value="hotels"]': {
                    '&.Mui-selected': {
                      backgroundColor: colors.greenAccent[500],
                    },
                  },
                },
              }}
            >
              <ToggleButton value="all">Tổng hợp</ToggleButton>
              <ToggleButton value="tours">Tours</ToggleButton>
              <ToggleButton value="hotels">Hotels</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, backgroundColor: colors.primary[400] }}>
        <Box sx={{ minHeight: isMobile ? 300 : isDashboard ? 200 : 400, height: isDashboard ? "40vh" : isMobile ? "60vh" : "75vh" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : errorMessage ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="error">{errorMessage}</Typography>
            </Box>
          ) : data.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography>Không có dữ liệu để hiển thị.</Typography>
            </Box>
          ) : (
            <>
              <Typography
                variant="h6"
                sx={{
                  textAlign: "center",
                  color: colors.grey[100],
                  mb: 2,
                }}
              >
                {statType === "revenue" ? "Doanh thu (nghìn VNĐ)" : "Số lượng"}
              </Typography>
              <ResponsiveBar
                data={data}
                theme={{
                  axis: {
                    domain: {
                      line: {
                        stroke: colors.grey[100],
                      },
                    },
                    legend: {
                      text: {
                        fill: colors.grey[100],
                      },
                    },
                    ticks: {
                      line: {
                        stroke: colors.grey[100],
                        strokeWidth: 1,
                      },
                      text: {
                        fill: colors.grey[100],
                      },
                    },
                  },
                  legends: {
                    text: {
                      fill: colors.grey[100],
                    },
                  },

                }}
                layout="vertical"
                valueFormat={(value) => {
                  if (!isFinite(value)) return "0";
                  if (statType === "quantity") {
                    return Math.round(value);
                  }
                  return Math.round(value / 1000);
                }}
                keys={keys}
                indexBy="month"
                margin={{ top: 50, right: isMobile ? 50 : 130, bottom: 70, left: isMobile ? 50 : 60 }}
                padding={0.3}
                valueScale={{ type: "linear" }}
                indexScale={{ type: "band", round: true }}
                colors={barColors}
                borderColor={{
                  from: "color",
                  modifiers: [["darker", "1.6"]],
                }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: isMobile ? 45 : 0,
                  legend: isDashboard ? undefined : filterType === "range" ? "Ngày" : "Tháng",
                  legendPosition: "middle",
                  legendOffset: 50,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  format: (value) => {
                    if (!isFinite(value)) return "0";
                    if (statType === "quantity") {
                      return Math.round(value);
                    }
                    return Math.round(value / 1000);
                  },
                  legendPosition: "middle",
                  legendOffset: isMobile ? -45 : -50,
                }}
                enableLabel={true}
                label={(d) => {
                  if (statType === "quantity") {
                    return Math.round(d.value);
                  }
                  // Hiển thị số tiền đầy đủ với định dạng 1.000.000 đ
                  return `${(d.value * 1000).toLocaleString('vi-VN')} đ`;
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{
                  from: "color",
                  modifiers: [["darker", 1.6]],
                }}

                legends={
                  isMobile || isDashboard
                    ? []
                    : [
                      {
                        data: legendLabels.map((label, index) => ({
                          id: keys[index] || label,
                          label: label,
                          color: barColors[index],
                        })),
                        anchor: "bottom-right",
                        direction: "column",
                        justify: false,
                        translateX: 120,
                        translateY: 0,
                        itemsSpacing: 2,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemDirection: "left-to-right",
                        itemOpacity: 0.85,
                        symbolSize: 20,
                        effects: [
                          {
                            on: "hover",
                            style: {
                              itemOpacity: 1,
                            },
                          },
                        ],
                      },
                    ]
                }
                role="application"
                barAriaLabel={(e) =>
                  `${e.id}: ${e.formattedValue} trong ${filterType === "range" ? "ngày" : "tháng"}: ${e.indexValue}`
                }
              />
            </>
          )}
        </Box>
        {data.length > 0 && (
          <>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                onClick={toggleTableVisibility}
                sx={{ backgroundColor: colors.blueAccent[400], "&:hover": { backgroundColor: colors.blueAccent[300] } }}
              >
                {showTable ? "Ẩn bảng" : "Hiện bảng"}
              </Button>
            </Box>
            {showTable && (
              <Box
                mt={2}
                height="300px"
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
                <DataGrid
                  hideFooter={true}
                  rows={data}
                  columns={columns}
                  getRowId={(row) => row.id}
                  pagination
                  paginationMode="server"
                  rowCount={rowCount}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  pageSizeOptions={[5, 10, 20]}
                  getRowHeight={() => 60}
                  sx={{ width: "100%" }}
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default BarChart;