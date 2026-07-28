import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import { api, fmt } from "@/lib/store";
import DateInput from "@/components/DateInput";

// Lucide Icons
import {
  CalendarCheck,
  CalendarX,
  Users,
  Home,
  Search,
  Wifi,
  Tv,
  Snowflake,
  Flame,
  MapPin,
  ChevronRight,
  Phone,
  Mail,
  ChevronLeft,
} from "lucide-react";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Danh sách ảnh trình chiếu ở phần "Về chúng tôi"
const ABOUT_IMAGES = [
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1000",
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
];

function SearchBar({ onSearch }) {
  const [f, setF] = useState({ checkIn: "", checkOut: "", guests: 2, type: "" });

  return (
    <Card className="max-w-4xl mx-auto shadow-2xl border-border/50 bg-background/95 backdrop-blur">
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          {/* Ngày nhận */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-primary" />
              Ngày nhận
            </Label>
           <DateInput
  value={f.checkIn}
  onChange={(e) => setF({ ...f, checkIn: e.target.value })}
  className="bg-muted/50"
/>
          </div>

          {/* Ngày trả */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarX className="w-3.5 h-3.5 text-primary" />
              Ngày trả
            </Label>
           
<DateInput
  minDate={f.checkIn} 
  value={f.checkOut}
  onChange={(e) => setF({ ...f, checkOut: e.target.value })}
  className="bg-muted/50"
/>
          </div>

          {/* Số khách */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Số khách
            </Label>
            <Input
              type="number"
              min={1}
              value={f.guests}
              onChange={(e) => setF({ ...f, guests: e.target.value })}
              className="bg-muted/50"
            />
          </div>

          {/* Loại phòng */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-primary" />
              Loại phòng
            </Label>
            <Select
              value={f.type}
              onValueChange={(val) => setF({ ...f, type: val === "all" ? "" : val })}
            >
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Phòng đơn">Phòng đơn</SelectItem>
                <SelectItem value="Phòng đôi">Phòng đôi</SelectItem>
                <SelectItem value="Phòng gia đình">Phòng gia đình</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nút tìm kiếm */}
          <Button
            onClick={() => onSearch(f)}
            className="w-full font-semibold gap-2 shadow-md"
            size="lg"
          >
            <Search className="w-4 h-4" />
            Tìm kiếm
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  useEffect(() => {
    api
      .rooms()
      .then((r) => setRooms(r.slice(0, 3)))
      .catch(() => {});
  }, []);

  // Tự động chuyển ảnh ở phần "Về chúng tôi" mỗi 4 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % ABOUT_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const go = (f) => {
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
    nav("/rooms?" + q.toString());
  };

  const amenities = [
    { i: Wifi, t: "Wifi" },
    { i: Tv, t: "Tivi" },
    { i: Snowflake, t: "Điều hòa" },
    { i: Flame, t: "Nóng lạnh" },
  ];

  const nextImg = () => setCurrentImgIdx((prev) => (prev + 1) % ABOUT_IMAGES.length);
  const prevImg = () => setCurrentImgIdx((prev) => (prev - 1 + ABOUT_IMAGES.length) % ABOUT_IMAGES.length);

  return (
    <SiteLayout>
      {/* HERO SECTION */}
      <section className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-44 text-white text-center">
          <Badge
            variant="outline"
            className="text-amber-400 border-amber-400/50 bg-amber-400/10 font-bold tracking-widest uppercase mb-3 py-1 px-4 text-xs animate-fadeup"
          >
            Chào mừng đến Huế
          </Badge>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-balance animate-fadeup">
            Núi Homestay
          </h1>
          <p className="mt-4 text-base md:text-lg text-gray-200 max-w-xl mx-auto leading-relaxed animate-fadeup">
            Nghỉ dưỡng yên bình giữa thiên nhiên xanh mát, chỉ cách trung tâm cố đô 3,6km.
          </p>
        </div>

        {/* SEARCH BAR OVERLAP */}
        <div className="relative -mt-20 px-4 sm:px-6 pb-8 z-10">
          <SearchBar onSearch={go} />
        </div>
      </section>

      {/* PHÒNG NỔI BẬT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">
              Phòng nổi bật
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Khám phá không gian lưu trú thoải mái và ấm cúng nhất
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => nav("/rooms")}
            className="text-primary font-semibold hover:text-primary/80 gap-1"
          >
            Xem thêm <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

       {/* PHÒNG NỔI BẬT */}
{/* PHÒNG NỔI BẬT */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {rooms.map((r) => {
    // 📍 1. Bắt cả 2 dạng key expand của PocketBase (có _id và không có _id)
    const typeInfo = r.expand?.room_type_id || r.expand?.room_type;

    // 📍 2. Ưu tiên lấy giá từ loại phòng, nếu có
    const roomPrice = typeInfo?.price !== undefined ? typeInfo.price : r.price;

    // 📍 3. Lấy ảnh trực tiếp từ phòng
    const roomImage =
      r.images && r.images.length > 0
        ? r.images[0]
        : "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1000";

    return (
      <Card
        key={r.id}
        className="group overflow-hidden border-border/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          <div className="relative h-56 overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
              style={{ backgroundImage: `url(${roomImage})` }}
            />
            <Badge className="absolute top-3 right-3 font-mono" variant="secondary">
              {r.code}
            </Badge>
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold flex justify-between items-center">
              {typeInfo?.name || r.typeName}
            </CardTitle>
            <CardDescription className="text-sm">
              {r.beds || "Giường đôi"} · Phù hợp cho khách
            </CardDescription>
          </CardHeader>
        </div>

        <CardContent className="pt-0 space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-primary">
              {/* 📍 Hiển thị giá chuẩn đã xử lý */}
              {fmt(roomPrice)}
            </span>
            <span className="text-xs text-muted-foreground font-normal">/ đêm</span>
          </div>

          <Button
            onClick={() => nav("/rooms/" + r.id)}
            className="w-full font-semibold rounded-full"
          >
            Xem chi tiết
          </Button>
        </CardContent>
      </Card>
    );
  })}
</div>
      </section>

      {/* CÁC TIỆN NGHI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-extrabold">Các tiện nghi</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Trải nghiệm trọn vẹn với các tiện ích hiện đại
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {amenities.map((a) => (
            <Card
              key={a.t}
              className="border-border/60 hover:border-primary/50 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <a.i className="w-8 h-8" />
                </div>
                <span className="font-semibold text-sm">{a.t}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* VỀ CHÚNG TÔI (BỔ SUNG SLIDER ẢNH) */}
      <section
        id="gioi-thieu"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-10 items-center"
      >
        <div className="relative group h-80 rounded-2xl overflow-hidden shadow-lg border border-border/40">
          {/* Slider hình ảnh */}
          <div
            className="w-full h-full bg-cover bg-center transition-all duration-700 ease-in-out"
            style={{
              backgroundImage: `url(${ABOUT_IMAGES[currentImgIdx]})`,
            }}
          />

          {/* Nút lướt ảnh sang trái/phải */}
          <Button
            size="icon"
            variant="ghost"
            onClick={prevImg}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={nextImg}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Chấm chỉ số trang ảnh (Indicators) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {ABOUT_IMAGES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImgIdx(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentImgIdx ? "w-6 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30">
            Giới thiệu
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            Về chúng tôi
          </h2>
          <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
            Núi Homestay là điểm dừng chân lý tưởng cho những ai yêu thích sự yên tĩnh và gần gũi
            thiên nhiên. Với hệ thống phòng đầy đủ tiện nghi, dịch vụ chu đáo và vị trí thuận tiện,
            chúng tôi cam kết mang đến cho bạn kỳ nghỉ trọn vẹn tại Huế.
          </p>
          <div className="flex items-center gap-2 text-primary font-medium text-sm pt-2">
            <MapPin className="w-5 h-5 shrink-0" />
            <span>Cách trung tâm TP. Huế 3,6km</span>
          </div>
        </div>
      </section>

      {/* LIÊN HỆ (BỔ SUNG BẢN ĐỒ GOOGLE MAPS) */}
      <section id="lien-he" className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <Card className="border-border/60 overflow-hidden">
          <div className="grid md:grid-cols-3">
            {/* Khối thông tin liên hệ */}
            <div className="bg-primary/5 p-8 flex flex-col justify-center space-y-4 md:col-span-1">
              <div>
                <Badge variant="outline" className="text-primary border-primary/30 mb-2">
                  Liên hệ
                </Badge>
                <h2 className="font-display text-2xl font-extrabold">Núi Homestay</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Hãy liên hệ với chúng tôi nếu bạn cần tư vấn hoặc hỗ trợ đặt phòng.
                </p>
              </div>

              <div className="space-y-3 text-sm pt-2">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>035 356 600</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>Nuihomstay@gmail.com</span>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Thành phố Huế, Thừa Thiên Huế</span>
                </div>
              </div>
            </div>

            {/* Khối nhúng Google Maps */}
            <div className="h-64 md:h-auto min-h-[250px] md:col-span-2 relative bg-muted">
              <iframe
                title="Google Maps Nui Homestay"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d61244.577234839815!2d107.5458021486328!3d16.453388200000005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3141a13e2e2832c3%3A0x6271926c04f9828e!2zVGjDoG5oIHBo4buRIEh14bq_LCBUaOG7q2EgVGhpw6puIEh14bq_!5e0!3m2!1svi!2svn!4v1710000000000!5m2!1svi!2svn"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}