import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";

const KB = [
  { k: ["giá", "bao nhiêu", "tiền"], a: "Phòng đơn 300.000đ/đêm, phòng đôi 500.000đ/đêm, phòng gia đình 800.000đ/đêm. Bạn có thể xem chi tiết tại mục Phòng." },
  { k: ["đặt", "booking", "book"], a: "Bạn vào mục Phòng, chọn phòng phù hợp rồi bấm Đặt phòng ngay. Hệ thống sẽ tự kiểm tra phòng còn trống theo ngày bạn chọn." },
  { k: ["dịch vụ", "ăn sáng", "đưa đón"], a: "Chúng tôi có dịch vụ đưa đón tận nơi (150.000đ/người), bữa ăn sáng (30.000đ/phần) và nước uống (15.000đ/phần)." },
  { k: ["thanh toán", "chuyển khoản", "trả tiền"], a: "Bạn có thể thanh toán khi nhận phòng hoặc chuyển khoản giữ phòng. Thông tin tài khoản sẽ hiển thị khi bạn chọn chuyển khoản." },
  { k: ["liên hệ", "hotline", "số điện thoại", "admin"], a: "Hotline: 035 356 600 - Email: Nuihomstay@gmail.com. Bạn cần gặp quản lý? Gọi hotline nhé!" },
  { k: ["địa chỉ", "ở đâu", "vị trí"], a: "Núi Homestay cách trung tâm TP. Huế 3,6km, không gian yên tĩnh và xanh mát." },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ from: "bot", t: "Xin chào! Mình là trợ lý Núi Homestay. Bạn cần hỗ trợ tìm phòng hay thông tin gì ạ?" }]);
  const [inp, setInp] = useState("");
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  const send = () => {
    const q = inp.trim();
    if (!q) return;
    const found = KB.find((e) => e.k.some((w) => q.toLowerCase().includes(w)));
    const a = found ? found.a : "Cảm ơn bạn! Bạn có thể xem các phòng ở mục Phòng, hoặc gọi hotline 035 356 600 để được hỗ trợ trực tiếp nhé.";
    setMsgs((m) => [...m, { from: "me", t: q }, { from: "bot", t: a }]);
    setInp("");
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:scale-105 transition">
        {open ? <X /> : <MessageCircle />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] max-w-sm h-[480px] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-fadeup">
          <div className="bg-primary text-white px-4 py-3 flex items-center gap-2 font-semibold"><Bot className="w-5 h-5" /> Trợ lý Núi Homestay</div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.from === "me" ? "bg-primary text-white rounded-br-sm" : "bg-secondary rounded-bl-sm"}`}>{m.t}</div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Nhập câu hỏi..." className="flex-1 px-3 py-2 rounded-full bg-secondary text-sm outline-none" />
            <button onClick={send} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}
