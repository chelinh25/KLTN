import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import DashboardIcon from '@mui/icons-material/Dashboard';
import TourIcon from '@mui/icons-material/Tour';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import AppsOutageIcon from '@mui/icons-material/AppsOutage';
import BusinessIcon from '@mui/icons-material/Business';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useState, useEffect } from "react";
import { getGeneralSettings } from "../../Admin/Setting/SettingApi";

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[100],
      }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Typography>{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const [settings, setSettings] = useState({
    websiteName: "GoTravel",
    logo: ""
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getGeneralSettings();
        if (data) {
          setSettings({
            websiteName: data.websiteName || "GoTravel",
            logo: data.logo || ""
          });
        }
      } catch (error) {
        console.error("Error fetching settings in Sidebar:", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
        boxShadow: "5px 0 10px rgba(0, 0, 0, 0.2)", // Adjusted shadow to cast to the right
        zIndex: 2,
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Typography variant="h3" color={colors.grey[100]}>
                  ADMIN
                </Typography>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="website-logo"
                  width="100px"
                  height="100px"
                  src={settings.logo || "https://images.seeklogo.com/logo-png/39/1/go-travel-logo-png_seeklogo-399837.png"}
                  style={{ cursor: "pointer", borderRadius: "50%", border: "2px solid" }}
                />
              </Box>
              <Box textAlign="center">
                <Typography
                  variant="h2"
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{ m: "10px 0 0 0" }}
                >
                  {settings.websiteName}
                </Typography>
              </Box>
            </Box>
          )}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title="Bảng Điều Khiển"
              to="/admin/dashboard"
              icon={<DashboardIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Quản lý
            </Typography>
            <Item
              title="Quản lý danh mục tour"
              to="/admin/category"
              icon={<FormatListBulletedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Quản lý tour"
              to="/admin/tourcontrol"
              icon={<TourIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Quản lý hoá đơn"
              to="/admin/invoices"
              icon={<ReceiptOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Quản lý voucher"
              to="/admin/voucher"
              icon={<ConfirmationNumberIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Quản lý khách sạn"
              to="/admin/hotel"
              icon={<BusinessIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Quản lý đánh giá"
              to="/admin/review"
              icon={<RateReviewOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Quản lý khách hàng"
              to="/admin/contacts"
              icon={<ContactsOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Quyền
            </Typography>

            <Item
              title="Nhóm quyền"
              to="/admin/rightsgroup"
              icon={<AppsOutageIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Phân quyền"
              to="/admin/delegation"
              icon={<AppRegistrationIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Doanh thu
            </Typography>

            <Item
              title="Báo cáo doanh thu"
              to="/admin/bar"
              icon={<BarChartOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Nội bộ
            </Typography>

            <Item
              title="Quản lý nhân viên"
              to="/admin/team"
              icon={<PeopleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Cài đặt website"
              to="/admin/settings"
              icon={<SettingsOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;