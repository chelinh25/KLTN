// src/components/CustomDropdown/CustomDropdown.jsx
import React, { useState } from "react";
import { Dropdown, Form } from "react-bootstrap";
import "../CustomDropdown/customdropdown.css";

const CustomDropdown = ({ label, options, onSelect, placeholder }) => {
  const [value, setValue] = useState(""); // Giá trị tìm kiếm trong dropdown
  const [selectedValue, setSelectedValue] = useState(""); // Giá trị đã chọn

  const handleClick = (selectedVal) => {
    setSelectedValue(selectedVal);
    onSelect(selectedVal);
    setValue("");
  };

  return (
    <>
      {label && <label className="item-search-label">{label}</label>}
      <Dropdown className="dropdown-custom" onSelect={handleClick}>
        <Dropdown.Toggle id="dropdown-custom-components">
          <span>
            {selectedValue || placeholder || "Chọn..."}
          </span>
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Form.Control
            autoFocus
            className="dropdown-search-input my-1"
            placeholder="Tìm kiếm..."
            onChange={(e) => setValue(e.target.value)}
            value={value}
          />
          <ul className="list-unstyled">
            {options
              .filter(
                (option) =>
                  !value || option?.toLowerCase().includes(value.toLowerCase())
              )
              .map((option, index) => (
                <li key={index}>
                  <Dropdown.Item eventKey={option}>
                    {option}
                  </Dropdown.Item>
                </li>
              ))}
          </ul>
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
};

export default CustomDropdown;