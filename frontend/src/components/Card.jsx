export default function Card({ icon, title, description, accent = "violet" }) {
  const accentMap = {
    violet: "from-violet-500 to-indigo-600 shadow-indigo-200",
    blue: "from-blue-500 to-cyan-500 shadow-blue-200",
    green: "from-emerald-500 to-teal-500 shadow-emerald-200",
    orange: "from-orange-400 to-rose-500 shadow-orange-200",
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentMap[accent]} shadow-lg flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
