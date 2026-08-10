import pb from "@/lib/pocketbaseClient";

export const fmt = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";
export const fmtVND = (n) => (Number(n) || 0).toLocaleString("vi-VN") + " VNĐ";

export function nights(ci, co) {
  if (!ci || !co) return 1;
  const a = new Date(ci), b = new Date(co);
  const d = Math.round((b - a) / 86400000);
  return d > 0 ? d : 1;
}

export function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString("vi-VN");
}

export async function updateServiceQuantities(serviceItems = []) {
  if (!Array.isArray(serviceItems) || serviceItems.length === 0) return;

  for (const item of serviceItems) {
    const serviceId = item.serviceId || item.id;
    const count = Number(item.count ?? item.quantity ?? item.qty ?? 0);
    if (!serviceId || count <= 0) continue;

    const service = await pb.collection("services").getOne(serviceId);
    const available = Number(service?.quantity) || 0;
    const nextQuantity = available - count;
    if (nextQuantity < 0) {
      throw new Error(`Số lượng dịch vụ "${service?.name || serviceId}" không đủ.`);
    }

    await pb.collection("services").update(serviceId, {
      quantity: nextQuantity,
    });
  }
}

// overlap check: two ranges [aIn,aOut) and [bIn,bOut)
export function overlaps(aIn, aOut, bIn, bOut) {
  return new Date(aIn) < new Date(bOut) && new Date(bIn) < new Date(aOut);
}

export function genCode(prefix = "BK") {
  return prefix + Math.floor(1000 + Math.random() * 9000);
}

export const api = {
  rooms: () => pb.collection("rooms").getFullList({ expand: "room_type_id" }),
  roomTypes: () => pb.collection("room_types").getFullList({ sort: "price" }),
  services: () => pb.collection("services").getFullList({ sort: "created" }),
  bookings: () => pb.collection("bookings").getFullList({
    sort: "-created",
    expand: "roomCode,room_type_id",
  }),
  reviews: (roomCode) =>
    pb.collection("reviews").getFullList({
      sort: "-created",
      ...(roomCode ? { filter: pb.filter("roomCode = {:c}", { c: roomCode }) } : {}),
    }),
  customers: () =>
    pb.collection("users").getFullList({ filter: "role = 'customer' || role = ''", sort: "-created" }),
};
