import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";

// Lucide Icons
import {
  CheckCircle2,
  Star,
  Ban,
  CalendarCheck,
  CalendarX,
  Users,
  Building2,
  BedDouble,
  Maximize2,
  AlertCircle,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// --- DỮ LIỆU GIẢ LẬP (MOCK DATA) ---
const fmt = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const getTodayString = () => new Date().toISOString().split("T")[0];

const MOCK_ROOM_DETAILS = {
  r1: {
    id: "r1",
    code: "101",
    typeName: "Phòng Single",
    price: 450000,
    area: "25 m²",
    beds: "1 giường đôi",
    description:
      "Phòng Single ấm cúng, thiết kế hiện đại, đầy đủ ánh sáng tự nhiên. Rất thích hợp cho các chuyến du lịch cá nhân hoặc cặp đôi muốn không gian riêng tư, yên tĩnh.",
    amenities: ["Wifi tốc độ cao", "Tivi 43 inch", "Điều hòa hai chiều", "Nóng lạnh", "Máy sấy tóc", "Trà & Cà phê miễn phí"],
    rules: ["Không hút thuốc trong phòng", "Không mang thú cưng", "Giữ trật tự sau 22:00"],
    images: [
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1000",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000",
    ],
  },
  r2: {
    id: "r2",
    code: "202",
    typeName: "Phòng Double",
    price: 750000,
    area: "35 m²",
    beds: "2 giường đôi",
    description:
      "Phòng Double rộng rãi với 2 giường đôi thoải mái, không gian thoáng đãng. Thích hợp cho nhóm bạn hoặc gia đình nhỏ lưu trú.",
    amenities: ["Wifi tốc độ cao", "Tivi Smart", "Điều hòa", "Nóng lạnh", "Tủ lạnh Minibar", "Máy sấy tóc"],
    rules: ["Không hút thuốc trong phòng", "Không mang thú cưng", "Giữ trật tự sau 22:00"],
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1000",
    ],
  },
  r3: {
    id: "r3",
    code: "303",
    typeName: "Phòng VIP",
    price: 1200000,
    area: "50 m²",
    beds: "1 giường King",
    description:
      "Phòng VIP đẳng cấp với tầm nhìn tuyệt đẹp, nội thất sang trọng và ban công riêng biệt. Lựa chọn hoàn hảo cho kỳ nghỉ dưỡng cao cấp.",
    amenities: ["Wifi tốc độ cao", "Tivi 55 inch", "Điều hòa", "Nóng lạnh", "Tủ lạnh Minibar", "Ban công ngắm cảnh", "Máy sấy tóc"],
    rules: ["Không hút thuốc trong phòng", "Không mang thú cưng", "Giữ trật tự sau 22:00"],
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000",
    ],
  },
};

const MOCK_REVIEWS = [
  {
    id: "rev1",
    author: "Nguyễn Văn A",
    rating: 5,
    comment: "Phòng sạch sẽ, không gian rất yên tĩnh đúng chất Huế. Chủ homestay nhiệt tình!",
    reply: "Cảm ơn bạn đã lựa chọn Núi Homestay. Hẹn gặp lại bạn lần sau nhé!",
  },
  {
    id: "rev2",
    author: "Trần Thị B",
    rating: 4,
    comment: "Tiện nghi đầy đủ, giường ngủ êm ái. Rất đáng giá tiền.",
    reply: null,
  },
];

export default function RoomDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const [room, setRoom] = useState(null);
  const [reviews] = useState(MOCK_REVIEWS);
  const [err, setErr] = useState("");
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const today = getTodayString();

  const [b, setB] = useState({
    checkIn: sp.get("checkIn") || "",
    checkOut: sp.get("checkOut") || "",
    guests: sp.get("guests") || 2,
    type: "",
  });

  // Tải dữ liệu phòng giả lập theo ID từ URL
  useEffect(() => {
    const selectedRoom = MOCK_ROOM_DETAILS[id] || MOCK_ROOM_DETAILS["r1"];
    setRoom(selectedRoom);
    setB((s) => ({ ...s, type: selectedRoom.typeName }));
  }, [id]);

  if (!room) {
    return (
      <SiteLayout>
        <div className="py-24 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Đang tải thông tin phòng...</span>
        </div>
      </SiteLayout>
    );
  }

  const handleCheckInChange = (e) => {
    const newCheckIn = e.target.value;
    if (b.checkOut && b.checkOut <= newCheckIn) {
      setB({ ...b, checkIn: newCheckIn, checkOut: "" });
    } else {
      setB({ ...b, checkIn: newCheckIn });
    }
  };

  const proceed = () => {
    setErr("");
    if (!b.checkIn || !b.checkOut) {
      return setErr("Vui lòng chọn ngày nhận và ngày trả.");
    }
    if (new Date(b.checkOut) <= new Date(b.checkIn)) {
      return setErr("Ngày trả phải sau ngày nhận.");
    }
    nav("/booking", { state: { room, ...b } });
  };

  const images = room.images || [];

  return (
    <SiteLayout>
      {/* KHU VỰC BÌA & GALLERY ẢNH */}
      <div className="bg-muted/40 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="relative h-[360px] md:h-[450px] rounded-2xl overflow-hidden shadow-sm">
            <div
              className="w-full h-full bg-cover bg-center transition-all duration-500"
              style={{ backgroundImage: `url(${images[activeImgIdx] || images[0]})` }}
            />
            <Badge className="absolute top-4 left-4 font-mono text-sm shadow-md" variant="secondary">
              #{room.code}
            </Badge>
          </div>

          {/* Danh sách ảnh thu nhỏ */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeImgIdx
                      ? "border-primary ring-2 ring-primary/20 scale-105"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${room.typeName} ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NỘI DUNG CHI TIẾT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: THÔNG TIN PHÒNG */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">{fmt(room.price)}</span>
              <span className="text-sm text-muted-foreground">/ đêm</span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-2">
              {room.typeName} · {room.code}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                <BedDouble className="w-4 h-4 text-primary" /> {room.beds}
              </span>
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                <Building2 className="w-4 h-4 text-primary" /> Phòng tắm riêng
              </span>
              {room.area && (
                <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                  <Maximize2 className="w-4 h-4 text-primary" /> {room.area}
                </span>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground text-sm md:text-base border-t pt-6">
              {room.description}
            </p>
          </div>

          {/* CÁC TIỆN ÍCH */}
          <div>
            <h3 className="font-display text-xl font-bold text-primary flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5" /> Tiện ích đi kèm
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(room.amenities || []).map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-2.5 p-3 rounded-xl border bg-card text-sm font-medium shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QUY ĐỊNH PHÒNG */}
          <div>
            <h3 className="font-display text-xl font-bold text-destructive flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5" /> Quy định lưu trú
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(room.rules || []).map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm font-medium text-destructive"
                >
                  <Ban className="w-4 h-4 shrink-0" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ĐÁNH GIÁ TỪ KHÁCH HÀNG */}
          <div>
            <h3 className="font-display text-xl font-bold text-primary flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" /> Đánh giá từ khách hàng ({reviews.length})
            </h3>

            <div className="space-y-4">
              {reviews.length === 0 && (
                <p className="text-muted-foreground italic text-sm py-4">
                  Chưa có đánh giá nào cho phòng này!
                </p>
              )}

              {reviews.map((rv) => (
                <Card key={rv.id} className="border-border/60">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{rv.author}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: rv.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-foreground/90">{rv.comment}</p>

                    {rv.reply && (
                      <div className="mt-3 pl-3 border-l-2 border-primary bg-primary/5 p-2 rounded-r-lg text-xs md:text-sm">
                        <span className="font-semibold text-primary">Núi Homestay:</span>{" "}
                        <span className="text-muted-foreground">{rv.reply}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG ĐẶT PHÒNG (STICKY) */}
        <div>
          <Card className="sticky top-20 shadow-lg border-primary/20 bg-card">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-xl text-center">Đặt phòng này</CardTitle>
              <CardDescription className="text-center text-xs">
                Chọn khoảng thời gian dự định lưu trú của bạn
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              {/* Ngày nhận */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-primary" /> Ngày nhận
                </Label>
                <Input
                  type="date"
                  min={today}
                  value={b.checkIn}
                  onChange={handleCheckInChange}
                  className="bg-background"
                />
              </div>

              {/* Ngày trả */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <CalendarX className="w-4 h-4 text-primary" /> Ngày trả
                </Label>
                <Input
                  type="date"
                  min={b.checkIn || today}
                  value={b.checkOut}
                  onChange={(e) => setB({ ...b, checkOut: e.target.value })}
                  className="bg-background"
                />
              </div>

              {/* Loại phòng (Readonly) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" /> Loại phòng
                </Label>
                <Input value={b.type} readOnly className="bg-muted/50 font-medium" />
              </div>

              {/* Số người */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Số lượng khách
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={b.guests}
                  onChange={(e) => setB({ ...b, guests: e.target.value })}
                  className="bg-background"
                />
              </div>

              {/* Thông báo lỗi */}
              {err && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{err}</AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                onClick={proceed}
                className="w-full font-semibold py-6 text-base rounded-xl shadow-md"
                size="lg"
              >
                Tiến hành đặt phòng
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}