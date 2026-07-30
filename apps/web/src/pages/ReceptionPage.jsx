import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/lib/AuthContext";
import { api, fmt, fmtVND, fmtDate } from "@/lib/store";
import { LayoutGrid, List, LogOut, X, CheckCircle, LogOut as LogOutIcon, XCircle, UserPlus, PlusCircle } from "lucide-react";

// 🔴 BỎ "SẮP TRẢ", CHUẨN HÓA 3 TRẠNG THÁI MÀU SẮC
const STATUS_COLOR = { 
  coming: "bg-red-400 text-white", 
  staying: "bg-amber-300 text-black", 
  empty: "bg-emerald-400 text-white" 
};

const STATUS_LABEL = { 
  coming: "Sắp đến", 
  staying: "Đang ở", 
  empty: "Phòng trống" 
};

export default function ReceptionPage() {
  const { role } = useAuth();
  const [view, setView] = useState("grid");
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sel, setSel] = useState(null); // Chi tiết booking đang chọn

  // 🟢 State cho Modal Đặt phòng khách vãng lai
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [formData, setFormData] = useState({
    roomCode: "",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    status: "checkedin", // Mặc định khách đến quầy nhận phòng luôn
    payStatus: "unpaid",
    payMethod: "cash",
  });

  const load = () => { 
    api.rooms().then(setRooms); 
    api.bookings().then(setBookings); 
  };

  useEffect(() => { load(); }, []);

  if (role !== "receptionist" && role !== "admin") return <Navigate to="/auth" replace />;

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // 🟢 Hàm xác định trạng thái phòng DỰA TRÊN POCKETBASE STATUS
  const roomState = (code) => {
    const activeBookings = bookings.filter(
      (b) => b.roomCode === code && b.status !== "cancelled" && b.status !== "checkedout"
    );

    const stayingBooking = activeBookings.find((b) => b.status === "checkedin");
    if (stayingBooking) return { s: "staying", b: stayingBooking };

    const comingBooking = activeBookings.find((b) => b.status === "pending" || b.status === "confirmed");
    if (comingBooking) return { s: "coming", b: comingBooking };

    return { s: "empty", b: null };
  };

  const roomBookings = (code) => bookings.filter((b) => b.roomCode === code && b.status !== "cancelled" && b.status !== "checkedout");
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * 86400000));

  // ⚡ CẬP NHẬT TRẠNG THÁI BOOKING CÓ SẴN
  const updateStatus = async (b, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === "checkedout") {
        updateData.payStatus = "paid";
      }
      await pb.collection("bookings").update(b.id, updateData);
      load();
      setSel(null);
    } catch (err) {
      alert("Cập nhật thất bại: " + err.message);
    }
  };

  // ⚡ MỞ MODAL ĐẶT PHÒNG TỪ 1 PHÒNG TRỐNG CỤ THỂ
  const handleOpenWalkIn = (roomCode = "") => {
    const defaultRoom = roomCode || (rooms.length > 0 ? rooms[0].code : "");
    setFormData({
      roomCode: defaultRoom,
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      checkIn: new Date().toISOString().split("T")[0],
      checkOut: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      status: "checkedin",
      payStatus: "unpaid",
      payMethod: "cash",
    });
    setShowWalkInModal(true);
  };

  // ⚡ TẠO ĐƠN ĐẶT PHÒNG MỚI CHO KHÁCH VÃNG LAI
  const handleCreateWalkInBooking = async (e) => {
    e.preventDefault();
    try {
      const room = rooms.find((r) => r.code === formData.roomCode);
      if (!room) return alert("Vui lòng chọn phòng!");

      // Tính số đêm và tổng tiền phòng
      const d1 = new Date(formData.checkIn);
      const d2 = new Date(formData.checkOut);
      const nights = Math.max(1, Math.round((d2 - d1) / 86400000));
      const roomPrice = Number(room.price || 0);
      const total = nights * roomPrice;

      // Sinh mã booking tự động
      const code = "BK" + Math.floor(1000 + Math.random() * 9000);

      const recordData = {
        code,
        roomCode: formData.roomCode,
        roomTypeName: room.typeName || "Phòng Homestay",
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        guestEmail: formData.guestEmail || `${formData.guestPhone}@homestay.local`,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        nights,
        roomPrice,
        servicesTotal: 0,
        servicesDetail: [],
        total,
        payMethod: formData.payMethod,
        payStatus: formData.payStatus,
        status: formData.status, // 'checkedin' (Nhận phòng ngay) hoặc 'pending' (Đặt trước)
      };

      await pb.collection("bookings").create(recordData);
      alert("Tạo đơn đặt phòng thành công!");
      setShowWalkInModal(false);
      load();
    } catch (err) {
      alert("Lỗi đặt phòng: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-primary text-white px-5 h-14 flex items-center justify-between shadow-md">
        <span className="font-display font-extrabold text-lg">Núi Homestay · Lễ tân</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenWalkIn()}
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-xs px-3 py-1.5 rounded-lg shadow transition"
          >
            <UserPlus className="w-4 h-4" />
            + Đặt phòng trực tiếp
          </button>
          <div className="h-6 w-[1px] bg-white/20 mx-1"></div>
          <button onClick={() => setView("grid")} className={`p-2 rounded-lg transition ${view === "grid" ? "bg-white/25" : "hover:bg-white/10"}`}>
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button onClick={() => setView("timeline")} className={`p-2 rounded-lg transition ${view === "timeline" ? "bg-white/25" : "hover:bg-white/10"}`}>
            <List className="w-5 h-5" />
          </button>
          <Link to="/" className="text-white/80 hover:text-white p-2">
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="max-w-[80rem] mx-auto px-5 py-6">
        {/* BẢNG CHÚ THÍCH TRẠNG THÁI & NÚT BẤM NHANH */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex flex-wrap gap-6">
            {Object.entries(STATUS_LABEL).map(([k, l]) => (
              <span key={k} className="flex items-center gap-2 text-sm font-medium">
                <span className={`w-4 h-4 rounded-full ${STATUS_COLOR[k].split(" ")[0]}`} />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* 1️⃣ GIAO DIỆN SƠ ĐỒ Ô PHÒNG (GRID) */}
        {view === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rooms.map((r) => {
              const st = roomState(r.code);
              return (
                <div
                  key={r.id}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between"
                >
                  <div>
                    <div className={`${STATUS_COLOR[st.s]} px-3 py-2 font-bold flex justify-between items-center`}>
                      <span>{r.code}</span>
                      <span className="text-xs font-normal uppercase opacity-90">{STATUS_LABEL[st.s]}</span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-muted-foreground">{r.typeName}</p>
                      <p className="font-semibold mt-1 text-emerald-600">{fmt(r.price)}/ngày</p>
                      {st.b ? (
                        <p className="text-xs mt-2 font-bold text-primary truncate">👤 {st.b.guestName}</p>
                      ) : (
                        <p className="text-xs mt-2 text-muted-foreground">🟢 Sẵn sàng đón khách</p>
                      )}
                    </div>
                  </div>

                  {/* NÚT THAO TÁC TRÊN TỪNG Ô */}
                  <div className="p-3 pt-0">
                    {st.b ? (
                      <button
                        onClick={() => setSel(st.b)}
                        className="w-full py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground border border-border transition"
                      >
                        Xem chi tiết
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenWalkIn(r.code)}
                        className="w-full py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center justify-center gap-1 border border-emerald-200"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Tạo đặt phòng
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 2️⃣ GIAO DIỆN TIMELINE CALENDAR */
          <div className="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
            <div className="min-w-[760px]">
              <div className="grid" style={{ gridTemplateColumns: `100px repeat(7,1fr)` }}>
                <div className="p-3 font-semibold bg-secondary border-b border-border">Phòng</div>
                {days.map((d) => (
                  <div key={d} className="p-3 text-center text-sm font-medium bg-secondary border-l border-b border-border">
                    {d.getDate()}/{d.getMonth() + 1}
                  </div>
                ))}
                {rooms.map((r) => (
                  <React.Fragment key={r.id}>
                    <div className="p-3 font-semibold border-t border-border flex items-center justify-between">
                      <span>{r.code}</span>
                    </div>
                    <div className="col-span-7 border-t border-l border-border relative h-12 bg-background/50">
                      {roomBookings(r.code).map((b) => {
                        const s = Math.max(0, Math.round((new Date(b.checkIn) - days[0]) / 86400000));
                        const e = Math.min(7, Math.round((new Date(b.checkOut) - days[0]) / 86400000));
                        if (e <= 0 || s >= 7) return null;

                        const isStaying = b.status === "checkedin";
                        const bgBtn = isStaying ? "bg-amber-400 text-black" : "bg-rose-500 text-white";

                        return (
                          <button
                            key={b.id}
                            onClick={() => setSel(b)}
                            className={`absolute top-1 bottom-1 text-xs rounded-md px-2 font-medium truncate shadow-sm transition hover:opacity-90 flex items-center justify-between ${bgBtn}`}
                            style={{ left: `${(s / 7) * 100}%`, width: `${((e - s) / 7) * 100}%` }}
                          >
                            <span className="truncate">{b.code} · {b.guestName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🟢 POPUP MODAL 1: CHI TIẾT THAO TÁC ĐƠN ĐẶT PHÒNG CÓ SẴN */}
      {sel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSel(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-display text-xl font-bold">Chi tiết đặt phòng</h3>
              <button onClick={() => setSel(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p>Mã booking: <b className="text-primary font-mono">{sel.code}</b></p>
              <p>Khách hàng: <b>{sel.guestName}</b> · {sel.guestPhone || "Chưa có SĐT"}</p>
              <p>Phòng: <b>{sel.roomCode}</b> ({sel.roomTypeName})</p>
              <p>Nhận → Trả: <b>{fmtDate(sel.checkIn)} → {fmtDate(sel.checkOut)}</b></p>
              <p>Tổng tiền: <b className="text-emerald-600 text-base">{fmtVND(sel.total)}</b></p>
              <p>
                Thanh toán:{" "}
                <span className="font-semibold">
                  {sel.payStatus === "paid" ? "✅ Đã thanh toán" : sel.payStatus === "deposit" ? "🔸 Đã cọc" : "❌ Chưa thanh toán"}
                </span>
              </p>
            </div>

            {/* NÚT THAO TÁC POPUP CHI TIẾT */}
            <div className="pt-3 border-t flex gap-3">
              {sel.status !== "checkedin" && (
                <>
                  <button
                    onClick={() => updateStatus(sel, "checkedin")}
                    className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-sm flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Nhận phòng
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Xác nhận hủy đơn đặt phòng này?")) updateStatus(sel, "cancelled");
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold text-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Hủy đặt
                  </button>
                </>
              )}

              {sel.status === "checkedin" && (
                <button
                  onClick={() => {
                    if (window.confirm("Xác nhận trả phòng và thu đủ tiền thanh toán?")) updateStatus(sel, "checkedout");
                  }}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow transition"
                >
                  <LogOutIcon className="w-4 h-4" />
                  Trả phòng & Thanh toán
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🟢 POPUP MODAL 2: TẠO ĐẶT PHÒNG CHO KHÁCH VÃNG LAI */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowWalkInModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Đặt phòng cho khách trực tiếp
              </h3>
              <button onClick={() => setShowWalkInModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWalkInBooking} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Chọn phòng *</label>
                  <select
                    value={formData.roomCode}
                    onChange={(e) => setFormData({ ...formData, roomCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background font-bold text-primary"
                    required
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.code}>
                        Phòng {r.code} ({r.typeName}) - {fmt(r.price)}đ
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Quy trình *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background font-semibold"
                  >
                    <option value="checkedin">🟡 Nhận phòng ngay (Đang ở)</option>
                    <option value="pending">🔴 Đặt trước (Chờ nhận phòng)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Họ tên khách hàng *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-background"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    placeholder="0901234567"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Email (nếu có)</label>
                  <input
                    type="email"
                    placeholder="khach@gmail.com"
                    value={formData.guestEmail}
                    onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Ngày nhận phòng</label>
                  <input
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Ngày trả phòng</label>
                  <input
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Hình thức thanh toán</label>
                  <select
                    value={formData.payMethod}
                    onChange={(e) => setFormData({ ...formData, payMethod: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background"
                  >
                    <option value="cash">Tiền mặt</option>
                    <option value="transfer">Chuyển khoản</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Trạng thái thanh toán</label>
                  <select
                    value={formData.payStatus}
                    onChange={(e) => setFormData({ ...formData, payStatus: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background"
                  >
                    <option value="unpaid">Chưa thanh toán</option>
                    <option value="paid">Đã thanh toán đủ</option>
                    <option value="deposit">Đã cọc</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow"
                >
                  Xác nhận đặt phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}