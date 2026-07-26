import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import Stat from "@/components/admin/Stat";
import { fmtVND } from "@/lib/store";

export default function StatsTab({ revenue, bookings, chart }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-6">Thống kê doanh thu</h2>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Stat l="Tổng doanh thu thực tế" v={fmtVND(revenue)} />
        <Stat l="Tổng số đơn đã hoàn thành" v={bookings.filter((b) => b.status === "checkedout").length} />
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
  );
}