import React, { useState, useEffect } from "react";
import Banner from "../../components/Banner/Banner";
import AdvanceSearch from "../../components/AdvanceSearch/AdvanceSearch";
import Features from "../../components/Features/Features";
import { Container, Row, Col } from "react-bootstrap";
import PopularCard from "../../components/Cards/PopularCard";
import HotelCard from "../../pages/HotelService/HotelCard";
import api from "../../utils/api";
import { toast } from "react-toastify";
import Gallery from "../../components/Gallery/Gallery";
import "./home.css";

const Home = () => {
  const [topSallers, setTopSallers] = useState([]);
  const [newTours, setNewTours] = useState([]);
  const [topHotelSallers, setTopHotelSallers] = useState([]);
  const [topRatedHotels, setTopRatedHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Trang chủ - GoTravel";
    window.scrollTo(0, 0);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/api/v1/");
      const data = response.data;

      if (!data || !data.topSallers || !data.newTours || !data.topHotelSallers || !data.topRatedHotels) {
        throw new Error("Không nhận được dữ liệu đầy đủ từ API!");
      }

      // Xử lý topSallers (Tour Phổ Biến)
      const formattedTopSallers = (data.topSallers || []).map((tour) => ({
        id: tour._id,
        title: tour.title,
        images: tour.images || [],
        price: tour.price || 0,
        discount: tour.discount || 0,
        slug: tour.slug,
        timeStarts: tour.timeStarts || [],
      }));
      setTopSallers(formattedTopSallers);

      // Xử lý newTours (Tour Nổi Bật)
      const formattedNewTours = (data.newTours || []).map((tour) => ({
        id: tour._id,
        title: tour.title,
        images: tour.images || [],
        price: tour.price || 0,
        discount: tour.discount || 0,
        slug: tour.slug,
        timeStarts: tour.timeStarts || [],
      }));
      setNewTours(formattedNewTours);

      // Xử lý topHotelSallers (Hotel Phổ Biến)
      const formattedTopHotelSallers = (data.topHotelSallers || []).map((hotel) => ({
        _id: hotel._id,
        name: hotel.name,
        images: hotel.images || [],
        location: hotel.location || { city: "Không xác định", country: "Không xác định" },
      }));
      setTopHotelSallers(formattedTopHotelSallers);

      // Xử lý topRatedHotels (Hotel Nổi Bật)
      const formattedTopRatedHotels = (data.topRatedHotels || []).map((item) => ({
        _id: item.hotel._id,
        name: item.hotel.name,
        images: item.hotel.images || [],
        location: item.hotel.location || { city: "Không xác định", country: "Không xác định" },
        averageRating: item.averageRating || null,
      }));
      setTopRatedHotels(formattedTopRatedHotels);

      console.log("Dữ liệu thành công:", {
        topSallers: formattedTopSallers,
        newTours: formattedNewTours,
        topHotelSallers: formattedTopHotelSallers,
        topRatedHotels: formattedTopRatedHotels,
      });
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      setError("Không thể tải dữ liệu từ API. Vui lòng thử lại sau!");
      toast.error("Không thể tải dữ liệu từ API!");
    } finally {
      setLoading(false);
    }
  };

  // Lọc các tour hợp lệ (có ngày khởi hành sau ngày hiện tại)
  const validTopSallers = topSallers.filter((tour) => {
    const firstTimeStart = tour.timeStarts && tour.timeStarts.length > 0 ? tour.timeStarts[0].timeDepart : null;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    return firstTimeStart && new Date(firstTimeStart) >= currentDate;
  });

  // Lọc các tour nổi bật hợp lệ (có ngày khởi hành sau ngày hiện tại)
  const validNewTours = newTours.filter((tour) => {
    const firstTimeStart = tour.timeStarts && tour.timeStarts.length > 0 ? tour.timeStarts[0].timeDepart : null;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    return firstTimeStart && new Date(firstTimeStart) >= currentDate;
  });

  return (
    <>
      <Banner />
      <AdvanceSearch />
      <Features />

      {/* Tour Nổi Bật (newTours) */}
      <section className="tours_section py-5">
        <Container>
          <Row>
            <Col md="12">
              <div className="main_heading">
                <h1>TOUR NỔI BẬT</h1>
              </div>
            </Col>
          </Row>
          <Row>
            {loading ? (
              <Col>
                <p>Đang tải tour nổi bật...</p>
              </Col>
            ) : error ? (
              <Col>
                <p>{error}</p>
              </Col>
            ) : validNewTours.length === 0 ? (
              <Col>
                <p>Không có tour nổi bật nào.</p>
              </Col>
            ) : (
              validNewTours.map((tour, inx) => (
                <Col md={3} sm={6} xs={12} className="mb-5" key={inx}>
                  <PopularCard val={tour} />
                </Col>
              ))
            )}
          </Row>
        </Container>
      </section>

      {/* Tour Phổ Biến (topSallers) */}
      <section className="popular py-5">
        <Container>
          <Row>
            <Col md="12">
              <div className="main_heading">
                <h1>TOUR PHỔ BIẾN</h1>
              </div>
            </Col>
          </Row>
          <Row>
            {loading ? (
              <Col>
                <p>Đang tải tour phổ biến...</p>
              </Col>
            ) : error ? (
              <Col>
                <p>{error}</p>
              </Col>
            ) : validTopSallers.length === 0 ? (
              <Col>
                <p>Không có tour phổ biến nào.</p>
              </Col>
            ) : (
              validTopSallers.map((val, inx) => (
                <Col md={3} sm={6} xs={12} className="mb-5" key={inx}>
                  <PopularCard val={val} />
                </Col>
              ))
            )}
          </Row>
        </Container>
      </section>

      {/* Hotel Nổi Bật (topRatedHotels) */}
      <section className="hotels_section py-5">
        <Container>
          <Row>
            <Col md="12">
              <div className="main_heading">
                <h1>HOTEL NỔI BẬT</h1>
              </div>
            </Col>
          </Row>
          <Row>
            {loading ? (
              <Col>
                <p>Đang tải khách sạn nổi bật...</p>
              </Col>
            ) : error ? (
              <Col>
                <p>{error}</p>
              </Col>
            ) : topRatedHotels.length === 0 ? (
              <Col>
                <p>Không có khách sạn nổi bật nào.</p>
              </Col>
            ) : (
              topRatedHotels.map((hotel, inx) => (
                <Col md={3} sm={6} xs={12} className="mb-5" key={inx}>
                  <HotelCard val={hotel} />
                </Col>
              ))
            )}
          </Row>
        </Container>
      </section>

      {/* Hotel Phổ Biến (topHotelSallers) */}
      <section className="popular_hotels py-5">
        <Container>
          <Row>
            <Col md="12">
              <div className="main_heading">
                <h1>HOTEL PHỔ BIẾN</h1>
              </div>
            </Col>
          </Row>
          <Row>
            {loading ? (
              <Col>
                <p>Đang tải khách sạn phổ biến...</p>
              </Col>
            ) : error ? (
              <Col>
                <p>{error}</p>
              </Col>
            ) : topHotelSallers.length === 0 ? (
              <Col>
                <p>Không có khách sạn phổ biến nào.</p>
              </Col>
            ) : (
              topHotelSallers.map((val, inx) => (
                <Col md={3} sm={6} xs={12} className="mb-5" key={inx}>
                  <HotelCard val={val} />
                </Col>
              ))
            )}
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="call_us">
        <Container>
          <Row className="align-items-center">
            <Col md="8">
              <h5 className="title">HÃY GỌI ĐIỆN NGAY</h5>
              <h2 className="heading">Sẵn sàng cho chuyến du lịch của bạn</h2>
              <p className="text">
                Hãy tận hưởng kỳ nghỉ một cách trọn vẹn nhất. Chúng tôi luôn đồng hành bạn tới những
                nơi mà bạn muốn đến. Khám phá cùng các bạn những nơi đẹp nhất Việt Nam,
              </p>
            </Col>
            <Col md="4" className="text-center mt-3 mt-md-0">
              <a href="tel:+84779407905" className="secondary_btn bounce" rel="no">
                Gọi điện ngay!
              </a>
            </Col>
          </Row>
        </Container>
        <div className="overlay"></div>
      </section>

      {/* Gallery */}
      <section className="gallery">
        <Container>
          <Row>
            <Col md="12">
              <Gallery />
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Home;