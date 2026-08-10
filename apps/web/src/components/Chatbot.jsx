import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate

// ==== CẤU HÌNH ====
const BOT_ID = '7670933824876085253';
const COZE_TOKEN = 'pat_ymPCXHtjs57UiGQW3sVhI07jkLtUfoaCQUDXehBtVP6OgFhtAhOjXmhW9qgXKnGA';
const API_BASE = 'https://api.coze.com';
// ===================

function genUserId() {
  const saved = sessionStorage.getItem('coze_user_id');
  if (saved) return saved;
  const id = 'guest_' + Math.random().toString(36).slice(2, 10);
  sessionStorage.setItem('coze_user_id', id);
  return id;
}

async function callCoze(userMessage, conversationId, userId) {
  const createRes = await fetch(`${API_BASE}/v3/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${COZE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bot_id: BOT_ID,
      user_id: userId,
      stream: false,
      auto_save_history: true,
      conversation_id: conversationId || undefined,
      additional_messages: [
        { role: 'user', content: userMessage, content_type: 'text' },
      ],
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Tạo chat thất bại: HTTP ${createRes.status}`);
  }
  const createData = await createRes.json();
  const chat = createData.data;
  const newConversationId = chat.conversation_id;
  const chatId = chat.id;

  let status = chat.status;
  let tries = 0;
  while (status !== 'completed' && tries < 30) {
    await new Promise((r) => setTimeout(r, 1000));
    const pollRes = await fetch(
      `${API_BASE}/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${newConversationId}`,
      { headers: { Authorization: `Bearer ${COZE_TOKEN}` } }
    );
    const pollData = await pollRes.json();
    status = pollData.data.status;
    if (status === 'failed' || status === 'requires_action') {
      throw new Error('Bot xử lý thất bại: ' + status);
    }
    tries++;
  }

  const msgRes = await fetch(
    `${API_BASE}/v3/chat/message/list?chat_id=${chatId}&conversation_id=${newConversationId}`,
    { headers: { Authorization: `Bearer ${COZE_TOKEN}` } }
  );
  const msgData = await msgRes.json();
  const answer = (msgData.data || [])
    .filter((m) => m.type === 'answer')
    .map((m) => m.content)
    .join('\n');

  return { answer: answer || '(Bot không trả lời)', conversationId: newConversationId };
}

export default function Chatbot() {
  const navigate = useNavigate(); // 2. Kích hoạt hook chuyển trang
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Xin chào! Mình là trợ lý Núi Homestay, bạn cần hỏi gì về phòng nhỉ?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const conversationIdRef = useRef(null);
  const userIdRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    userIdRef.current = genUserId();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const { answer, conversationId } = await callCoze(
        text,
        conversationIdRef.current,
        userIdRef.current
      );
      conversationIdRef.current = conversationId;
      setMessages((prev) => [...prev, { role: 'bot', text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Xin lỗi, có lỗi xảy ra: ' + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
      {open && (
        <div
          style={{
            width: 340,
            height: 460,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <div style={{ background: '#0f766e', color: '#fff', padding: '14px 16px', fontWeight: 600 }}>
            Trợ lý Núi Homestay
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#f6f7f5' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.4,
                    background: m.role === 'user' ? '#0f766e' : '#fff',
                    color: m.role === 'user' ? '#fff' : '#1f2937',
                    border: m.role === 'user' ? 'none' : '1px solid #e5e7eb',
                  }}
                >
                  {m.role === 'user' ? (
                    m.text
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p style={{ margin: 0, marginBottom: 4 }} {...props} />,
                        ul: ({ node, ...props }) => <ul style={{ paddingLeft: 16, margin: '4px 0' }} {...props} />,
                        ol: ({ node, ...props }) => <ol style={{ paddingLeft: 16, margin: '4px 0' }} {...props} />,
                        
                        // 3. Custom thẻ <a> để chuyển trang trong React Router
                        a: ({ node, href, children, ...props }) => {
                          const handleClick = (e) => {
                            if (href && href.startsWith('/')) {
                              e.preventDefault();
                              navigate(href); // Điều hướng mượt sang RoomDetailPage
                            }
                          };
                          return (
                            <a
                              href={href}
                              onClick={handleClick}
                              style={{ color: '#0f766e', fontWeight: 600, textDecoration: 'underline' }}
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        },

                        // 4. Custom thẻ <img> hiển thị hình ảnh phòng đẹp mắt
                        img: ({ node, ...props }) => (
                          <img
                            {...props}
                            style={{
                              width: '100%',
                              height: 140,
                              objectFit: 'cover',
                              borderRadius: 8,
                              marginTop: 6,
                              marginBottom: 6,
                              display: 'block',
                              cursor: 'pointer',
                            }}
                            onError={(e) => {
                              // Tự động ẩn nếu link ảnh lỗi
                              e.target.style.display = 'none';
                            }}
                          />
                        ),
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ fontSize: 13, color: '#6b7280', paddingLeft: 4 }}>Đang trả lời…</div>
            )}
          </div>

          <div style={{ display: 'flex', borderTop: '1px solid #e5e7eb', padding: 8, gap: 8 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi về phòng, giá, tình trạng còn trống..."
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              onClick={send}
              disabled={loading}
              style={{
                background: '#0f766e',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0 16px',
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: 600,
              }}
            >
              Gửi
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#0f766e',
          color: '#fff',
          border: 'none',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        }}
        aria-label="Mở chat"
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  );
}