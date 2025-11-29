import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { Container, Row, Col, Offcanvas, Form } from "react-bootstrap";
import PopularCard from "../../components/Cards/PopularCard";
import Filters from "./Filters";
import api from "../../utils/api";
import { toast } from "react-toastify";
import "../Tours/tour.css";

const Tours = () => {
  const { slugCategory } = useParams();
  const [show, setShow] = useState(false);
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [categoryTitle, setCategoryTitle] = useState("Tours");
  const [loading, setLoading] = useState(false);
  const [sortOption, setSortOption] = useState("default");
  const [filters, setFilters] = useState({
    title: "",
    category: [],
    price: [],
  });

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    document.title = `${categoryTitle} - GoTravel`;
    window.scrollTo(0, 0);
    fetchTours();
  }, [slugCategory]);

  const fetchTours = async () => {
    setLoading(true);
    try {
      let url = "/tours";
      if (slugCategory) {
        url = `/tours/${slugCategory}`;
        const categoryResponse = await api.get("/categories");
        const category = categoryResponse.data.find((cat) => cat.slug === slugCategory);
        if (category) {
          setCategoryTitle(category.title);
        } else {
          setCategoryTitle("Danh mục không xác định");
        }
      }
      const response = await api.get(url);
      console.log("Dữ liệu tours từ API:", response.data);
      const toursData = response.data || [];
      // Định dạng dữ liệu để đảm bảo khớp với schema
      const formattedTours = toursData.map((tour) => ({
        ...tour,
        title: tour.title || "Không có tiêu đề",
        category_id: tour.category_id || "",
        price: tour.price || 0,
        discount: tour.discount || 0,
        timeStarts: tour.timeStarts || [],
      }));
      setTours(formattedTours);
      applyFiltersAndSort(formattedTours);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tour:", error);
      const errorMessage = error.response?.data?.message || "Không thể tải danh sách tour!";
      toast.error(errorMessage);
      setTours([]);
      setFilteredTours([]);
    } finally {
      setLoading(false);
    }
  };

  const filterValidTours = (toursData) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return toursData.filter((tour) => {
      const firstTimeStart = tour.timeStarts?.length > 0 ? tour.timeStarts[0].timeDepart : null;
      return firstTimeStart && new Date(firstTimeStart) >= currentDate;
    });
  };

  const sortToursByDate = (toursData) => {
    return [...toursData].sort((a, b) => {
      const firstDateA = a.timeStarts?.[0]?.timeDepart ? new Date(a.timeStarts[0].timeDepart) : new Date(0);
      const firstDateB = b.timeStarts?.[0]?.timeDepart ? new Date(b.timeStarts[0].timeDepart) : new Date(0);
      return firstDateA - firstDateB;
    });
  };

  const applyFiltersAndSort = (toursData) => {
    let filtered = [...toursData];

    // Lọc các tour còn hợp lệ (chưa qua ngày hiện tại)
    filtered = filterValidTours(filtered);

    // Áp dụng bộ lọc người dùng (title, category, price)
    if (filters.title) {
      filtered = filtered.filter((tour) =>
        tour.title?.toLowerCase().includes(filters.title.toLowerCase())
      );
    }

    if (filters.category.length > 0) {
      filtered = filtered.filter((tour) =>
        tour.category_id && Array.isArray(filters.category) && filters.category.includes(tour.category_id)
      );
    }

    if (filters.price.length > 0) {
      filtered = filtered.filter((tour) => {
        const tourPrice = tour.price * (1 - (tour.discount || 0) / 100); // Giá sau giảm
        return filters.price.some((priceRange) => {
          const [minStr, maxStr] = priceRange.split(" - ");
          const min = parseInt(minStr.replace(/[^0-9]/g, "")) || 0; // Loại bỏ ký tự không phải số
          const max = maxStr ? parseInt(maxStr.replace(/[^0-9]/g, "")) : Infinity;
          return tourPrice >= min && tourPrice <= max;
        });
      });
    }

    // Sắp xếp mặc định theo ngày khởi hành tăng dần
    filtered = sortToursByDate(filtered);

    // Áp dụng sắp xếp từ dropdown (nếu có)
    if (sortOption === "priceAsc") {
      filtered.sort((a, b) => {
        const priceA = a.price * (1 - (a.discount || 0) / 100);
        const priceB = b.price * (1 - (b.discount || 0) / 100);
        return priceA - priceB;
      });
    } else if (sortOption === "priceDesc") {
      filtered.sort((a, b) => {
        const priceA = a.price * (1 - (a.discount || 0) / 100);
        const priceB = b.price * (1 - (b.discount || 0) / 100);
        return priceB - priceA;
      });
    } else if (sortOption === "dateAsc") {
      filtered = sortToursByDate(filtered);
    } else if (sortOption === "dateDesc") {
      filtered = sortToursByDate(filtered).reverse();
    }

    setFilteredTours(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    applyFiltersAndSort(tours);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    applyFiltersAndSort(tours);
  };

  useEffect(() => {
    applyFiltersAndSort(tours);
  }, [sortOption, filters, tours]);

  console.log("Rendering Tours - filteredTours:", filteredTours);

  return (
    <>
      <Breadcrumbs title={categoryTitle} pagename="Tours" />
      <section className="py-5 tour_list">
        <Container>
          <Row>
            <Col xl="3" lg="4" md="12" sm="12">
              <div className="d-lg-none d-block">
                <button className="primaryBtn mb-4" onClick={handleShow}>
                  <i className="bi bi-funnel"></i> Bộ lọc
                </button>
              </div>
              <div className="filters d-lg-block d-none">
                <Filters onFilterChange={handleFilterChange} />
              </div>
            </Col>
            <Col xl="9" lg="8" md="12" sm="12">
              <div className="mb-4">
                <Form.Select value={sortOption} onChange={handleSortChange} className="w-auto d-inline-block">
                  <option value="default">Sắp xếp theo</option>
                  <option value="priceAsc">Giá: Thấp đến Cao</option>
                  <option value="priceDesc">Giá: Cao đến Thấp</option>
                  <option value="dateAsc">Ngày khởi hành: Sớm đến Muộn</option>
                  <option value="dateDesc">Ngày khởi hành: Muộn đến Sớm</option>
                </Form.Select>
              </div>
              {loading ? (
                <p>Đang tải danh sách tour...</p>
              ) : filteredTours.length === 0 ? (
                <p>Không tìm thấy tour nào.</p>
              ) : (
                <Row>
                  {filteredTours.map((val, inx) => (
                    <Col xl={4} lg={6} md={6} sm={6} className="mb-5" key={val._id || inx}>
                      <PopularCard val={val} />
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      <Offcanvas show={show} onHide={handleClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Bộ lọc</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Filters onFilterChange={handleFilterChange} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Tours;