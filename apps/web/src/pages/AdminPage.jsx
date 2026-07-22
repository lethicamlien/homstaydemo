import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/lib/AuthContext";
import { api, fmt, fmtVND, fmtDate } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { LayoutDashboard, BedDouble, Coffee, Users, CalendarRange, TrendingUp, LogOut, Trash2, Plus, Palmtree } from "lucide-react";

const TABS = [
  { k: "overview", l: "Tổng quan", i: LayoutDashboard },
  { k: "rooms", l: "Phòng", i: BedDouble },
  { k: "services", l: "Dịch vụ", i: Coffee },
  { k: "customers", l: "Khách hàng", i: Users },
  { k: "bookings", l: "Đặt phòng", i: CalendarRange },
  { k: "stats", l: "Thống kê", i: TrendingUp },
];
const ST = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", checkedin: "Đang ở", checkedout: "Đã trả phòng", cancelled: "Đã hủy" };

export default function AdminPage() {
  const { role, logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [rooms, setRooms] = useState([]); const [types, setTypes] = useState([]);
  const [services, setServices] = useState([]); const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]); const [reviews, setReviews] = useState([]);
  const load = () => {
    api.rooms().then(setRooms); api.roomTypes().then(setTypes); api.services().then(setServices);
    api.bookings().then(setBookings); api.customers().then(setCustomers).catch(() => {}); api.reviews().then(setReviews);
  };
  useEffect(() => { load(); }, []);
  if (role !== "admin") return <Navigate to="/auth" replace />;

  const occupied = bookings.filter((b) => b.status === "checkedin").length;
  const revenue = bookings.filter((b) => b.payStatus === "paid" || b.status === "checkedout").reduce((a, b) => a + b.total, 0);
  const chart = Array.from({ length: 12 }, (_, i) => ({ m: String(i + 1).padStart(2, "0"), v: 0 }));
  bookings.forEach((b) => { const mo = new Date(b.created).getMonth(); if (b.payStatus !== "unpaid") chart[mo].v += b.total; });

  const del = async (col, id) => { await pb.collection(col).delete(id); load(); };
  const addRoom = async () => {
    const code = prompt("Tên phòng (mã):"); if (!code) return;
    const typeName = prompt("Loại phòng:", "Phòng đơn") || "Phòng đơn";
    const price = Number(prompt("Giá:", "300000")) || 300000;
    await pb.collection("rooms").create({ code, typeName, price, area: prompt("Khu vực/Tầng:") || "", beds: "1 phòng ngủ", status: "active", images: ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1000"], description: "Phòng tiện nghi tại Núi Homestay.", amenities: ["Wifi", "Điều hòa"], rules: ["Cấm hút thuốc"] });
    load();
  };
  const addService = async () => {
    const name = prompt("Tên dịch vụ:"); if (!name) return;
    await pb.collection("services").create({ name, price: Number(prompt("Giá:", "30000")) || 0, unit: prompt("Đơn vị:", "Phần") || "Phần", perDay: confirm("Tính theo số ngày? OK=Có"), image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400" });
    load();
  };
  const setStatus = async (id, status) => { await pb.collection("bookings").update(id, { status, payStatus: status === "checkedout" ? "paid" : undefined }); load(); };
  const reply = async (rv) => { const r = prompt("Trả lời đánh giá:", rv.reply || ""); if (r != null) { await pb.collection("reviews").update(rv.id, { reply: r }); load(); } };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <span className="font-display font-extrabold flex items-center gap-1"><Palmtree className="w-5 h-5" /></span>
          {TABS.map((t) => <button key={t.k} onClick={() => setTab(t.k)} className={`flex items-center gap-1 text-sm whitespace-nowrap px-3 py-1.5 rounded-full ${tab === t.k ? "bg-white/25" : "hover:bg-white/10"}`}><t.i className="w-4 h-4" />{t.l}</button>)}
        </div>
        <div className="flex items-center gap-3"><span className="text-sm">Quản Lý</span><Link to="/" className="text-white/80"><LogOut className="w-4 h-4" /></Link></div>
      </header>

      <div className="max-w-[80rem] mx-auto px-5 py-8">
        {tab === "overview" && <>
          <h2 className="font-display text-2xl font-bold mb-4">Công suất phòng hiện tại</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Stat l="Phòng đang có khách" v={occupied} /><Stat l="Phòng đang trống" v={rooms.length - occupied} /><Stat l="Tổng số phòng" v={rooms.length} />
          </div>
          <h2 className="font-display text-2xl font-bold mt-8 mb-4">Hoạt động gần đây</h2>
          <BookingTable bookings={bookings.slice(0, 8)} setStatus={setStatus} del={del} />
        </>}

        {tab === "rooms" && <>
          <div className="flex justify-between items-center"><h2 className="font-display text-2xl font-bold">Loại phòng & phòng</h2><button onClick={addRoom} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" />Thêm phòng</button></div>
          <div className="mt-4 bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm"><thead className="bg-secondary"><tr>{["Tên phòng","Loại","Giá","Khu vực","Trạng thái",""].map((h) => <th key={h} className="text-left p-3">{h}</th>)}</tr></thead>
              <tbody>{rooms.map((r) => <tr key={r.id} className="border-t border-border"><td className="p-3 font-semibold">{r.code}</td><td className="p-3">{r.typeName}</td><td className="p-3">{fmt(r.price)}</td><td className="p-3">{r.area}</td><td className="p-3">{r.status === "active" ? "Đang hoạt động" : "Ngừng"}</td><td className="p-3"><button onClick={() => del("rooms", r.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
            </table>
          </div>
        </>}

        {tab === "services" && <>
          <div className="flex justify-between items-center"><h2 className="font-display text-2xl font-bold">Dịch vụ</h2><button onClick={addService} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" />Thêm</button></div>
          <div className="mt-4 grid md:grid-cols-3 gap-4">{services.map((s) => <div key={s.id} className="bg-card border border-border rounded-xl p-4"><div className="h-28 rounded-lg bg-cover bg-center mb-2" style={{ backgroundImage: `url(${s.image})` }} /><p className="font-semibold">{s.name}</p><p className="text-sm text-accent">{fmtVND(s.price)}/{s.unit}</p><button onClick={() => del("services", s.id)} className="text-destructive text-sm mt-2 flex items-center gap-1"><Trash2 className="w-4 h-4" />Xóa</button></div>)}</div>
        </>}

        {tab === "customers" && <>
          <h2 className="font-display text-2xl font-bold">Khách hàng</h2>
          <div className="mt-4 bg-card border border-border rounded-xl overflow-hidden"><table className="w-full text-sm"><thead className="bg-secondary"><tr>{["Họ tên","Email","SĐT",""].map((h) => <th key={h} className="text-left p-3">{h}</th>)}</tr></thead><tbody>{customers.map((c) => <tr key={c.id} className="border-t border-border"><td className="p-3">{c.fullName || "-"}</td><td className="p-3">{c.email}</td><td className="p-3">{c.phone || "-"}</td><td className="p-3"><button onClick={() => del("users", c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody></table></div>
        </>}

        {tab === "bookings" && <>
          <h2 className="font-display text-2xl font-bold mb-4">Quản lý đặt phòng</h2>
          <BookingTable bookings={bookings} setStatus={setStatus} del={del} />
          <h2 className="font-display text-2xl font-bold mt-8 mb-4">Đánh giá</h2>
          <div className="space-y-3">{reviews.map((rv) => <div key={rv.id} className="bg-card border border-border rounded-xl p-4"><p className="font-semibold">{rv.author} · {rv.roomCode} · {"★".repeat(rv.rating)}</p><p className="text-sm">{rv.comment}</p>{rv.reply && <p className="text-sm text-muted-foreground mt-1">Trả lời: {rv.reply}</p>}<button onClick={() => reply(rv)} className="text-primary text-sm mt-2">Trả lời</button></div>)}</div>
        </>}

        {tab === "stats" && <>
          <h2 className="font-display text-2xl font-bold">Doanh thu theo tháng · Tổng: <span className="text-accent">{fmtVND(revenue)}</span></h2>
          <div className="mt-4 bg-card border border-border rounded-xl p-4 h-80">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><XAxis dataKey="m" /><YAxis tickFormatter={(v) => (v / 1e6).toFixed(0) + "tr"} /><Tooltip formatter={(v) => fmtVND(v)} /><Bar dataKey="v" fill="hsl(195,85%,41%)" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>
          </div>
          <p className="mt-4 text-muted-foreground">Tổng số phòng được đặt: <b>{bookings.length}</b></p>
        </>}
      </div>
    </div>
  );
}
const Stat = ({ l, v }) => <div className="bg-card border border-border rounded-xl p-6 text-center"><p className="text-muted-foreground">{l}</p><p className="font-display text-4xl font-extrabold text-primary mt-1">{v}</p></div>;
function BookingTable({ bookings, setStatus, del }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto"><table className="w-full text-sm min-w-[720px]">
      <thead className="bg-secondary"><tr>{["Mã","Khách","Phòng","Nhận → Trả","Tổng","Trạng thái",""].map((h) => <th key={h} className="text-left p-3">{h}</th>)}</tr></thead>
      <tbody>{bookings.map((b) => <tr key={b.id} className="border-t border-border">
        <td className="p-3 font-semibold text-primary">{b.code}</td>
        <td className="p-3">{b.guestName}<br /><span className="text-xs text-muted-foreground">{b.guestPhone}</span></td>
        <td className="p-3">{b.roomTypeName}</td><td className="p-3">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</td>
        <td className="p-3">{fmtVND(b.total)}</td>
        <td className="p-3"><select value={b.status} onChange={(e) => setStatus(b.id, e.target.value)} className="bg-secondary rounded-lg px-2 py-1">{Object.entries(ST).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
        <td className="p-3"><button onClick={() => del("bookings", b.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></button></td>
      </tr>)}</tbody>
    </table></div>
  );
}
