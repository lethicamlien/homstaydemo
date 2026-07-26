import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import DateInput from "@/components/DateInput";
import { api, fmt, overlaps } from "@/lib/store";

// Lucide Icons
import {
  Wifi,
  Tv,
  AirVent,
  ShowerHead,
  Coffee,
  Sparkles,
  BedDouble,
  Maximize,
  Search,
  CalendarCheck,
  CalendarX,
  Users,
  Home,
  Refrigerator,
  Wind,
} from "lucide-react";

// shadcn/ui components
import { Card, CardContent } from "@/components/ui/card";
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

const getTodayString = () => new Date().toISOString().split("T")[0];

// 🟢 Hàm ánh xạ Icon tự động theo tên tiện ích
const getAmenityIcon = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.includes("wifi") || lower.includes("mạng") || lower.includes("internet")) {
    return <Wifi className="w-3.5 h-3.5" />;
  }
  if (lower.includes("tivi") || lower.includes("tv")) {
    return <Tv className="w-3.5 h-3.5" />;
  }
  if (lower.includes("điều hòa") || lower.includes("máy lạnh") || lower.includes("ac")) {
    return <AirVent className="w-3.5 h-3.5" />;
  }
  if (lower.includes("nóng lạnh") || lower.includes("vòi sen") || lower.includes("tắm")) {
    return <ShowerHead className="w-3.5 h-3.5" />;
  }
  if (lower.includes("tủ lạnh") || lower.includes("minibar")) {
    return <Refrigerator className="w-3.5 h-3.5" />;
  }
  if (lower.includes("máy sấy") || lower.includes("quạt")) {
    return <Wind className="w-3.5 h-3.5" />;
  }
  if (lower.includes("cà phê") || lower.includes("trà") || lower.includes("ăn sáng")) {
    return <Coffee className="w-3.5 h-3.5" />;
  }
  return <Sparkles className="w-3.5 h-3.5" />;
};

export default function RoomsPage() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  const today = getTodayString();

  const [f, setF] = useState({
    checkIn: sp.get("checkIn") || "",
    checkOut: sp.get("checkOut") || "",
    guests: sp.get("guests") || "",
    type: sp.get("type") || "",
  });

  useEffect(() => {
    api.rooms().then(setRooms).catch(() => {});
    api.bookings().then(setBookings).catch(() => {});
  }, []);

  const handleCheckInChange = (e) => {
    const newCheckIn = e.target.value;
    if (f.checkOut && f.checkOut <= newCheckIn) {
      setF({ ...f, checkIn: newCheckIn, checkOut: "" });
    } else {
      setF({ ...f, checkIn: newCheckIn });
    }
  };

  const roomBusy = (code) => {
    if (!f.checkIn || !f.checkOut) return false;
    return bookings.some(
      (b) =>
        b.roomCode === code &&
        b.status !== "cancelled" &&
        overlaps(f.checkIn, f.checkOut, b.checkIn, b.checkOut)
    );
  };

  const list = rooms
    .filter((r) => r.status === "active")
    .filter((r) => !f.type || r.typeName === f.type)
    .filter((r) => !roomBusy(r.code));

  const apply = () => {
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
    setSp(q);
  };

  return (
    <SiteLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            Danh Sách Phòng
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Tìm kiếm không gian nghỉ dưỡng lý tưởng phù hợp với lịch trình của bạn
          </p>
        </div>

        {/* BỘ LỌC TÌM KIẾM */}
        <Card className="shadow-lg border-border/60 bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-primary" /> Ngày nhận
                </Label>
                <DateInput
                  minDate={today}
                  value={f.checkIn}
                  onChange={handleCheckInChange}
                  className="bg-muted/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <CalendarX className="w-3.5 h-3.5 text-primary" /> Ngày trả
                </Label>
                <DateInput
                  minDate={f.checkIn || today}
                  value={f.checkOut}
                  onChange={(e) => setF({ ...f, checkOut: e.target.value })}
                  className="bg-muted/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" /> Số khách
                </Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Số khách"
                  value={f.guests}
                  onChange={(e) => setF({ ...f, guests: e.target.value })}
                  className="bg-muted/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-primary" /> Loại phòng
                </Label>
                <Select
                  value={f.type || "all"}
                  onValueChange={(val) => setF({ ...f, type: val === "all" ? "" : val })}
                >
                  <SelectTrigger className="bg-muted/40">
                    <SelectValue placeholder="Tất cả loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    <SelectItem value="Phòng đơn">Phòng đơn</SelectItem>
                    <SelectItem value="Phòng đôi">Phòng đôi</SelectItem>
                    <SelectItem value="Phòng gia đình">Phòng gia đình</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={apply}
                className="w-full font-semibold gap-2 shadow-sm"
                size="lg"
              >
                <Search className="w-4 h-4" /> Tìm kiếm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DANH SÁCH PHÒNG */}
        <div className="space-y-6">
          {list.length === 0 && (
            <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border/80">
              <p className="text-muted-foreground font-medium">
                Không có phòng nào phù hợp với điều kiện tìm kiếm của bạn.
              </p>
            </div>
          )}

          {list.map((r) => (
            <Card
              key={r.id}
              className="overflow-hidden border-border/60 hover:shadow-xl transition-all duration-300 grid grid-cols-1 md:grid-cols-12"
            >
              <div className="md:col-span-4 h-64 md:h-full relative overflow-hidden bg-muted">
                <div
                  className="w-full h-full bg-cover bg-center hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url(${(r.images || [])[0]})` }}
                />
                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 font-mono text-xs shadow-md"
                >
                  #{r.code}
                </Badge>
              </div>

              <div className="md:col-span-8 p-6 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-2xl font-bold tracking-tight">
                        {r.typeName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {r.area && (
                          <span className="flex items-center gap-1.5">
                            <Maximize className="w-4 h-4 text-primary" /> {r.area}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <BedDouble className="w-4 h-4 text-primary" /> {r.beds}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-primary">
                        {fmt(r.price)}
                      </span>
                      <span className="text-xs text-muted-foreground block font-normal">
                        / đêm
                      </span>
                    </div>
                  </div>

                  {/* 🟢 Hiển thị các tiện ích với icon tương ứng */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(r.amenities || []).slice(0, 5).map((a) => (
                      <Badge
                        key={a}
                        variant="outline"
                        className="bg-primary/5 text-primary border-primary/20 gap-1.5 font-medium text-xs py-1 px-2.5"
                      >
                        {getAmenityIcon(a)}
                        <span>{a}</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/40 sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => nav("/rooms/" + r.id)}
                    className="rounded-full font-semibold px-6"
                  >
                    Xem chi tiết
                  </Button>
                  <Button
                    onClick={() => nav(`/rooms/${r.id}?book=1&${sp.toString()}`)}
                    className="rounded-full font-semibold px-6 shadow-sm"
                  >
                    Đặt phòng ngay
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}