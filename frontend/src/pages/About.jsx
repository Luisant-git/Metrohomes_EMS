const stack = [
  {
    name: "React 19",
    role: "Frontend UI Library",
    color: "bg-blue-100 text-blue-700",
    icon: "⚛️",
    description:
      "Component-based UI library for building interactive user interfaces. All files use .jsx extension.",
  },
  {
    name: "Vite",
    role: "Build Tool",
    color: "bg-yellow-100 text-yellow-700",
    icon: "⚡",
    description:
      "Next-generation frontend tooling with instant server start and lightning-fast HMR.",
  },
  {
    name: "Tailwind CSS v4",
    role: "Styling",
    color: "bg-cyan-100 text-cyan-700",
    icon: "🎨",
    description:
      "Utility-first CSS framework for building any design directly in your markup.",
  },
  {
    name: "Node.js",
    role: "Runtime",
    color: "bg-green-100 text-green-700",
    icon: "🟢",
    description:
      "JavaScript runtime built on Chrome's V8 engine — powers the backend server.",
  },
  {
    name: "Express.js",
    role: "Backend Framework",
    color: "bg-gray-100 text-gray-700",
    icon: "🚀",
    description:
      "Minimal and flexible Node.js web framework for building robust REST APIs.",
  },
];

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-3">About This Project</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          A full-stack template with a clear separation between frontend and backend,
          using modern tooling and best practices.
        </p>
      </div>

      {/* Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {[
          { emoji: "📂", title: "Separated Folders", desc: "frontend/ and backend/ are fully independent, making it easy to deploy or scale each layer separately." },
          { emoji: "💡", title: "JSX Only", desc: "All React components use .jsx extension for clarity, consistency and better IDE support." },
          { emoji: "🔗", title: "API-First", desc: "The backend exposes a REST API consumed by the frontend, enabling clean data flow." },
        ].map((p) => (
          <div key={p.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="text-4xl mb-3">{p.emoji}</div>
            <h3 className="font-semibold text-gray-800 mb-1">{p.title}</h3>
            <p className="text-gray-500 text-sm">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Tech Stack */}
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Tech Stack</h3>
      <div className="space-y-4">
        {stack.map((tech) => (
          <div key={tech.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <div className="text-3xl">{tech.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-800">{tech.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tech.color}`}>
                  {tech.role}
                </span>
              </div>
              <p className="text-gray-500 text-sm">{tech.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
