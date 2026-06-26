import { Bell, AlertCircle, CheckCircle, Clock, Info } from "lucide-react";

const notifications = [
  { id: 1, type: "alert", message: "Sunita Patel achieved monthly target of 5 customers", time: "2 hours ago", read: false },
  { id: 2, type: "success", message: "New booking confirmed - ₹12L Green Valley Residency", time: "5 hours ago", read: false },
  { id: 3, type: "info", message: "Weekly performance report is ready", time: "1 day ago", read: true },
  { id: 4, type: "warning", message: "Amit Patel has 2 pending visit confirmations", time: "2 days ago", read: true },
];

export default function PMNotif() {
  const iconMap = { alert: AlertCircle, success: CheckCircle, info: Info, warning: Clock };

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-400 mt-0.5">Stay updated with team activities</p>
      </div>

      <div className="px-4 space-y-2">
        {notifications.map(n => {
          const Icon = iconMap[n.type] || Info;
          return (
            <div key={n.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-3 ${!n.read ? "border-l-4 border-l-blue-500" : ""}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                n.type === "success" ? "bg-green-100 text-green-600" :
                n.type === "alert" ? "bg-red-100 text-red-600" :
                n.type === "warning" ? "bg-orange-100 text-orange-600" :
                "bg-blue-100 text-blue-600"
              }`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? "text-gray-600" : "text-gray-900 font-semibold"}`}>{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}