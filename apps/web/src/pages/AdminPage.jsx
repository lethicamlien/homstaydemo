import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/lib/AuthContext";
import { api, fmt, fmtVND, fmtDate } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { 
  LayoutDashboard, BedDouble, Coffee, Users, 
  CalendarRange, TrendingUp, LogOut, Trash2, Edit, Plus, Palmtree, X, Power, Star
} from "lucide-react";

const TABS = [
  { k: "overview", l: "Tổng quan", i: LayoutDashboard },
  { k: "rooms", l: "Phòng", i: BedDouble },
  { k: "services", l: "Dịch vụ", i: Coffee },
  { k: "customers", l: "Khách hàng", i: Users },
  { k: "bookings", l: "Đặt phòng", i: CalendarRange },
  { k: "stats", l: "Thống kê", i: TrendingUp },
];

const ST = { 
  pending: "Chờ xác nhận", 
  confirmed: "Đã xác nhận", 
  checkedin: "Đang ở", 
  checkedout: "Đã trả phòng", 
  cancelled: "Đã hủy" 
};

export default function AdminPage() {
  const { role } = useAuth();

  // --- STATE TAB & NAVIGATION ---
  const [tab, setTab] = useState("overview");
  const [subTab, setSubTab] = useState("roomList");
  
  // --- STATE DATA ---
  const [rooms, setRooms] = useState([]);
  const [types, setTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reviews, setReviews] = useState([]);

  // --- STATE MODAL & FORM ---
  const [showModal, setShowModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  
  // Form Loại phòng
  const [typeForm, setTypeForm] = useState({ code: "", name: "", price: "", count: "" });

  // Form Phòng
  const [roomForm, setRoomForm] = useState({
    code: "",
    typeName: "Phòng đơn",
    price: "",
    area: "Tầng 1",
    rules: "Cấm hút thuốc",
    amenities: "Wifi, Điều hòa",
    description: "Phòng tiện nghi tại Núi Homestay.",
    images: []
  });

  // Form Dịch vụ
  const [serviceForm, setServiceForm] = useState({ name: "", price: "", unit: "lượt", icon: "Coffee" });

  const load = () => {
    api.rooms().then(setRooms);
    api.roomTypes().then(setTypes);
    api.services().then(setServices);
    api.bookings().then(setBookings);
    api.customers().then(setCustomers).catch(() => {});
    api.reviews().then(setReviews);
  };

  useEffect(() => { load(); }, []);

  if (role !== "admin") return <Navigate to="/auth" replace />;

  const occupied = bookings.filter((b) => b.status === "checkedin").length;
  const revenue = bookings
    .filter((b) => b.payStatus === "paid" || b.status === "checkedout")
    .reduce((a, b) => a + b.total, 0);

  const chart = Array.from({ length: 12 }, (_, i) => ({ m: `Thg ${i + 1}`, v: 0 }));
  bookings.forEach((b) => {
    if (b.created) {
      const mo = new Date(b.created).getMonth();
      if (b.payStatus !== "unpaid") chart[mo].v += b.total;
    }
  });

  const del = async (col, id) => { 
    if (confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) {
      await pb.collection(col).delete(id); 
      load(); 
    }
  };

  // --- LOGIC XỬ LÝ PHÒNG ---
  const handleTypeChange = (selectedTypeName) => {
    const matchedType = types.find((t) => t.name === selectedTypeName);
    setRoomForm((prev) => ({
      ...prev,
      typeName: selectedTypeName,
      price: matchedType ? matchedType.price : prev.price
    }));
  };

  const toggleRoomStatus = async (room) => {
    const newStatus = room.status === "active" ? "inactive" : "active";
    try {
      await pb.collection("rooms").update(room.id, { status: newStatus });
      load();
    } catch (error) {
      alert("Lỗi khi đổi trạng thái phòng!");
    }
  };

  const handleOpenEditModal = (room) => {
    setEditingRoomId(room.id);
    setRoomForm({
      code: room.code || "",
      typeName: room.typeName || "Phòng đơn",
      price: room.price || "",
      area: room.area || "Tầng 1",
      rules: Array.isArray(room.rules) ? room.rules.join(", ") : room.rules || "",
      amenities: Array.isArray(room.amenities) ? room.amenities.join(", ") : room.amenities || "",
      description: room.description || "",
      images: room.images || []
    });
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingRoomId(null);
    setRoomForm({
      code: "", typeName: types[0]?.name || "Phòng đơn", price: types[0]?.price || "",
      area: "Tầng 1", rules: "Cấm hút thuốc", amenities: "Wifi, Điều hòa",
      description: "Phòng tiện nghi tại Núi Homestay.", images: []
    });
    setShowModal(true);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRoomForm((prev) => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setRoomForm({ ...roomForm, images: roomForm.images.filter((_, i) => i !== index) });
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      const amenitiesArr = roomForm.amenities.split(",").map(item => item.trim()).filter(Boolean);
      const rulesArr = roomForm.rules.split(",").map(item => item.trim()).filter(Boolean);

      const payload = {
        code: roomForm.code,
        typeName: roomForm.typeName,
        price: Number(roomForm.price),
        area: roomForm.area,
        description: roomForm.description,
        amenities: amenitiesArr,
        rules: rulesArr,
        images: roomForm.images
      };

      if (editingRoomId) {
        await pb.collection("rooms").update(editingRoomId, payload);
      } else {
        await pb.collection("rooms").create({ ...payload, status: "active", beds: "1 phòng ngủ" });
      }

      setShowModal(false);
      load();
    } catch (error) {
      alert("Có lỗi xảy ra khi lưu phòng!");
    }
  };

  const handleSaveRoomType = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("room_types").create({
        code: typeForm.code, name: typeForm.name, price: Number(typeForm.price), count: Number(typeForm.count), status: "active"
      });
      setShowModal(false);
      setTypeForm({ code: "", name: "", price: "", count: "" });
      load();
    } catch (error) {
      alert("Lỗi khi thêm loại phòng!");
    }
  };

  // --- LOGIC XỬ LÝ DỊCH VỤ ---
  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("services").create({
        name: serviceForm.name,
        price: Number(serviceForm.price),
        unit: serviceForm.unit,
        icon: serviceForm.icon
      });
      setServiceForm({ name: "", price: "", unit: "lượt", icon: "Coffee" });
      load();
    } catch (error) {
      alert("Có lỗi khi thêm dịch vụ!");
    }
  };

  const setStatus = async (id, status) => { 
    await pb.collection("bookings").update(id, { status, payStatus: status === "checkedout" ? "paid" : undefined }); 
    load(); 
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER NAV */}
      <header className="bg-primary text-white px-5 h-14 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <span className="font-display font-extrabold flex items-center gap-1"><Palmtree className="w-5 h-5" /> Núi Homestay</span>
          {TABS.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`flex items-center gap-1 text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-all ${tab === t.k ? "bg-white/25 font-bold" : "hover:bg-white/10"}`}>
              <t.i className="w-4 h-4" />{t.l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Quản Lý</span>
          <Link to="/" className="text-white/80 hover:text-white"><LogOut className="w-4 h-4" /></Link>
        </div>
      </header>

      <div className="max-w-[80rem] mx-auto px-5 py-8">
        
        {/* TAB TỔNG QUAN */}
        {tab === "overview" && (
          <>
            <h2 className="font-display text-2xl font-bold mb-4">Công suất phòng hiện tại</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Stat l="Phòng đang có khách" v={occupied} />
              <Stat l="Phòng đang trống" v={rooms.length - occupied} />
              <Stat l="Tổng số phòng" v={rooms.length} />
            </div>
            <h2 className="font-display text-2xl font-bold mb-4">Hoạt động gần đây</h2>
            <BookingTable bookings={bookings.slice(0, 8)} setStatus={setStatus} del={del} />
          </>
        )}

        {/* TAB PHÒNG & LOẠI PHÒNG */}
        {tab === "rooms" && (
          <>
            <h2 className="font-display text-2xl font-bold mb-4">Loại phòng và phòng</h2>

            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-1 bg-secondary/80 p-1 rounded-lg">
                <button
                  onClick={() => setSubTab("roomTypes")}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                    subTab === "roomTypes" ? "bg-sky-200 text-slate-900 shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Loại phòng
                </button>
                <button
                  onClick={() => setSubTab("roomList")}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                    subTab === "roomList" ? "bg-sky-300 text-slate-900 shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Danh sách phòng
                </button>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="bg-emerald-400 hover:bg-emerald-500 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1 shadow-sm transition-all"
              >
                + Thêm mới
              </button>
            </div>

            {/* BẢNG LOẠI PHÒNG */}
            {subTab === "roomTypes" && (
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-sky-200/80 text-sky-950 font-bold">
                    <tr>
                      {["Mã loại phòng", "Tên loại phòng", "Giá phòng", "Số lượng", "Trạng thái", ""].map((h) => (
                        <th key={h} className="text-left p-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {types.map((t) => (
                      <tr key={t.id} className="border-t border-border hover:bg-secondary/30">
                        <td className="p-3 font-semibold">{t.code || "L001"}</td>
                        <td className="p-3">{t.name}</td>
                        <td className="p-3">{fmt(t.price)}</td>
                        <td className="p-3 font-bold">{t.count || 1}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Đang hoạt động
                          </span>
                        </td>
                        <td className="p-3">
                          <button onClick={() => del("room_types", t.id)} className="text-rose-500 hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* BẢNG DANH SÁCH PHÒNG */}
            {subTab === "roomList" && (
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-sky-200/80 text-sky-950 font-bold">
                    <tr>
                      {["Tên phòng", "Tên loại phòng", "Giá phòng", "Khu vực", "Trạng thái", "Hình ảnh", "Thao tác"].map((h) => (
                        <th key={h} className="text-left p-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                        <td className="p-3 font-semibold">{r.code}</td>
                        <td className="p-3">{r.typeName}</td>
                        <td className="p-3">{fmt(r.price)}</td>
                        <td className="p-3">{r.area}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            r.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {r.status === "active" ? "Đang hoạt động" : "Ngừng kinh doanh"}
                          </span>
                        </td>
                        <td className="p-3">
                          {r.images && r.images.length > 0 ? (
                            <img src={r.images[0]} alt="Room" className="w-12 h-9 object-cover rounded-md border" />
                          ) : (
                            <div className="w-12 h-9 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400">Ảnh</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => del("rooms", r.id)} className="text-rose-500 hover:opacity-80" title="Xóa">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleOpenEditModal(r)} className="text-emerald-500 hover:opacity-80" title="Chỉnh sửa">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => toggleRoomStatus(r)} 
                              className={`hover:opacity-80 transition-colors ${r.status === "active" ? "text-emerald-500" : "text-rose-500"}`}
                              title={r.status === "active" ? "Ngừng kinh doanh" : "Kích hoạt"}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL THÊM / SỬA PHÒNG & LOẠI PHÒNG */}
            {showModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-border text-slate-900 relative my-8">
                  {subTab === "roomTypes" ? (
                    <div>
                      <h3 className="text-xl font-bold mb-6">Thêm mới loại phòng</h3>
                      <form onSubmit={handleSaveRoomType} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Mã loại phòng</label>
                            <input required placeholder="L001" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Tên loại phòng</label>
                            <input required placeholder="Phòng đơn" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Giá</label>
                            <input required type="number" placeholder="300000" value={typeForm.price} onChange={(e) => setTypeForm({ ...typeForm, price: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Số lượng</label>
                            <input required type="number" placeholder="2" value={typeForm.count} onChange={(e) => setTypeForm({ ...typeForm, count: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                          <button type="button" onClick={() => setShowModal(false)} className="px-6 py-1.5 rounded bg-gray-200 text-gray-800 font-semibold text-sm">Bỏ</button>
                          <button type="submit" className="px-6 py-1.5 rounded bg-sky-300 text-gray-900 font-semibold text-sm hover:bg-sky-400">Lưu</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-bold mb-6">
                        {editingRoomId ? "Chỉnh sửa thông tin phòng" : "Thêm mới phòng"}
                      </h3>
                      
                      <form onSubmit={handleSaveRoom} className="space-y-6">
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Tên phòng</label>
                            <input
                              required placeholder="P001" value={roomForm.code}
                              onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value })}
                              className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Tên loại phòng ˅</label>
                            <select
                              value={roomForm.typeName} onChange={(e) => handleTypeChange(e.target.value)}
                              className="w-full border-b border-gray-400 py-1 focus:outline-none bg-transparent cursor-pointer"
                            >
                              {types.map((t) => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Giá</label>
                            <input
                              required type="number" placeholder="300000" value={roomForm.price}
                              onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                              className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Quy định</label>
                            <input
                              placeholder="Cấm hút thuốc, Cấm thú cưng" value={roomForm.rules}
                              onChange={(e) => setRoomForm({ ...roomForm, rules: e.target.value })}
                              className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Cơ sở / Tiện ích</label>
                            <input
                              placeholder="Wifi, Điều hòa, Nóng lạnh" value={roomForm.amenities}
                              onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                              className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Khu vực</label>
                            <input
                              placeholder="Tầng 1 / Ngoài vườn" value={roomForm.area}
                              onChange={(e) => setRoomForm({ ...roomForm, area: e.target.value })}
                              className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">Mô tả</label>
                          <textarea
                            rows={2} placeholder="Mô tả chi tiết phòng..." value={roomForm.description}
                            onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                            className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500 resize-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-2">Thêm hình ảnh</label>
                          <div className="flex flex-wrap gap-3">
                            {roomForm.images.map((imgUrl, idx) => (
                              <div key={idx} className="relative w-28 h-20 rounded-lg overflow-hidden border border-gray-300 group">
                                <img src={imgUrl} alt="Room" className="w-full h-full object-cover" />
                                <button
                                  type="button" onClick={() => handleRemoveImage(idx)}
                                  className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-80 hover:opacity-100"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            <label className="w-28 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-sky-500 hover:text-sky-500 transition-all bg-gray-50 cursor-pointer">
                              <Plus className="w-5 h-5 mb-1" />
                              <span className="text-xs font-semibold">+ Thêm ảnh</span>
                              <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t">
                          <button
                            type="button" onClick={() => setShowModal(false)}
                            className="px-6 py-2 rounded-lg bg-rose-300 text-rose-900 font-bold text-sm hover:bg-rose-400"
                          >
                            HỦY BỎ
                          </button>
                          <button
                            type="submit"
                            className="px-8 py-2 rounded-lg bg-sky-300 text-slate-900 font-bold text-sm hover:bg-sky-400"
                          >
                            LƯU
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB DỊCH VỤ */}
        {tab === "services" && (
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">Quản lý dịch vụ đi kèm</h2>
            
            {/* Form Thêm Dịch Vụ */}
            <form onSubmit={handleSaveService} className="bg-card border border-border p-6 rounded-xl mb-8 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Thêm dịch vụ mới</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <input
                  required
                  placeholder="Tên dịch vụ (VD: Thuê xe máy)"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="bg-secondary px-4 py-2 rounded-lg text-sm border border-border focus:outline-none"
                />
                <input
                  required
                  type="number"
                  placeholder="Đơn giá (VD: 150000)"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  className="bg-secondary px-4 py-2 rounded-lg text-sm border border-border focus:outline-none"
                />
                <input
                  required
                  placeholder="Đơn vị (VD: ngày, lượt, kg)"
                  value={serviceForm.unit}
                  onChange={(e) => setServiceForm({ ...serviceForm, unit: e.target.value })}
                  className="bg-secondary px-4 py-2 rounded-lg text-sm border border-border focus:outline-none"
                />
                <button type="submit" className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:opacity-90 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Thêm dịch vụ
                </button>
              </div>
            </form>

            {/* Bảng Dịch Vụ */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-3">Tên dịch vụ</th>
                    <th className="text-left p-3">Đơn giá</th>
                    <th className="text-left p-3">Đơn vị tính</th>
                    <th className="text-right p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="p-3 font-semibold">{s.name}</td>
                      <td className="p-3">{fmtVND(s.price)}</td>
                      <td className="p-3"><span className="bg-secondary px-2 py-1 rounded text-xs">{s.unit}</span></td>
                      <td className="p-3 text-right">
                        <button onClick={() => del("services", s.id)} className="text-rose-500 hover:opacity-80">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB KHÁCH HÀNG */}
        {tab === "customers" && (
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">Danh sách khách hàng</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-3">Tên khách hàng</th>
                    <th className="text-left p-3">Số điện thoại</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">CMND/CCCD</th>
                    <th className="text-right p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="p-3 font-semibold">{c.name || "Khách lẻ"}</td>
                      <td className="p-3">{c.phone || "---"}</td>
                      <td className="p-3">{c.email || "---"}</td>
                      <td className="p-3">{c.idCard || "---"}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => del("customers", c.id)} className="text-rose-500 hover:opacity-80">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-muted-foreground">Chưa có thông tin khách hàng.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB ĐẶT PHÒNG */}
        {tab === "bookings" && (
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">Tất cả đơn đặt phòng</h2>
            <BookingTable bookings={bookings} setStatus={setStatus} del={del} />
          </div>
        )}

        {/* TAB THỐNG KÊ */}
        {tab === "stats" && (
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">Thống kê doanh thu</h2>
            
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <Stat l="Tổng doanh thu thực tế" v={fmtVND(revenue)} />
              <Stat l="Tổng số đơn đã hoàn thành" v={bookings.filter(b => b.status === "checkedout").length} />
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-6">Doanh thu theo các tháng (VND)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <XAxis dataKey="m" />
                    <YAxis tickFormatter={(v) => `${v / 1000000}M`} />
                    <Tooltip formatter={(value) => [fmtVND(value), "Doanh thu"]} />
                    <Bar dataKey="v" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const Stat = ({ l, v }) => (
  <div className="bg-card border border-border rounded-xl p-6 text-center shadow-sm">
    <p className="text-muted-foreground text-sm font-semibold">{l}</p>
    <p className="font-display text-3xl font-extrabold text-primary mt-2">{v}</p>
  </div>
);

function BookingTable({ bookings, setStatus, del }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
      <table className="w-full text-sm min-w-[720px]">
        <thead className="bg-secondary">
          <tr>
            {["Mã", "Khách", "Phòng", "Nhận → Trả", "Tổng", "Trạng thái", "Thao tác"].map((h) => (
              <th key={h} className="text-left p-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t border-border hover:bg-secondary/30">
              <td className="p-3 font-semibold text-primary">{b.code}</td>
              <td className="p-3">{b.guestName}<br /><span className="text-xs text-muted-foreground">{b.guestPhone}</span></td>
              <td className="p-3">{b.roomTypeName}</td>
              <td className="p-3">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</td>
              <td className="p-3 font-semibold">{fmtVND(b.total)}</td>
              <td className="p-3">
                <select value={b.status} onChange={(e) => setStatus(b.id, e.target.value)} className="bg-secondary rounded-lg px-2 py-1 font-semibold cursor-pointer border border-border">
                  {Object.entries(ST).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </td>
              <td className="p-3">
                <button onClick={() => del("bookings", b.id)} className="text-rose-500 hover:opacity-80">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-6 text-muted-foreground">Chưa có đơn đặt phòng nào.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

