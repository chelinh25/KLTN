import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaComments, FaTimes, FaTrash, FaFacebookMessenger, FaPhone } from "react-icons/fa";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./chatbox.css";

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen]);

  const fetchChatHistory = async () => {
    try {
      const response = await api.get("/chats");
      if (response.data.code === 200) {
        const history = response.data.history || [];
        if (history.length === 0) {
          setMessages([{ text: "Xin chào! Tôi có thể giúp gì cho bạn?", sender: "bot" }]);
        } else {
          const formattedMessages = history
            .filter((msg) => msg.role !== "system")
            .map((msg) => ({
              text: msg.content,
              sender: msg.role === "user" ? "user" : "bot",
            }));
          setMessages(formattedMessages);
        }
      } else if (response.data.code === 400 && response.data.message?.includes("token")) {
        setMessages([{ text: "Xin chào! Tôi có thể giúp gì cho bạn?", sender: "bot" }]);
        // Không cần toast.error vì guest có thể chat
      } else {
        setMessages([{ text: "Xin chào! Tôi có thể giúp gì cho bạn?", sender: "bot" }]);
      }
    } catch (error) {
      // Guest user - không có lịch sử
      setMessages([{ text: "Xin chào! Tôi có thể giúp gì cho bạn?", sender: "bot" }]);
    }
  };

  const toggleChatbox = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, { ...userMessage, animate: true }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/chats", { message: userMessage.text });
      
      if (response.data && response.data.reply) {
        const botMessage = {
          text: response.data.reply,
          sender: "bot",
          animate: true,
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: "Xin lỗi, tôi không thể trả lời lúc này!", sender: "bot", animate: true },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      
      let errorMessage = "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại! 😊";
      
      if (error.response?.status === 429) {
        errorMessage = "Quá nhiều yêu cầu! Vui lòng thử lại sau ít phút. 🙏";
      } else if (error.response?.status === 500) {
        errorMessage = "Hệ thống đang bận, vui lòng thử lại sau! 😊";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: errorMessage, sender: "bot", animate: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const clearChatHistory = async () => {
    try {
      const response = await api.patch("/chats/clear");
      if (response.data.code === 200) {
        toast.success(response.data.message || "Đã xóa lịch sử!");
        setMessages([{ text: "Xin chào! Tôi có thể giúp gì cho bạn?", sender: "bot" }]);
      } else if (response.data.code === 400 && response.data.message?.includes("token")) {
        toast.error("Vui lòng đăng nhập để xóa lịch sử!");
        navigate("/login");
      } else {
        toast.error(response.data.message || "Không thể xóa lịch sử!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa lịch sử!");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const openMessenger = () => {
    window.open("https://www.facebook.com/profile.php?id=61575213824007", "_blank");
  };

  const callPhone = () => {
    window.location.href = "tel:+123456789";
  };

  return (
    <div className="chat-container">
      <div className="icon-group">
        <div className="chat-icon-wrapper">
          {!isOpen && (
            <button className="chatbox-icon" onClick={toggleChatbox}>
              <FaComments />
            </button>
          )}
          {!isOpen && <span className="chat-label">Bạn có thể gửi tư vấn ở đây</span>}
        </div>
        <button className="messenger-icon" onClick={openMessenger}>
          <FaFacebookMessenger />
        </button>
        <button className="phone-icon" onClick={callPhone}>
          <FaPhone />
        </button>
      </div>
      {isOpen && (
        <div className={`chatbox ${!isOpen ? "hidden" : ""}`}>
          <div className="chat-header">
            <span>Hỗ trợ tư vấn</span>
            <div>
              <button className="clear-btn" onClick={clearChatHistory}>
                <FaTrash /> Xóa
              </button>
              <button className="close-btn" onClick={toggleChatbox}>
                <FaTimes />
              </button>
            </div>
          </div>
          <div className="chatbox-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender} ${msg.animate ? "fade-in" : ""}`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="loading">
                <span>Đang xử lý</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbox-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              disabled={isLoading}
            />
            <button onClick={sendMessage} disabled={isLoading}>
              {isLoading ? "..." : "Gửi"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;