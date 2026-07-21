const STATUS_MAP = {
  "Interested":       "bg-yellow-100 text-yellow-700",
  "Visit Scheduled":  "bg-blue-100 text-blue-700",
  "Visit Completed":  "bg-purple-100 text-purple-700",
  "Ready for Booking":"bg-orange-100 text-orange-700",
  "Booked":           "bg-green-100 text-green-700",
  "Payment Done":     "bg-emerald-100 text-emerald-700",
  "Dropped":          "bg-red-100 text-red-700",
  "Active":           "bg-green-100 text-green-700",
  "Inactive":         "bg-gray-100 text-gray-500",
  "Pending":          "bg-yellow-100 text-yellow-700",
  "Approved":         "bg-green-100 text-green-700",
  "Rejected":         "bg-red-100 text-red-700",
  "Residential":      "bg-blue-100 text-blue-700",
  "Commercial":       "bg-purple-100 text-purple-700",
  "Villa":            "bg-orange-100 text-orange-700",
  "Admin":            "bg-indigo-100 text-indigo-700",
  "Director":         "bg-blue-100 text-blue-700",
  "Regional Manager": "bg-purple-100 text-purple-700",
  "Branch Manager":   "bg-cyan-100 text-cyan-700",
  "BDM":              "bg-orange-100 text-orange-700",
  "Sales Manager":    "bg-green-100 text-green-700",
};

export default function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
