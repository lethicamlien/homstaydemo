import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import pb from "@/lib/pocketbaseClient";
import { fmtVND, fmtDate } from "@/lib/store";
import { CheckCircle2, Home, Printer } from "lucide-react";

export default function SuccessPage() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  useEffect(() => { pb.collection("bookings").getOne(id).then(setB).catch(() => {}); }, [id]);
  if (!b) return <div className="py-24 text-center">Đang tải...</div>;
  const P = ({ l, v }) => <div><p className="text-sm text-muted-foreground">{l}</p><p className="font-semibold">{v}</p></div>;
  const payLabel = b.payMethod === "transfer" ? "Chuyển khoản giữ phòng" : "Thanh toán khi nhận phòng";
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[hsl(200,40%,14%)] py-4 px-5 flex justify-end">
        <Link to="/" className="flex items-center gap-2 border border-white/40 text-white px-4 py-2 rounded-lg text-sm font-semibold"><Home className="w-4 h-4" />Về trang chủ</Link>
      </div>
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="bg-primary/15 rounded-t-2xl p-10 text-center">
          <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
          <h1 className="font-display text-3xl font-extrabold mt-3">Bạn đã đặt phòng thành công</h1>
          <p className="text-muted-foreground mt-2">Thông tin đặt phòng của bạn đã được ghi nhận. Vui lòng lưu lại thông tin đặt phòng!</p>
        </div>
        <div className="bg-card border border-border rounded-b-2xl p-8 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-display text-xl font-bold mb-4">Thông tin đặt phòng</h3>
            <div className="grid grid-cols-2 gap-4">
              <P l="Họ và tên" v={b.guestName} /><P l="Số điện thoại" v={b.guestPhone} />
              <P l="Email" v={b.guestEmail} /><P l="Số người" v={b.guests} />
              <P l="Tên phòng" v={b.roomCode} /><P l="Loại phòng" v={b.roomTypeName} />
              <P l="Ngày nhận" v={fmtDate(b.checkIn)} /><P l="Ngày trả" v={fmtDate(b.checkOut)} />
              <P l="Số ngày" v={b.nights} />
            </div>
          </div>
          <div className="md:border-l md:pl-8 border-border">
            <h3 className="font-display text-xl font-bold mb-4">Chi tiết thanh toán</h3>
            <div className="space-y-4">
              <P l="Phương thức" v={payLabel} />
              <P l="Tổng thanh toán" v={fmtVND(b.total)} />
              <div><p className="text-accent font-bold text-lg">Mã đặt phòng</p><p className="text-accent font-extrabold text-2xl">{b.code}</p></div>
            </div>
          </div>
        </div>
        <div className="text-center mt-6">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-secondary px-6 py-3 rounded-xl font-semibold"><Printer className="w-4 h-4" />Xuất hóa đơn</button>
        </div>
      </div>
    </div>
  );
}
