import Card from "../components/Card.jsx";

const features = [
  {
    accent: "violet",
    title: "React Frontend",
    description:
      "Built with React 19 and Vite for blazing-fast HMR, JSX syntax, and a modern component-driven architecture.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    accent: "blue",
    title: "Express Backend",
    description:
      "Node.js + Express powers the REST API layer — handle routes, middleware, and data efficiently.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
  },
  {
    accent: "green",
    title: "Tailwind CSS",
    description:
      "Utility-first styling with Tailwind CSS v4 for rapid UI development with a consistent design system.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
      </svg>
    ),
  },
  {
    accent: "orange",
    title: "Clean Structure",
    description:
      "Organized into frontend/ and backend/ folders for clear separation of concerns and scalability.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <span className="inline-block bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
          Full-Stack Starter
        </span>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          React <span className="text-violet-600">+</span> Express
          <br />
          <span className="text-gray-400">Project Template</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          A clean, modern full-stack starter with a React frontend, Express backend,
          and Tailwind CSS — all organized for real-world scalability.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <a
            href="#"
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-md shadow-violet-200"
          >
            Get Started
          </a>
          <a
            href="#"
            className="border border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            View Docs
          </a>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <Card key={f.title} {...f} />
        ))}
      </div>

      {/* Folder Structure */}
      <div className="mt-16 bg-gray-900 rounded-2xl p-8 text-sm font-mono text-gray-300 shadow-xl">
        <p className="text-violet-400 mb-3 font-semibold text-base">📁 Project Structure</p>
        <pre className="leading-7">
{`project-root/
├── frontend/               ← React (Vite + JSX)
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── Card.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── About.jsx
│           └── ApiDemo.jsx
│
└── backend/                ← Node.js + Express
    ├── server.js
    └── routes/
        └── api.js`}
        </pre>
      </div>
    </div>
  );
}
