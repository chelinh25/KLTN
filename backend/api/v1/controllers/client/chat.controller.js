const axios = require("axios");
const stringSimilarity = require("string-similarity");
const Chat = require("../../models/chat.model");
const Tour = require("../../models/tour.model");
const CachedResponse = require("../../models/CachedResponse");

// Queue để xử lý request tuần tự
let requestQueue = [];
let isProcessing = false;

// Hàm delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm gọi OpenRouter API (fallback)
async function callOpenRouterAPI(messages, maxRetries = 2) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Chuyển đổi messages sang format OpenAI-compatible
            const formattedMessages = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: "mistralai/mistral-7b-instruct:free", // Model miễn phí từ OpenRouter
                    messages: formattedMessages,
                    temperature: 0.7,
                    max_tokens: 1024,
                },
                {
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": process.env.FE_URL || "http://localhost:3001",
                        "X-Title": "GoTravel Chat"
                    },
                    timeout: 25000
                }
            );
            
            return { 
                success: true, 
                data: { 
                    candidates: [{ 
                        content: { 
                            parts: [{ text: response.data.choices[0].message.content }] 
                        } 
                    }] 
                },
                provider: "openrouter"
            };
        } catch (error) {
            lastError = error;
            console.error(`OpenRouter attempt ${attempt}/${maxRetries} failed:`, error.response?.status);
            
            if (error.response?.status === 429 && attempt < maxRetries) {
                await delay(2000);
                continue;
            }
            break;
        }
    }
    
    return { 
        success: false, 
        error: lastError,
        status: lastError?.response?.status 
    };
}

// Hàm gọi Google Gemini API với nhiều API key
async function callGeminiAPI(messages, maxRetries = 2) {
    // Danh sách API keys (thêm key dự phòng nếu có)
    const apiKeys = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_2, // Có thể thêm key thứ 2
        process.env.GEMINI_API_KEY_3  // Có thể thêm key thứ 3
    ].filter(Boolean); // Loại bỏ undefined
    
    let lastError = null;
    
    // Thử từng API key
    for (const apiKey of apiKeys) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Chuyển đổi messages sang format của Gemini
                const contents = messages
                    .filter(msg => msg.role !== "system")
                    .map(msg => ({
                        role: msg.role === "assistant" ? "model" : "user",
                        parts: [{ text: msg.content }]
                    }));
                
                // Lấy system instruction từ system message
                const systemInstruction = messages.find(msg => msg.role === "system")?.content || "";
                
                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                    {
                        contents: contents,
                        systemInstruction: {
                            parts: [{ text: systemInstruction }]
                        },
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1024,
                        }
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                        timeout: 30000
                    }
                );
                
                console.log(`✓ Gemini API success with key #${apiKeys.indexOf(apiKey) + 1}`);
                return { success: true, data: response.data, provider: "gemini" };
            } catch (error) {
                lastError = error;
                console.error(`Gemini key #${apiKeys.indexOf(apiKey) + 1} attempt ${attempt}/${maxRetries} failed:`, error.response?.status);
                
                // Nếu là lỗi 429 hoặc 503 và chưa hết retry
                if ((error.response?.status === 429 || error.response?.status === 503) && attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 2000; // Tăng thời gian chờ
                    console.log(`Rate limited. Waiting ${waitTime/1000}s...`);
                    await delay(waitTime);
                    continue;
                }
                
                // Nếu không phải lỗi có thể retry, thử key tiếp theo
                if (error.response?.status !== 429 && error.response?.status !== 503) {
                    break;
                }
            }
        }
    }
    
    // Trả về lỗi
    return { 
        success: false, 
        error: lastError,
        status: lastError?.response?.status 
    };
}

const invalidTopics = [
    "bóng đá", "bóng rổ", "bóng chuyền", "tennis", "cầu lông", "võ thuật", "thể thao",
    "công nghệ", "lập trình", "máy tính", "ai", "trí tuệ nhân tạo", "robot", "phần mềm", "phần cứng",
    "âm nhạc", "ca sĩ", "nhạc sĩ", "bài hát", "bản nhạc", "rap", "phim", "diễn viên", "truyền hình", "showbiz", "ca nhạc", "manga", "anime", "truyện tranh", "game", "trò chơi",
    "nấu ăn", "món ăn", "ẩm thực", "bếp núc", "công thức", "đầu bếp",
    "toán học", "vật lý", "hóa học", "sinh học", "khoa học", "lịch sử", "địa lý", "ngôn ngữ", "văn học", "giáo dục",
    "xe máy", "ô tô", "xe cộ", "phương tiện", "xe đạp", "xe tải", "mô tô",
    "chính trị", "tôn giáo", "chiến tranh", "biểu tình", "xã hội", "pháp luật", "chứng khoán", "tiền điện tử", "bitcoin", "crypto",
    "tập gym", "chạy bộ", "sức khỏe", "dinh dưỡng", "bệnh", "thuốc", "bác sĩ", "y tế", "thể hình", "chế độ ăn",
    "tình yêu", "người yêu", "bạn trai", "bạn gái", "tâm sự", "mối quan hệ",
    "bạn là ai", "tên bạn là gì", "ai tạo ra bạn", "openai", "chatgpt", "nguồn dữ liệu", "tự học"
];

function extractMonthFromMessage(message) {
    const lower = message.toLowerCase();
    const now = new Date();

    const monthMatch = lower.match(/tháng (\d{1,2})/);
    if (monthMatch) {
        const parsed = parseInt(monthMatch[1]);
        if (parsed >= 1 && parsed <= 12) return parsed;
    }

    // "tháng sau"
    if (lower.includes("tháng sau")) {
        return ((now.getMonth() + 1) % 12) + 1;
    }

    // "tháng này"
    if (lower.includes("tháng này")) {
        const day = now.getDate();
        const bufferDays = 2;

        if (day <= bufferDays) {
            const adjustedDate = new Date(now.getFullYear(), now.getMonth() - 1);
            return adjustedDate.getMonth() + 1;
        }

        return now.getMonth() + 1;
    }

    return null;
}


function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// [GET]/api/v1/chats - Lấy lịch sử chat
module.exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        let chat = await Chat.findOne({ userId });
        
        if (!chat) {
            return res.json({
                code: 200,
                history: []
            });
        }

        return res.json({
            code: 200,
            history: chat.history
        });
    } catch (error) {
        console.error("Error getting chat history:", error);
        return res.status(500).json({
            code: 400,
            message: "Không thể tải lịch sử chat!"
        });
    }
};

module.exports.getChatResponse = async (req, res) => {
    try {
        const { message } = req.body;
        const isLoggedIn = !!req.user;
        const userId = isLoggedIn ? req.user._id : null;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Danh sách chủ đề bị chặn
        const normalizedMsg = normalizeText(message);
        if (invalidTopics.some(topic => normalizedMsg.includes(normalizeText(topic)))) {
            return res.json({ reply: "Mình chỉ hỗ trợ về du lịch thôi nhé! 🚀" });
        }


        const suggestWebsiteKeywords = [
            "giới thiệu website du lịch",
            "trang web du lịch",
            "website du lịch nào",
            "web du lịch",
            "cho tôi một trang du lịch",
            "tư vấn website du lịch",
            "giới thiệu trang web về du lịch",
            "có trang web du lịch nào không",
            "Giới thiệu cho tôi về 1 web du lịch"
        ];

        const isSuggestingWebsite = suggestWebsiteKeywords.some(keyword =>
            normalizedMsg.includes(normalizeText(keyword))
        );

        if (isSuggestingWebsite) {
            return res.json({
                reply: "Bạn có thể truy cập website chính thức của chúng tôi  để khám phá các tour du lịch hấp dẫn nhé! 🌍✨"
            });
        }

        // Check cache trước
        const allCached = await CachedResponse.find({
            createdAt: { $gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }
        });

        const match = allCached.find(item =>
            stringSimilarity.compareTwoStrings(item.question, message) > 0.85
        );

        if (match) {
            return res.json({ reply: match.answer });
        }

        // Gợi ý tour (giới hạn 5 tour để system prompt không quá dài)
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        let suggestedTours = "";
        const tours = await Tour.find().select("title price").limit(5);
        if (tours.length > 0) {
            suggestedTours = tours.map(tour => `- ${tour.title} (${tour.price.toLocaleString()} VND)`).join("\n");
        }

        const extractedMonth = extractMonthFromMessage(message);
        const targetMonth = extractedMonth || (new Date().getMonth() + 1);

        const systemPrompt = {
            role: "system",
            content: `Bạn là trợ lý du lịch thông minh của website GoTravel.
Nhiệm vụ:
- Tư vấn về du lịch Việt Nam (địa điểm, lịch trình, mẹo du lịch)
- Dựa vào tháng ${targetMonth}/${year} để gợi ý thời điểm phù hợp
- Ưu tiên giới thiệu các tour có sẵn (nếu phù hợp với câu hỏi)
- Nếu không có tour phù hợp, hãy tư vấn chung về du lịch dựa trên kiến thức của bạn
- Trả lời ngắn gọn, thân thiện (2-4 câu)
- Luôn kết thúc bằng emoji phù hợp

${suggestedTours ? 'Tours hiện có:\n' + suggestedTours : 'Hiện chưa có tour nào trong hệ thống.'}`
        };

        let messages = [systemPrompt, { role: "user", content: message }];

        if (isLoggedIn) {
            let chat = await Chat.findOne({ userId });
            if (!chat) {
                chat = new Chat({ userId, history: [] });
            }

            chat.history.push({ role: "user", content: message });
            messages = [systemPrompt, ...chat.history];
        }

        let reply = "";
        let usedProvider = "unknown";
        
        // Thêm delay nhỏ giữa các request để tránh rate limit
        await delay(500);
        
        console.log("🚀 Calling OpenRouter API with", messages.length, "messages");
        
        // Gọi OpenRouter API
        let result = await callOpenRouterAPI(messages, 3);
        
        if (result.success) {
            usedProvider = result.provider || "unknown";
            console.log(`✅ AI Response received from ${usedProvider}`);
            reply = result.data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, tôi không thể trả lời câu hỏi này.";
        } else {
            console.error("=== All AI APIs Failed ===");
            console.error("Status:", result.status);
            console.error("Error:", result.error?.response?.data);
            
            if (result.status === 429) {
                reply = "Xin lỗi, hệ thống AI đang quá tải. Vui lòng chờ 1 phút rồi thử lại nhé! 🙏";
            } else if (result.status === 401 || result.status === 403) {
                reply = "Có vẻ API key đang gặp vấn đề. Hãy thử lại sau nhé! 🔒";
            } else if (result.status === 400) {
                reply = "Xin lỗi, câu hỏi không hợp lệ. Bạn có thể hỏi cách khác được không? 😊";
            } else if (result.status === 503) {
                reply = "Dịch vụ AI đang bảo trì. Vui lòng thử lại sau 2-3 phút! 🔄";
            } else if (result.error?.code === "ECONNABORTED" || result.error?.code === "ETIMEDOUT") {
                reply = "Kết nối bị timeout. Hãy thử câu hỏi ngắn gọn hơn nhé! ⏱️";
            } else {
                reply = "Mình đang gặp chút vấn đề kỹ thuật. Bạn có thể thử lại sau vài phút không? 😊";
            }
        }

        // Lưu cache
        if (reply && !reply.includes("quá tải") && !reply.includes("đang bận")) {
            try {
                await CachedResponse.create({
                    question: message,
                    answer: reply
                });
            } catch (cacheError) {
                console.error("Cache save error:", cacheError.message);
            }
        }

        if (isLoggedIn) {
            try {
                const chat = await Chat.findOne({ userId });
                if (chat) {
                    chat.history.push({ role: "assistant", content: reply });
                    await chat.save();
                }
            } catch (saveError) {
                console.error("Chat save error:", saveError.message);
            }
        }

        return res.json({ reply });

    } catch (error) {
        console.error("General Error:", error.message);
        return res.status(500).json({ error: "Có lỗi xảy ra khi xử lý yêu cầu!" });
    }
};

// [PATCH]/api/v1/chats/clear
module.exports.clearChat = async (req, res) => {
    try {
        const userId = req.user._id;
        await Chat.updateOne({
            userId: userId
        }, {
            $set: {
                history: []
            }
        });
        res.json({
            code: 200,
            message: "Xóa lịch sử trò chuyện thành công!"
        });
    } catch (error) {
        res.json({
            code: 500,
            message: error
        });
    }
}