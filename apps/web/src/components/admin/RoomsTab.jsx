import { useState } from "react";
import pb from "@/lib/pocketbaseClient";
import { fmt } from "@/lib/store";
import { Trash2, Edit, Power, Plus, X } from "lucide-react";

export default function RoomsTab({ rooms, types, del, load }) {
  const [subTab, setSubTab] = useState("roomList");
  const [showModal, setShowModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingTypeId, setEditingTypeId] = useState(null);

  const [typeForm, setTypeForm] = useState({ code: "", name: "", price: "", quantity: "" });
  
  // Mới: Lưu thêm `imageFiles` dạng File/Blob thực tế và `existingImages` cho ảnh cũ
  const [roomForm, setRoomForm] = useState({
    code: "",
    room_type_id: "",
    area: "Tầng 1",
    rules: "Cấm hút thuốc",
    amenities: "Wifi, Điều hòa",
    description: "Phòng tiện nghi tại Núi Homestay.",
    existingImages: [], 
    newFiles: [],       
    previewUrls: [],    
  });

  const toggleRoomStatus = async (room) => {
    const newStatus = room.status === "active" ? "inactive" : "active";
    try {
      await pb.collection("rooms").update(room.id, { status: newStatus });
      load();
    } catch {
      alert("Lỗi khi đổi trạng thái phòng!");
    }
  };

  // --- XỬ LÝ MODAL PHÒNG ---
  const handleOpenEditModal = (room) => {
    setEditingRoomId(room.id);
    const existing = Array.isArray(room.images) ? room.images : room.images ? [room.images] : [];
    
    setRoomForm({
      code: room.code || "",
      room_type_id: room.room_type_id || types[0]?.id || "",
      area: room.area || "Tầng 1",
      rules: Array.isArray(room.rules) ? room.rules.join(", ") : room.rules || "",
      amenities: Array.isArray(room.amenities) ? room.amenities.join(", ") : room.amenities || "",
      description: room.description || "",
      existingImages: existing,
      newFiles: [],
      previewUrls: [],
    });
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    if (subTab === "roomTypes") {
      setEditingTypeId(null);
      setTypeForm({ code: "", name: "", price: "", quantity: "" });
    } else {
      setEditingRoomId(null);
      setRoomForm({
        code: "",
        room_type_id: types[0]?.id || "",
        area: "Tầng 1",
        rules: "Cấm hút thuốc",
        amenities: "Wifi, Điều hòa",
        description: "Phòng tiện nghi tại Núi Homestay.",
        existingImages: [],
        newFiles: [],
        previewUrls: [],
      });
    }
    setShowModal(true);
  };

  // --- XỬ LÝ UPLOAD VA XÓA ẢNH TẠM THỜI ---
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setRoomForm((prev) => ({
      ...prev,
      newFiles: [...prev.newFiles, ...files],
      previewUrls: [...prev.previewUrls, ...newPreviews],
    }));
  };

  const handleRemoveExistingImage = (imgName) => {
    setRoomForm((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((name) => name !== imgName),
    }));
  };

  const handleRemoveNewImage = (index) => {
    setRoomForm((prev) => {
      URL.revokeObjectURL(prev.previewUrls[index]);
      return {
        ...prev,
        newFiles: prev.newFiles.filter((_, i) => i !== index),
        previewUrls: prev.previewUrls.filter((_, i) => i !== index),
      };
    });
  };

  // --- LƯU PHÒNG QUA FORMDATA ---
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      const amenitiesArr = roomForm.amenities.split(",").map((s) => s.trim()).filter(Boolean);
      const rulesArr = roomForm.rules.split(",").map((s) => s.trim()).filter(Boolean);

      const formData = new FormData();
      formData.append("code", roomForm.code);
      formData.append("room_type_id", roomForm.room_type_id);
      formData.append("area", roomForm.area);
      formData.append("description", roomForm.description);

      // Append mảng chuỗi
      amenitiesArr.forEach((item) => formData.append("amenities", item));
      rulesArr.forEach((item) => formData.append("rules", item));

      // Append tệp ảnh mới
      roomForm.newFiles.forEach((file) => {
        formData.append("images", file);
      });

      if (editingRoomId) {
        // Cập nhật mảng ảnh cũ giữ lại (PocketBase tự xóa ảnh không còn trong danh sách)
        roomForm.existingImages.forEach((imgName) => {
          formData.append("images", imgName);
        });
        await pb.collection("rooms").update(editingRoomId, formData);
      } else {
        formData.append("status", "active");
        formData.append("beds", "1 phòng ngủ");
        await pb.collection("rooms").create(formData);
      }

      setShowModal(false);
      load();
    } catch (err) {
      console.error("Lỗi khi lưu phòng:", err);
      alert("Có lỗi xảy ra khi lưu phòng!");
    }
  };

  // --- LƯU / CẬP NHẬT LOẠI PHÒNG ---
  const handleSaveRoomType = async (e) => {
    e.preventDefault();
    const formattedCode = typeForm.code.trim().toUpperCase();

    const isDuplicate = types.some((t) => {
      if (editingTypeId && t.id === editingTypeId) return false;
      return t.code && t.code.trim().toUpperCase() === formattedCode;
    });

    if (isDuplicate) {
      alert(`Mã loại phòng "${formattedCode}" đã tồn tại! Vui lòng nhập mã khác.`);
      return;
    }

    try {
      const payload = {
        code: formattedCode,
        name: typeForm.name,
        price: Number(typeForm.price),
        quantity: Number(typeForm.quantity),
      };

      if (editingTypeId) {
        await pb.collection("room_types").update(editingTypeId, payload);
      } else {
        await pb.collection("room_types").create({ ...payload, status: "active" });
      }

      setShowModal(false);
      setTypeForm({ code: "", name: "", price: "", quantity: "" });
      load();
      alert("Lưu loại phòng thành công!");
    } catch (err) {
      console.error("Lỗi PocketBase:", err);
      alert(`Lỗi khi lưu loại phòng: ${err.message}`);
    }
  };

  // --- HÀM TẠO URL ẢNH TỪ POCKETBASE ---
  const getImageUrl = (record, filename) => {
    if (!filename) return "";
    return pb.files.getUrl(record, filename);
  };

  return (
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
              {rooms.map((r) => {
                const roomType = r.expand?.room_type_id || types.find((t) => t.id === r.room_type_id);
                const firstImageName = Array.isArray(r.images) ? r.images[0] : r.images;

                return (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="p-3 font-semibold">{r.code}</td>
                    <td className="p-3">{roomType?.name || "N/A"}</td>
                    <td className="p-3">{fmt(roomType?.price || 0)}</td>
                    <td className="p-3">{r.area}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        r.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {r.status === "active" ? "Đang hoạt động" : "Ngừng kinh doanh"}
                      </span>
                    </td>
                    <td className="p-3">
                      {firstImageName ? (
                        <img
                          src={getImageUrl(r, firstImageName)}
                          alt="Room"
                          className="w-12 h-9 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-12 h-9 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400">
                          Ảnh
                        </div>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && subTab === "roomList" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-border text-slate-900 relative my-8">
            <h3 className="text-xl font-bold mb-6">
              {editingRoomId ? "Chỉnh sửa thông tin phòng" : "Thêm mới phòng"}
            </h3>

            <form onSubmit={handleSaveRoom} className="space-y-6">
              {/* Các trường input phòng */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Tên phòng</label>
                  <input
                    required placeholder="P001" value={roomForm.code}
                    onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value })}
                    className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Loại phòng ˅</label>
                  <select
                    value={roomForm.room_type_id}
                    onChange={(e) => setRoomForm({ ...roomForm, room_type_id: e.target.value })}
                    className="w-full border-b border-gray-400 py-1 focus:outline-none bg-transparent cursor-pointer"
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({fmt(t.price)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload & Khung hiển thị ảnh */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Thêm hình ảnh</label>
                <div className="flex flex-wrap gap-3">
                  {/* Hiển thị ảnh cũ đã lưu trên PocketBase */}
                  {roomForm.existingImages.map((imgName, idx) => (
                    <div key={`exist-${idx}`} className="relative w-28 h-20 rounded-lg overflow-hidden border border-gray-300 group">
                      <img
                        src={pb.files.getUrl({ id: editingRoomId, collectionName: "rooms" }, imgName)}
                        alt="Existing Room"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(imgName)}
                        className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-80 hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Hiển thị ảnh mới xem trước (Local preview) */}
                  {roomForm.previewUrls.map((url, idx) => (
                    <div key={`new-${idx}`} className="relative w-28 h-20 rounded-lg overflow-hidden border border-sky-400 group">
                      <img src={url} alt="New Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(idx)}
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
        </div>
      )}
    </>
  );
}