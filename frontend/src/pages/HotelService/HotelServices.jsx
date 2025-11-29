import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { Container, Row, Col, Offcanvas, Spinner } from "react-bootstrap";
import HotelCard from "./HotelCard";
import HotelFilters from "./HotelFilters";
import api from "../../utils/api";
import { toast } from "react-toastify";
import "./hotel.css";

const HotelServices = () => {
  const [show, setShow] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    document.title = "Dịch vụ khách sạn - GoTravel";
    window.scrollTo(0, 0);
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const response = await api.get("/hotels");
      setHotels(response.data);
      setFilteredHotels(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khách sạn:", error);
      toast.error("Không thể tải danh sách khách sạn!");
      setHotels([]);
      setFilteredHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters) => {
    let filtered = [...hotels];

    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(
        (hotel) =>
          hotel.location?.city?.toLowerCase().includes(locationLower) ||
          hotel.location?.country?.toLowerCase().includes(locationLower)
      );
    }

    filtered = filtered.filter((hotel) => {
      const minPrice = hotel.rooms.length
        ? Math.min(...hotel.rooms.map((room) => room.price))
        : 0;
      return (
        minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1]
      );
    });

    if (filters.starRating) {
      filtered = filtered.filter(
        (hotel) => hotel.starRating === Number(filters.starRating)
      );
    }

    if (filters.amenities.length > 0) {
      filtered = filtered.filter((hotel) =>
        hotel.rooms.some((room) =>
          filters.amenities.every((amenity) =>
            room.amenities?.includes(amenity)
          )
        )
      );
    }

    if (filters.roomType) {
      filtered = filtered.filter((hotel) =>
        hotel.rooms.some((room) => room.type === filters.roomType)
      );
    }

    setFilteredHotels(filtered);
  };

  return (
    <>
      <Breadcrumbs title="Dịch vụ khách sạn" pagename="Dịch vụ khách sạn" />
      <section className="hotel-section">
        <Container>
          <Row>
            <Col xl="3" lg="4" md="12" sm="12">
              <div className="d-lg-none d-block">
                <button className="primaryBtn mb-4" onClick={handleShow}>
                  <i className="bi bi-funnel"></i> Bộ lọc
                </button>
              </div>
              <div className="hotel-filters d-lg-block d-none">
                <HotelFilters onFilterChange={handleFilterChange} hotels={hotels} />
              </div>
            </Col>
            <Col xl="9" lg="8" md="12" sm="12" className="hotel-content">
              {loading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Đang tải danh sách khách sạn...</p>
                </div>
              ) : filteredHotels.length === 0 ? (
                <p>Không tìm thấy khách sạn nào.</p>
              ) : (
                <Row className="hotel-list">
                  {filteredHotels.map((hotel, inx) => (
                    <Col xl={4} lg={6} md={6} sm={6} key={inx}>
                      <HotelCard val={hotel} />
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      <Offcanvas show={show} onHide={handleClose} className="hotel-offcanvas">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Bộ lọc</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <HotelFilters onFilterChange={handleFilterChange} hotels={hotels} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default HotelServices;