import React, { useState, useEffect, useRef } from "react";
import { Container, Navbar, Offcanvas, Nav, NavDropdown, Modal, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import api from "../../../utils/api";
import "../Header/header.css";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const servicesDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/api/v1/setting");
        console.log("API Response:", response);
        if (response.data) {
          console.log("Settings Data:", response.data);
          setSettings(response.data);
        } else {
          console.warn("No data returned from API");
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin cài đặt:", err.message);
        if (err.response) {
          console.error("Response Error:", err.response.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector(".header-section");
      header.classList.toggle("is-sticky", window.scrollY >= 120);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target)) {
        setShowServicesDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenLogoutModal = () => {
    setShowLogoutModal(true);
    setShowUserDropdown(false);
  };

  const handleCloseLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const toggleMenu = () => setOpen(!open);
  const toggleServicesDropdown = () => setShowServicesDropdown(!showServicesDropdown);
  const toggleUserDropdown = () => setShowUserDropdown(!showUserDropdown);

  const handleNavLinkClick = () => {
    setOpen(false);
    setShowServicesDropdown(false);
    setShowUserDropdown(false);
  };

  if (loading) {
    return <div className="text-center my-3">Đang tải...</div>;
  }

  return (
    <header className="header-section">
      <Container>
        <Navbar expand="lg" className="p-0">
          <Navbar.Brand>
            <NavLink to="/" className="d-flex align-items-center">
              {settings?.logo && (
                <img
                  src={settings.logo}
                  alt={settings.websiteName || "GoTravel"}
                  style={{ height: "60px", marginRight: "10px" }} // Thêm margin để cách websiteName
                />
              )}
              <span className="website-name">
                {settings?.websiteName || "GoTravel"}
              </span>
            </NavLink>
          </Navbar.Brand>

          <Navbar.Offcanvas
            id="offcanvasNavbar-expand-lg"
            aria-labelledby="offcanvasNavbarLabel-expand-lg"
            placement="start"
            show={open}
            onHide={() => setOpen(false)}
          >
            <Offcanvas.Header>
              <h1 className="logo d-flex align-items-center">
                {settings?.logo && (
                  <img
                    src={settings.logo}
                    alt={settings.websiteName || "GoTravel"}
                    style={{ height: "60px", marginRight: "10px" }}
                  />
                )}
                <span className="website-name">
                  {settings?.websiteName || "GoTravel"}
                </span>
              </h1>
              <span className="navbar-toggler ms-auto" onClick={toggleMenu}>
                <i className="bi bi-x-lg"></i>
              </span>
            </Offcanvas.Header>

            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1 pe-3">
                <NavLink className="nav-link" to="/" onClick={handleNavLinkClick}>
                  Trang chủ
                </NavLink>
                <NavLink className="nav-link" to="/about-us" onClick={handleNavLinkClick}>
                  Về chúng tôi
                </NavLink>
                <NavDropdown
                  title="Dịch vụ"
                  id="services-dropdown"
                  show={showServicesDropdown}
                  onToggle={toggleServicesDropdown}
                  ref={servicesDropdownRef}
                >
                  <NavLink
                    className="nav-link text-dark"
                    to="/hotel-services"
                    onClick={handleNavLinkClick}
                  >
                    Dịch vụ khách sạn
                  </NavLink>
                </NavDropdown>
                <NavLink className="nav-link" to="/categories" onClick={handleNavLinkClick}>
                  Danh mục Tour
                </NavLink>
                <NavLink className="nav-link" to="/gallery" onClick={handleNavLinkClick}>
                  Thư viện
                </NavLink>
                <NavLink className="nav-link" to="/contact-us" onClick={handleNavLinkClick}>
                  Liên hệ
                </NavLink>
                {user?.role === "admin" && (
                  <NavLink className="nav-link" to="/dashboard" onClick={handleNavLinkClick}>
                    Dashboard
                  </NavLink>
                )}
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>

          <div className="ms-md-4 ms-2 d-flex align-items-center">
            <NavLink className="cart-icon me-3 position-relative" to="/cart">
              <i className="bi bi-cart fs-5"></i>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </NavLink>

            {user ? (
              <div className={`user-section ${showUserDropdown ? "show-dropdown" : ""}`} ref={userDropdownRef}>
                <div className="user-info" onClick={toggleUserDropdown}>
                  <img
                    src={
                      user.avatar ||
                      "https://chiemtaimobile.vn/images/companies/1/%E1%BA%A2nh%20Blog/avatar-facebook-dep/Hinh-dai-dien-hai-huoc-cam-dep-duoi-ai-do.jpg?1704789789335"
                    }
                    alt="Avatar"
                    className="user-avatar rounded-circle"
                  />
                  <span className="user-name ms-2">{user.fullName}</span>
                  <i className={`bi bi-chevron-${showUserDropdown ? "up" : "down"} ms-1`}></i>
                </div>
                {showUserDropdown && (
                  <div className="user-dropdown">
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/profile");
                        setShowUserDropdown(false);
                      }}
                    >
                      Thông tin cá nhân
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/orders");
                        setShowUserDropdown(false);
                      }}
                    >
                      Đơn hàng của tôi
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/change-password");
                        setShowUserDropdown(false);
                      }}
                    >
                      Đổi mật khẩu
                    </div>
                    <div className="dropdown-item" onClick={handleOpenLogoutModal}>
                      Đăng xuất
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <NavLink className="login-icon me-3" to="/login">
                <i className="bi bi-person-circle fs-5"></i>
                <span className="login-text">Đăng nhập</span>
              </NavLink>
            )}
            <li className="d-inline-block d-lg-none ms-3 toggle_btn">
              <i className={open ? "bi bi-x-lg" : "bi bi-list"} onClick={toggleMenu}></i>
            </li>
          </div>
        </Navbar>
      </Container>

      {/* Modal xác nhận đăng xuất */}
      <Modal show={showLogoutModal} onHide={handleCloseLogoutModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận đăng xuất</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn đăng xuất không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseLogoutModal}>
            Không
          </Button>
          <Button variant="danger" onClick={handleConfirmLogout}>
            Có
          </Button>
        </Modal.Footer>
      </Modal>
    </header>
  );
};

export default Header;