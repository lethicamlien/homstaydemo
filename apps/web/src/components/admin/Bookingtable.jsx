import { Trash2 } from "lucide-react";
import { fmtVND, fmtDate } from "@/lib/store";

const ST = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checkedin: "Đang ở",
  checkedout: "Đã trả phòng",
  cancelled: "Đã hủy",
};

export default function BookingTable({ bookings, setStatus, del }) {
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